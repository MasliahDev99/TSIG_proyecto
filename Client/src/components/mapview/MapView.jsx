import { useState, useRef, useEffect } from "react";
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

  // Inicialización del mapa
  const { getMap, popupOverlayRef, isMapInitialized } = useMapInitialization(
    MAP_TARGET_ID,
    POPUP_TARGET_ID,
    {
      center: [-56.199, -34.907], // Centro en Montevideo
      zoom: 13,
    }
  );

  // Obtener datos del mapa
  const { stops, lines, isLoading, error } = useMapData(gsAdapter);

  // Log del estado actual para debugging
  useEffect(() => {
    console.log('🗺️ MapView - Estado actual:', {
      isMapInitialized,
      stopsCount: stops.length,
      linesCount: lines.length,
      isLoading,
      hasError: !!error
    });
  }, [isMapInitialized, stops.length, lines.length, isLoading, error]);

  // Funciones de estilo
  const stopStyleFunction = (feature) =>
    new Style({
      image: new Circle({
        radius: 8,
        fill: new Fill({
          color: feature.get("enabled") ? "#10B981" : "#EF4444",
        }),
        stroke: new Stroke({ color: "#FFFFFF", width: 2 }),
      }),
    });

  const lineStyleFunction = (feature) =>
    new Style({
      stroke: new Stroke({
        color: feature.get("enabled") ? "#3B82F6" : "#EF4444",
        width: 4,
      }),
    });

  // Crear capas vectoriales solo cuando el mapa esté inicializado
  useVectorLayer(
    isMapInitialized ? getMap() : null, 
    stops, 
    {
      styleFunction: stopStyleFunction,
      layerName: "stops-layer",
      zIndex: 10
    }
  );

  useVectorLayer(
    isMapInitialized ? getMap() : null, 
    lines, 
    {
      styleFunction: lineStyleFunction,
      layerName: "lines-layer",
      zIndex: 5
    }
  );

  const popupCloserRef = useRef(null);

  // Manejar clics en el mapa
  useEffect(() => {
    if (!isMapInitialized) {
      console.log('⏳ MapView: Esperando inicialización del mapa...');
      return;
    }

    const mapInstance = getMap();
    if (!mapInstance || !popupOverlayRef.current) {
      console.log('⚠️ MapView: Mapa o popup no disponibles');
      return;
    }

    console.log('🎯 MapView: Configurando event listeners del mapa');

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
            console.log('📍 Parada seleccionada:', stopData.name);
          }
        } else if (featureType === "line") {
          const lineData = lines.find((l) => l.id === featureId);
          if (lineData) {
            setSelectedLine(lineData);
            setSelectedStop(null);
            overlay.setPosition(evt.coordinate);
            console.log('🚌 Línea seleccionada:', lineData.description);
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
  }, [isMapInitialized, getMap, popupOverlayRef, stops, lines]);

  // Manejar cierre del popup
  const handleClosePopup = () => {
    if (popupOverlayRef.current) {
      popupOverlayRef.current.setPosition(undefined);
    }
    setSelectedStop(null);
    setSelectedLine(null);
  };

  // Estados de carga y error
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">Cargando datos del mapa...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center p-6 bg-red-50 rounded-lg">
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
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Panel lateral para filtros */}
      <div className="w-full md:w-96 p-4 bg-white border-r overflow-y-auto">
        <SearchFilters filters={filters} onFilterChange={setFilters} />
        
        {/* Información de debugging (solo en desarrollo) */}
        {process.env.NODE_ENV === 'development' && (
          <div className="mt-4 p-3 bg-gray-100 rounded text-xs">
            <div>📊 Estado del mapa:</div>
            <div>• Inicializado: {isMapInitialized ? '✅' : '❌'}</div>
            <div>• Paradas: {stops.length}</div>
            <div>• Líneas: {lines.length}</div>
          </div>
        )}
      </div>

      {/* Contenedor del mapa */}
      <div className="flex-1 relative">
        {/* Contenedor del mapa de OpenLayers */}
        <div 
          id={MAP_TARGET_ID} 
          className="w-full h-[calc(100vh-var(--navbar-height,64px))] md:h-full"
          style={{ minHeight: '400px' }}
        />
        
        {/* Contenedor del popup */}
        <div 
          id={POPUP_TARGET_ID} 
          className="ol-popup bg-white p-3 rounded shadow-lg max-w-sm"
          style={{ display: 'none' }} // Inicialmente oculto
        >
          <button
            ref={popupCloserRef}
            className="ol-popup-closer absolute top-1 right-1 text-lg font-bold text-gray-500 hover:text-gray-700"
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