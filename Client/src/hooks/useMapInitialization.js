import { useEffect, useRef, useState, useLayoutEffect } from 'react';
import Map from 'ol/Map';
import View from 'ol/View';
import TileLayer from 'ol/layer/Tile';
import OSM from 'ol/source/OSM';
import { fromLonLat } from 'ol/proj';
import Overlay from 'ol/Overlay';

/**
 * Hook personalizado para la inicialización y configuración de un mapa base de OpenLayers.
 * Versión mejorada que maneja mejor la sincronización con el DOM.
 */
export const useMapInitialization = (mapTargetId, popupTargetId, initialViewOptions) => {
  const mapRef = useRef(null);
  const popupOverlayRef = useRef(null);
  const [isMapInitialized, setIsMapInitialized] = useState(false);
  const initializationAttempted = useRef(false);

  // Usar useLayoutEffect para asegurar que el DOM esté listo
  useLayoutEffect(() => {
    // Evitar múltiples inicializaciones
    if (initializationAttempted.current || mapRef.current) {
      return;
    }

    const mapElement = document.getElementById(mapTargetId);
    const popupElement = document.getElementById(popupTargetId);

    console.log('🔍 Verificando elementos DOM:', {
      mapElement: !!mapElement,
      popupElement: !!popupElement,
      mapTargetId,
      popupTargetId
    });

    if (!mapElement || !popupElement) {
      console.log('⏳ Elementos DOM no encontrados, esperando...');
      // Si los elementos no existen, intentar en el próximo tick
      const timeoutId = setTimeout(() => {
        initializationAttempted.current = false;
      }, 50);
      
      return () => clearTimeout(timeoutId);
    }

    initializationAttempted.current = true;

    try {
      console.log('🗺️ Inicializando mapa de OpenLayers...');

      // Crear el mapa
      const map = new Map({
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
        controls: [],
      });

      // Crear el overlay del popup
      const popupOverlay = new Overlay({
        element: popupElement,
        autoPan: {
          animation: {
            duration: 250,
          },
        },
        positioning: 'bottom-center',
        stopEvent: false,
        offset: [0, -10]
      });

      map.addOverlay(popupOverlay);

      // Guardar referencias
      mapRef.current = map;
      popupOverlayRef.current = popupOverlay;

      console.log('✅ Mapa inicializado correctamente');
      setIsMapInitialized(true);

    } catch (error) {
      console.error('❌ Error inicializando el mapa:', error);
      initializationAttempted.current = false;
    }

    // Función de limpieza
    return () => {
      console.log('🧹 Limpiando mapa...');
      if (mapRef.current) {
        mapRef.current.setTarget(null);
        mapRef.current.dispose();
        mapRef.current = null;
      }
      if (popupOverlayRef.current) {
        popupOverlayRef.current = null;
      }
      setIsMapInitialized(false);
      initializationAttempted.current = false;
    };
  }, [mapTargetId, popupTargetId, initialViewOptions.center, initialViewOptions.zoom]);

  const getMap = () => mapRef.current;

  return { mapRef, popupOverlayRef, getMap, isMapInitialized };
};