import { useEffect, useRef, useState } from 'react';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import { Feature } from 'ol';
import { Point, LineString } from 'ol/geom';
import { fromLonLat } from 'ol/proj';

/**
 * Hook personalizado para gestionar una VectorLayer de OpenLayers.
 * Versión corregida que maneja mejor la sincronización de datos.
 */
export const useVectorLayer = (mapInstance, data, options = {}) => {
  const layerRef = useRef(null);
  const sourceRef = useRef(null);
  const [isLayerReady, setIsLayerReady] = useState(false);

  const { styleFunction, layerName, zIndex } = options;

  // Efecto 1: Inicializar la capa cuando el mapa esté disponible
  useEffect(() => {
    if (!mapInstance) {
      console.log(`⏳ ${layerName}: Esperando mapa...`);
      return;
    }

    if (layerRef.current) {
      console.log(`✅ ${layerName}: Capa ya existe`);
      return;
    }

    console.log(`🔧 Inicializando capa vectorial: ${layerName}`);

    try {
      // Crear fuente vectorial
      const vectorSource = new VectorSource();
      sourceRef.current = vectorSource;

      // Crear capa vectorial
      const vectorLayer = new VectorLayer({
        source: vectorSource,
        style: styleFunction,
        zIndex: zIndex,
      });

      if (layerName) {
        vectorLayer.set('name', layerName);
      }

      // Añadir capa al mapa
      mapInstance.addLayer(vectorLayer);
      layerRef.current = vectorLayer;

      console.log(`✅ Capa ${layerName} inicializada correctamente`);
      setIsLayerReady(true);

    } catch (error) {
      console.error(`❌ Error inicializando capa ${layerName}:`, error);
      setIsLayerReady(false);
    }

    // Limpieza
    return () => {
      if (mapInstance && layerRef.current) {
        console.log(`🧹 Limpiando capa: ${layerName}`);
        mapInstance.removeLayer(layerRef.current);
        layerRef.current = null;
        sourceRef.current = null;
        setIsLayerReady(false);
      }
    };
  }, [mapInstance, styleFunction, layerName, zIndex]);

  // Efecto 2: Actualizar features cuando los datos cambien Y la capa esté lista
  useEffect(() => {
    if (!isLayerReady || !sourceRef.current) {
      console.log(`⏳ ${layerName}: Capa no lista, esperando...`);
      return;
    }

    if (!data || !Array.isArray(data) || data.length === 0) {
      console.log(`📊 ${layerName}: No hay datos para mostrar`);
      sourceRef.current.clear();
      return;
    }

    console.log(`📊 ${layerName}: Procesando ${data.length} elementos`);

    // Limpiar features existentes
    sourceRef.current.clear();
    
    const features = data.map((item, index) => {
      try {
        let geometry;
        
        console.log(`🔄 ${layerName}: Procesando elemento ${index}:`, {
          id: item.id,
          type: item.type,
          hasCoordinates: !!item.coordinates,
          coordinates: item.coordinates,
          lat: item.lat,
          lng: item.lng
        });
        
        // Determinar el tipo de geometría basado en el tipo de dato
        if (item.type === 'stop' || item.type === 'point') {
          // Para paradas: crear Point
          if (item.coordinates && Array.isArray(item.coordinates) && item.coordinates.length >= 2) {
            const coords = fromLonLat([item.coordinates[0], item.coordinates[1]]);
            geometry = new Point(coords);
            console.log(`📍 ${layerName}: Point creado para ${item.id} en:`, coords);
          } else if (item.lng !== undefined && item.lat !== undefined) {
            const coords = fromLonLat([item.lng, item.lat]);
            geometry = new Point(coords);
            console.log(`📍 ${layerName}: Point creado para ${item.id} (lat/lng) en:`, coords);
          }
        } else if (item.type === 'line' || item.type === 'linestring') {
          // Para líneas: crear LineString
          if (item.coordinates && Array.isArray(item.coordinates) && item.coordinates.length > 0) {
            
            console.log(`🔄 ${layerName}: Coordenadas de línea:`, item.coordinates);
            
            // Verificar si es un array de coordenadas (LineString) o array de arrays (Polygon)
            let lineCoords = item.coordinates;
            
            // Si es un Polygon (array de arrays de coordenadas), usar el primer anillo
            if (Array.isArray(item.coordinates[0]) && Array.isArray(item.coordinates[0][0])) {
              lineCoords = item.coordinates[0]; // Primer anillo del polígono
              console.log(`🔄 ${layerName}: Usando primer anillo del polígono:`, lineCoords);
            }
            
            // Transformar coordenadas a proyección del mapa
            if (lineCoords.length > 1 && Array.isArray(lineCoords[0])) {
              const transformedCoords = lineCoords.map(coord => {
                if (Array.isArray(coord) && coord.length >= 2) {
                  return fromLonLat([coord[0], coord[1]]);
                } else {
                  console.warn(`⚠️ ${layerName}: Coordenada inválida:`, coord);
                  return null;
                }
              }).filter(Boolean);
              
              if (transformedCoords.length > 1) {
                geometry = new LineString(transformedCoords);
                console.log(`🚌 ${layerName}: LineString creado para ${item.id} con ${transformedCoords.length} puntos`);
              }
            }
          }
        }

        if (!geometry) {
          console.warn(`⚠️ ${layerName}: No se pudo crear geometría para el elemento ${index}:`, {
            id: item.id,
            type: item.type,
            coordinates: item.coordinates
          });
          return null;
        }

        // Crear la feature con todas las propiedades
        const feature = new Feature({
          geometry,
          id: item.id,
          type: item.type,
          name: item.name || item.description,
          enabled: item.enabled,
          ...item.properties // Incluir propiedades adicionales
        });

        console.log(`✅ ${layerName}: Feature creada para ${item.id}`);
        return feature;

      } catch (error) {
        console.error(`❌ ${layerName}: Error creando feature ${index}:`, error, item);
        return null;
      }
    }).filter(Boolean); // Filtrar features válidas

    console.log(`✅ ${layerName}: ${features.length} features válidas de ${data.length} elementos`);

    if (features.length > 0) {
      sourceRef.current.addFeatures(features);
      console.log(`🎯 ${layerName}: ${features.length} features añadidas al mapa`);
      
      // Log de verificación para debugging
      console.log(`🔍 ${layerName}: Verificación final:`, {
        sourceFeatures: sourceRef.current.getFeatures().length,
        layerVisible: layerRef.current?.getVisible(),
        layerOpacity: layerRef.current?.getOpacity()
      });
    } else {
      console.warn(`⚠️ ${layerName}: No se pudieron crear features válidas`);
    }

  }, [data, isLayerReady, layerName]);

  return layerRef.current;
};