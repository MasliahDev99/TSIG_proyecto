import { useEffect, useRef, useState } from 'react';
import Map from 'ol/Map';
import View from 'ol/View';
import TileLayer from 'ol/layer/Tile';
import OSM from 'ol/source/OSM';
import { fromLonLat } from 'ol/proj';
import Overlay from 'ol/Overlay';

/**
 * @typedef {Object} MapInitializationResult
 * @property {React.MutableRefObject<Map | null>} mapRef - Referencia al objeto Map de OpenLayers gestionado por este hook.
 * @property {React.MutableRefObject<Overlay | null>} popupOverlayRef - Referencia al objeto Overlay de OpenLayers para popups, gestionado por este hook.
 * @property {Function} getMap - Función que retorna la instancia actual del objeto Map.
 * @property {boolean} isMapInitialized - Estado booleano que indica si la inicialización del mapa ha concluido.
 */

/**
 * Hook personalizado para la inicialización y configuración de un mapa base de OpenLayers.
 *
 * Este hook se encarga de la creación de la instancia del mapa (Map), la configuración
 * de su vista inicial (View), la adición de una capa base de teselas (TileLayer con OSM)
 * y la preparación de un Overlay para la visualización de popups. Gestiona también
 * la correcta liberación de los recursos del mapa cuando el componente que lo utiliza
 * es desmontado, previniendo fugas de memoria.
 *
 * @param {string} mapTargetId - Identificador (ID) del elemento div en el DOM donde se renderizará el mapa.
 * @param {string} popupTargetId - Identificador (ID) del elemento div en el DOM que actuará como contenedor para el popup.
 * @param {Object} initialViewOptions - Objeto de configuración para la vista inicial del mapa.
 * @param {number[]} initialViewOptions.center - Coordenadas [longitud, latitud] para el centro inicial de la vista del mapa.
 * @param {number} initialViewOptions.zoom - Nivel de zoom inicial para la vista del mapa.
 * @returns {MapInitializationResult} Un objeto que contiene referencias al mapa y al overlay, una función para acceder al mapa y el estado de inicialización.
 *
 * @example
 * // Uso del hook en un componente:
 * const {
 *   mapRef, // Se puede usar para acceder directamente al mapa si es necesario, aunque se prefiere getMap()
 *   popupOverlayRef, // Referencia al overlay del popup
 *   getMap, // Función para obtener la instancia del mapa de forma segura
 *   isMapInitialized // Booleano para verificar si el mapa está listo
 * } = useMapInitialization('map-div-id', 'popup-div-id', {
 *   center: [-56.1646, -34.9011], // Coordenadas para Montevideo
 *   zoom: 13
 * });
 *
 * // En la estructura JSX del componente:
 * // <div id="map-div-id" style={{ width: '100%', height: '400px' }} />
 * // <div id="popup-div-id" />
 *
 * // Ejemplo de cómo interactuar con el mapa una vez inicializado:
 * // useEffect(() => {
 * //   if (isMapInitialized) {
 * //     const mapInstance = getMap();
 * //     if (mapInstance) {
 * //       // mapInstance.addLayer(...); // Añadir capas adicionales, etc.
 * //     }
 * //   }
 * // }, [isMapInitialized, getMap]);
 */
export const useMapInitialization = (mapTargetId, popupTargetId, initialViewOptions) => {
  const mapRef = useRef(null);
  const popupOverlayRef = useRef(null);
  const [isMapInitialized, setIsMapInitialized] = useState(false);

  useEffect(() => {
    let map; // Declarar la variable map aquí para que sea accesible en la limpieza del efecto
    if (!mapRef.current && document.getElementById(mapTargetId) && document.getElementById(popupTargetId)) {
      map = new Map({
        target: mapTargetId,
        layers: [
          new TileLayer({
            source: new OSM(),
          }),
        ],
        view: new View({
          center: fromLonLat(initialViewOptions.center),
          zoom: initialViewOptions.zoom,
        }),
        controls: [], // Inicializa sin controles por defecto; se pueden añadir explícitamente.
      });

      const popupOverlay = new Overlay({
        element: document.getElementById(popupTargetId),
        autoPan: {
          animation: {
            duration: 250,
          },
        },
      });
      map.addOverlay(popupOverlay);

      mapRef.current = map;
      popupOverlayRef.current = popupOverlay;
      setIsMapInitialized(true);
    }

    return () => {
      // La variable 'map' de este scope de useEffect no es la misma que mapRef.current.
      // Se debe usar mapRef.current para la limpieza.
      if (mapRef.current) {
        mapRef.current.setTarget(null);
        mapRef.current.dispose();
        mapRef.current = null;
        // El overlay se desasocia automáticamente cuando se dispone el mapa al que fue añadido.
        // Limpiar la referencia es una buena práctica.
        if (popupOverlayRef.current) {
            popupOverlayRef.current = null;
        }
        setIsMapInitialized(false);
      }
    };
  }, [mapTargetId, popupTargetId, initialViewOptions]);

  const getMap = () => mapRef.current;

  return { mapRef, popupOverlayRef, getMap, isMapInitialized };
};
