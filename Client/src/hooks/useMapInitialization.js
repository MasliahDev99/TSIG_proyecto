import { useEffect, useRef, useState } from 'react';
import Map from 'ol/Map';
import View from 'ol/View';
import TileLayer from 'ol/layer/Tile';
import OSM from 'ol/source/OSM';
import { fromLonLat } from 'ol/proj';
import Overlay from 'ol/Overlay';

/**
 * Hook personalizado para la inicialización y configuración de un mapa base de OpenLayers.
 * Versión corregida que evita el ciclo infinito de creación/destrucción.
 */
export const useMapInitialization = (mapTargetId, popupTargetId, initialViewOptions) => {
  const mapRef = useRef(null);
  const popupOverlayRef = useRef(null);
  const [isMapInitialized, setIsMapInitialized] = useState(false);
  const initializationAttempted = useRef(false);
  const isCleaningUp = useRef(false);

  // Inicialización del mapa con useEffect normal (no useLayoutEffect)
  useEffect(() => {
    // Evitar múltiples inicializaciones o si ya estamos limpiando
    if (initializationAttempted.current || mapRef.current || isCleaningUp.current) {
      console.log('🚫 Saltando inicialización: ya existe o limpiando');
      return;
    }

    // Función para intentar inicializar el mapa
    const tryInitialization = () => {
      const mapElement = document.getElementById(mapTargetId);
      const popupElement = document.getElementById(popupTargetId);

      console.log('🔍 Verificando elementos DOM:', {
        mapElement: !!mapElement,
        popupElement: !!popupElement,
        mapTargetId,
        popupTargetId,
        mapElementDimensions: mapElement ? `${mapElement.offsetWidth}x${mapElement.offsetHeight}` : 'N/A'
      });

      if (!mapElement || !popupElement) {
        console.log('⏳ Elementos DOM no encontrados, reintentando en 100ms...');
        return false;
      }

      // Verificar que el elemento tiene dimensiones
      if (mapElement.offsetWidth === 0 || mapElement.offsetHeight === 0) {
        console.log('⏳ Elemento del mapa sin dimensiones, reintentando en 100ms...');
        return false;
      }

      try {
        console.log('🗺️ Inicializando mapa de OpenLayers...');
        initializationAttempted.current = true;

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
        return true;

      } catch (error) {
        console.error('❌ Error inicializando el mapa:', error);
        initializationAttempted.current = false;
        return false;
      }
    };

    // Intentar inicialización inmediata
    if (!tryInitialization()) {
      // Si falla, intentar varias veces con intervalos
      let attempts = 0;
      const maxAttempts = 10;
      const interval = setInterval(() => {
        attempts++;
        
        if (attempts > maxAttempts) {
          console.error('❌ Máximo de intentos alcanzado para inicializar el mapa');
          clearInterval(interval);
          return;
        }

        if (tryInitialization()) {
          clearInterval(interval);
        }
      }, 100);

      // Limpieza del intervalo
      return () => {
        clearInterval(interval);
      };
    }

    // Función de limpieza
    return () => {
      console.log('🧹 Iniciando limpieza del mapa...');
      isCleaningUp.current = true;
      
      if (mapRef.current) {
        console.log('🗺️ Destruyendo instancia del mapa');
        mapRef.current.setTarget(null);
        mapRef.current.dispose();
        mapRef.current = null;
      }
      
      if (popupOverlayRef.current) {
        popupOverlayRef.current = null;
      }
      
      setIsMapInitialized(false);
      initializationAttempted.current = false;
      
      // Pequeño delay antes de permitir nueva inicialización
      setTimeout(() => {
        isCleaningUp.current = false;
      }, 50);
    };
  }, []); // Dependencias vacías para evitar re-inicializaciones

  const getMap = () => mapRef.current;

  return { mapRef, popupOverlayRef, getMap, isMapInitialized };
};