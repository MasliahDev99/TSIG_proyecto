import { useState, useRef, useEffect, useMemo } from "react";
import "ol/ol.css";
import { Style, Circle, Fill, Stroke } from "ol/style";

import SearchFilters from "../searchFilters/SearchFilters";
import StopDetails from "../details/StopDetails";
import LineDetails from "../details/LineDetails";
import { gsAdapter } from "@/adapters";
import { useMapData, useMapInitialization, useVectorLayer } from "@/hooks";

const MAP_TARGET_ID = "map-container";
const POPUP_TARGET_ID = "popup-container";

const MapView = () => {
  const [selectedStop, setSelectedStop] = useState(null);
  const [selectedLine, setSelectedLine] = useState(null);
  const [filters, setFilters] = useState({
    origin: "",
    destination: "",
    timeStart: "",
    timeEnd: "",
    route: "",
    company: "",
    showDisabled: false,
  });

  // Configuración del mapa (memoizada para evitar re-creaciones)
  const mapConfig = useMemo(() => ({
    center: [-56.199, -34.907], // Centro en Montevideo
    zoom: 13,
  }), []);

  // Inicialización del mapa
  const { getMap, popupOverlayRef, isMapInitialized } = useMapInitialization(
    MAP_TARGET_ID,
    POPUP_TARGET_ID,
    mapConfig
  );

  // Obtener datos del mapa
  const { stops, lines, isLoading, error } = useMapData(gsAdapter);

  // Funciones de estilo (memoizadas)
  const stopStyleFunction = useMemo(() => (feature) =>
    new Style({
      image: new Circle({
        radius: 8,
        fill: new Fill({
          color: feature.get("enabled") ? "#10B981" : "#EF4444",
        }),
        stroke: new Stroke({ color: "#FFFFFF", width: 2 }),
      }),
    }), []);

  const lineStyleFunction = useMemo(() => (feature) =>
    new Style({
      stroke: new Stroke({
        color: feature.get("enabled") ? "#3B82F6" : "#EF4444",
        width: 4,
      }),
    }), []);

  // Crear capas vectoriales solo cuando el mapa esté inicializado
  const stopsLayer = useVectorLayer(
    isMapInitialized ? getMap() : null, 
    stops, 
    {
      styleFunction: stopStyleFunction,
      layerName: "stops-layer",
      zIndex: 10
    }
  );

  const linesLayer = useVectorLayer(
    isMapInitialized ? getMap() : null, 
    lines, 
    {
      styleFunction: lineStyleFunction,
      layerName: "lines-layer",
      zIndex: 5
    }
  );

  // Log del estado actual (solo cuando hay cambios significativos)
  useEffect(() => {
    console.group('🗺️ MapView - Estado actualizado:');
    console.log('📋 Estado del mapa:', {
      isMapInitialized,
      mapInstance: !!getMap(),
      popupOverlay: !!popupOverlayRef.current,
      stopsLayer: !!stopsLayer,
      linesLayer: !!linesLayer
    });
    console.log('📊 Datos:', {
      stopsCount: stops.length,
      linesCount: lines.length,
      isLoading,
      hasError: !!error
    });
    if (stops.length > 0 || lines.length > 0) {
      console.log('🎯 Muestra de datos:', {
        firstStop: stops[0]?.name,
        firstLine: lines[0]?.description
      });
    }
    console.groupEnd();
  }, [isMapInitialized, stops.length, lines.length, isLoading, !!error]);

  const popupCloserRef = useRef(null);

  // Manejar clics en el mapa (efecto estable)
  useEffect(() => {
    if (!isMapInitialized) {
      return;
    }

    const mapInstance = getMap();
    if (!mapInstance || !popupOverlayRef.current) {
      return;
    }

    console.log('🎯 Configurando event listeners del mapa');

    const clickHandler = (evt) => {
      const feature = mapInstance.forEachFeatureAtPixel(evt.pixel, (f) => f);
      const overlay = popupOverlayRef.current;

      if (feature) {
        const featureType = feature.get("type");
        const featureId = feature.get("id");

        console.log('🖱️ Click en feature:', { type: featureType, id: featureId });

        if (featureType === "stop") {
          const stopData = stops.find((s) => s.id === featureId);
          if (stopData) {
            setSelectedStop(stopData);
            setSelectedLine(null);
            overlay.setPosition(evt.coordinate);
          }
        } else if (featureType === "line") {
          const lineData = lines.find((l) => l.id === featureId);
          if (lineData) {
            setSelectedLine(lineData);
            setSelectedStop(null);
            overlay.setPosition(evt.coordinate);
          }
        }
      } else {
        // Clic en área vacía: cerrar popup
        overlay.setPosition(undefined);
        setSelectedStop(null);
        setSelectedLine(null);
      }
    };

    mapInstance.on("click", clickHandler);

    return () => {
      mapInstance.un("click", clickHandler);
    };
  }, [isMapInitialized, stops, lines]); // Dependencias estables

  // Manejar cierre del popup
  const handleClosePopup = () => {
    if (popupOverlayRef.current) {
      popupOverlayRef.current.setPosition(undefined);
    }
    setSelectedStop(null);
    setSelectedLine(null);
  };

  // Renderizar estados de carga y error
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 mb-2">Cargando datos del mapa...</p>
          <p className="text-sm text-gray-400">
            Mapa: {isMapInitialized ? '✅ Listo' : '⏳ Inicializando...'}
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-50">
        <div className="text-center p-6 bg-red-50 rounded-lg max-w-md">
          <div className="text-red-600 mb-2">⚠️ Error al cargar datos</div>
          <p className="text-sm text-gray-600 mb-4">
            {error.message || 'Error desconocido'}
          </p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-gray-50">
      {/* Panel lateral para filtros */}
      <div className="w-full md:w-96 p-4 bg-white border-r overflow-y-auto shadow-sm">
        <SearchFilters filters={filters} onFilterChange={setFilters} />
        
        {/* Panel de estado mejorado */}
        <div className="mt-4 p-3 bg-gradient-to-r from-blue-50 to-gray-50 rounded-lg text-xs border">
          <div className="font-semibold mb-2 text-blue-800">📊 Estado del Sistema</div>
          <div className="space-y-1">
            <div className="flex justify-between">
              <span>Mapa:</span>
              <span className={isMapInitialized ? 'text-green-600' : 'text-orange-600'}>
                {isMapInitialized ? '✅ Activo' : '⏳ Cargando...'}
              </span>
            </div>
            <div className="flex justify-between">
              <span>Paradas:</span>
              <span className="text-blue-600">{stops.length}</span>
            </div>
            <div className="flex justify-between">
              <span>Líneas:</span>
              <span className="text-blue-600">{lines.length}</span>
            </div>
            <div className="flex justify-between">
              <span>Capas:</span>
              <span className="text-green-600">
                {stopsLayer && linesLayer ? '✅ Cargadas' : '⏳ Preparando...'}
              </span>
            </div>
          </div>
          
          {/* Indicador de problemas */}
          {isMapInitialized && (stops.length === 0 || lines.length === 0) && (
            <div className="mt-2 p-2 bg-yellow-100 border border-yellow-300 rounded text-yellow-800">
              ⚠️ Datos incompletos - Verificar GeoServer
            </div>
          )}
        </div>
      </div>

      {/* Contenedor del mapa */}
      <div className="flex-1 relative">
        {/* Overlay de estado del mapa */}
        {!isMapInitialized && (
          <div className="absolute inset-0 bg-white bg-opacity-90 flex items-center justify-center z-20">
            <div className="text-center">
              <div className="animate-pulse text-4xl mb-2">🗺️</div>
              <p className="text-gray-600 font-medium">Inicializando mapa...</p>
              <p className="text-sm text-gray-400 mt-1">Preparando OpenLayers</p>
            </div>
          </div>
        )}
        
        {/* Contenedor del mapa de OpenLayers */}
        <div 
          id={MAP_TARGET_ID} 
          className="w-full h-[calc(100vh-var(--navbar-height,64px))] md:h-full"
          style={{ 
            minHeight: '400px',
            backgroundColor: '#f8fafc' // Color de fondo suave
          }}
        />
        
        {/* Contenedor del popup */}
        <div 
          id={POPUP_TARGET_ID} 
          className="ol-popup"
          style={{ display: 'none' }}
        >
          <button
            ref={popupCloserRef}
            className="ol-popup-closer"
            onClick={handleClosePopup}
            aria-label="Cerrar popup"
          >
            &times;
          </button>
          
          <div id="popup-content">
            {selectedStop && (
              <StopDetails stop={selectedStop} onClose={handleClosePopup} />
            )}
            {selectedLine && (
              <LineDetails line={selectedLine} onClose={handleClosePopup} />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MapView;