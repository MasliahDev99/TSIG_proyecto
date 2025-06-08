import { useEffect, useRef } from 'react';
import VectorLayer from 'ol/layer/Vector';
import VectorSource from 'ol/source/Vector';
import { Feature } from 'ol';
import { Point, LineString } from 'ol/geom'; // u otras geometrías según sea necesario
import { fromLonLat } from 'ol/proj';


/**
 * @typedef {Object} FeatureData
 * @property {string|number} id - Identificador único para la feature (elemento geográfico).
 * @property {number[]} coordinates - Coordenadas para la feature (ej., [lon, lat] para Point, [[lon, lat], ...] para LineString).
 * @property {string} type - Tipo de feature (ej., 'stop', 'line') para determinar la geometría y el estilo.
 * @property {Object} properties - Otras propiedades de la feature.
 */

/**
 * @typedef {Object} VectorLayerOptions
 * @property {string} [layerName] - Un nombre para la capa (opcional).
 * @property {Function} [styleFunction] - Una función que devuelve un Style de OpenLayers o un array de Styles para una feature.
 *                                       // (feature: Feature) => Style | Style[]
 * @property {number} [zIndex] - El índice z para la capa (controla el orden de apilamiento visual).
 */

/**
 * Hook personalizado para gestionar una VectorLayer de OpenLayers.
 *
 * Este hook encapsula la creación, actualización y eliminación de una capa vectorial
 * en una instancia de mapa de OpenLayers. Reacciona a los cambios en los datos proporcionados
 * para actualizar las features (elementos geográficos) en la capa.
 *
 * @param {import('ol/Map').default|null} mapInstance - La instancia del mapa de OpenLayers a la que se agregará la capa.
 * @param {FeatureData[]} data - Un array de objetos de datos que se representarán como features en la capa.
 * @param {VectorLayerOptions} [options={}] - Configuración opcional para la capa vectorial.
 * @returns {VectorLayer|null} La instancia de VectorLayer de OpenLayers creada, o null si aún no se ha creado.
 *
 * @example
 * const MiComponenteDeMapa = () => {
 *   const map = useMapInitialization(); // Suponiendo un hook que proporciona la instancia del mapa
 *   const { stops } = useMapData();      // Suponiendo un hook que obtiene datos de paradas
 *
 *   const funcionEstiloParada = (feature) => new Style({
 *     image: new Circle({
 *       radius: 6,
 *       fill: new Fill({ color: feature.get('enabled') ? 'green' : 'red' }),
 *       stroke: new Stroke({ color: 'white', width: 2 }),
 *     }),
 *   });
 *
 *   const capaParadas = useVectorLayer(map, stops, { styleFunction: funcionEstiloParada, layerName: 'Capa de Paradas' });
 *
 *   return <div id="map" style={{ width: '100%', height: '400px' }}></div>;
 * };
 */
export const useVectorLayer = (mapInstance, data, options = {}) => {
  const layerRef = useRef(null); // Referencia a la capa vectorial
  const sourceRef = useRef(null); // Referencia a la fuente de datos de la capa

  const { styleFunction, layerName, zIndex } = options;

  // Inicializar la capa
  useEffect(() => {
    if (mapInstance && !layerRef.current) {
      sourceRef.current = new VectorSource();
      const vectorLayer = new VectorLayer({
        source: sourceRef.current,
        style: styleFunction, // Aplicar la función de estilo proporcionada
        zIndex: zIndex,       // Establecer el z-index
      });
      if (layerName) {
        vectorLayer.set('name', layerName); // Establecer un nombre para la capa si se proporciona
      }
      mapInstance.addLayer(vectorLayer); // Añadir la capa al mapa
      layerRef.current = vectorLayer;

      // Limpieza: eliminar la capa cuando el componente se desmonta o mapInstance cambia
      return () => {
        if (mapInstance && layerRef.current) {
          mapInstance.removeLayer(layerRef.current);
          layerRef.current = null;
          sourceRef.current = null;
        }
      };
    }
  }, [mapInstance, styleFunction, layerName, zIndex]); // Dependencias del efecto

  // Actualizar features cuando los datos cambian
  useEffect(() => {
    if (sourceRef.current && data) {
      sourceRef.current.clear(); // Limpiar features existentes
      
      const features = data.map(item => {
        let geometry;
        // Asumiendo que 'coordinates' es [lon, lat] para puntos
        // y [[lon, lat], [lon, lat], ...] para cadenas de líneas (linestrings)
        // Esta parte necesita adaptarse según la estructura real de tus datos
        if (item.type === 'point' || item.type === 'stop') { // Tipos de ejemplo
          geometry = new Point(fromLonLat(item.coordinates));
        } else if (item.type === 'linestring' || item.type === 'line') {
          geometry = new LineString(item.coordinates.map(coord => fromLonLat(coord)));
        }
        // Añadir otros tipos de geometría según sea necesario

        if (geometry) {
          // Crear una nueva feature con su geometría y propiedades
          const feature = new Feature({ 
            geometry, 
            ...item.properties, // Expandir propiedades adicionales
            id: item.id,        // Asignar ID
            type: item.type     // Asignar tipo
          });
          return feature;
        }
        return null;
      }).filter(Boolean); // Filtrar nulos si alguna geometría no se pudo crear
      
      if (features.length > 0) {
        sourceRef.current.addFeatures(features); // Añadir las nuevas features a la fuente de datos
      }
    }
  }, [data, styleFunction]); // Dependencias del efecto (re-ejecutar si los datos o la función de estilo cambian)

  return layerRef.current; // Devolver la instancia de la capa
};
