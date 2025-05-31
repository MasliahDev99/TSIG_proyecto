import { useEffect, useRef } from 'react';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import { Feature } from 'ol';
import { Point, LineString } from 'ol/geom';
import { fromLonLat } from 'ol/proj';

/**
 * Hook personalizado para gestionar una VectorLayer de OpenLayers.
 * Versión corregida que maneja mejor los datos transformados.
 */
export const useVectorLayer = (mapInstance, data, options = {}) => {
  const layerRef = useRef(null);
  const sourceRef = useRef(null);

  const { styleFunction, layerName, zIndex } = options;

  // Inicializar la capa
  useEffect(() => {
    if (!mapInstance || layerRef.current) {
      return;
    }

    console.log(`🔧 Inicializando capa vectorial: ${layerName}`);

    try {
      sourceRef.current = new VectorSource();
      const vectorLayer = new VectorLayer({
        source: sourceRef.current,
        style: styleFunction,
        zIndex: zIndex,
      });

      if (layerName) {
        vectorLayer.set('name', layerName);
      }

      mapInstance.addLayer(vectorLayer);
      layerRef.current = vectorLayer;

      console.log(`✅ Capa ${layerName} inicializada correctamente`);
    } catch (error) {
      console.error(`❌ Error inicializando capa ${layerName}:`, error);
    }

    // Limpieza
    return () => {
      if (mapInstance && layerRef.current) {
        console.log(`🧹 Limpiando capa: ${layerName}`);
        mapInstance.removeLayer(layerRef.current);
        layerRef.current = null;
        sourceRef.current = null;
      }
    };
  }, [mapInstance, styleFunction, layerName, zIndex]);

  // Actualizar features cuando los datos cambian
  useEffect(() => {
    if (!sourceRef.current) {
      console.log(`⏳ Fuente no disponible para ${layerName}, esperando...`);
      return;
    }

    if (!data || !Array.isArray(data)) {
      console.log(`📊 No hay datos para ${layerName}:`, data);
      return;
    }

    console.log(`📊 Actualizando features con datos: ${data.length} elementos`);

    // Limpiar features existentes
    sourceRef.current.clear();
    
    const features = data.map((item, index) => {
      try {
        let geometry;
        
        // Determinar el tipo de geometría basado en el tipo de dato
        if (item.type === 'stop' || item.type === 'point') {
          // Para paradas: crear Point
          if (item.coordinates && Array.isArray(item.coordinates) && item.coordinates.length >= 2) {
            geometry = new Point(fromLonLat([item.coordinates[0], item.coordinates[1]]));
          } else if (item.lng !== undefined && item.lat !== undefined) {
            geometry = new Point(fromLonLat([item.lng, item.lat]));
          }
        } else if (item.type === 'line' || item.type === 'linestring') {
          // Para líneas: crear LineString
          if (item.coordinates && Array.isArray(item.coordinates)) {
            // Verificar si es un array de coordenadas
            if (item.coordinates.length > 0 && Array.isArray(item.coordinates[0])) {
              const transformedCoords = item.coordinates.map(coord => 
                Array.isArray(coord) && coord.length >= 2 ? fromLonLat([coord[0], coord[1]]) : coord
              );
              geometry = new LineString(transformedCoords);
            }
          }
        }

        if (!geometry) {
          console.warn(`⚠️ No se pudo crear geometría para el elemento ${index}:`, item);
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

        return feature;
      } catch (error) {
        console.error(`❌ Error creando feature ${index}:`, error, item);
        return null;
      }
    }).filter(Boolean); // Filtrar features válidas

    console.log(`✅ Features válidas creadas: ${features.length}`);

    if (features.length > 0) {
      sourceRef.current.addFeatures(features);
      console.log(`🎯 ${features.length} features añadidas a la capa ${layerName}`);
    } else {
      console.warn(`⚠️ No se pudieron crear features para la capa ${layerName}`);
    }

  }, [data, layerName]);

  return layerRef.current;
};