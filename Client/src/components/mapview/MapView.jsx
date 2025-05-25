
/**
 * @file MapView.jsx
 * @module components/mapview/MapView
 * @description Componente principal para la visualización del mapa interactivo.
 * 
 * Este componente integra varios hooks personalizados para gestionar diferentes aspectos del mapa:
 * - `useMapInitialization`: Se encarga de crear y configurar la instancia base del mapa de OpenLayers,
 *   incluyendo la vista inicial, la capa base de OpenStreetMap y un overlay para popups.
 * - `useMapData`: Obtiene los datos de paradas y líneas de ómnibus desde el backend (a través de un adaptador),
 *   maneja los estados de carga y error, y transforma los datos para su uso en el mapa.
 * - `useVectorLayer`: Gestiona la creación y actualización de capas vectoriales en el mapa.
 *   Se utiliza dos veces: una para la capa de paradas y otra para la capa de líneas.
 * 
 * Al utilizar estos hooks, `MapView` se vuelve más declarativo y su lógica principal se simplifica,
 * delegando las responsabilidades específicas a cada hook. Esto mejora la legibilidad,
 * el mantenimiento y la testeabilidad del código.
 */

import { useState, useRef, useEffect } // Agregamos useEffect aquí si es necesario para interacciones directas con el mapa
  from "react";
import "ol/ol.css"; // Estilos base de OpenLayers
import { Style, Circle, Fill, Stroke } from "ol/style"; // Para definir estilos de las features
// Ya no necesitamos importar Map, View, TileLayer, OSM, VectorLayer, VectorSource, fromLonLat, Overlay directamente aquí
// porque useMapInitialization y useVectorLayer los manejan internamente.

import SearchFilters from "../searchFilters/SearchFilters";
import StopDetails from "../details/StopDetails";
import LineDetails from "../details/LineDetails";
import { gsAdapter } from "@/adapters"; // Adaptador para la obtención de datos
import { useMapData, useMapInitialization, useVectorLayer } from "@/hooks"; // Nuestros hooks personalizados

// Constantes para los IDs de los elementos del DOM para el mapa y el popup.
// Es una buena práctica definirlos como constantes para evitar errores de tipeo.
const MAP_TARGET_ID = "map-container";
const POPUP_TARGET_ID = "popup-container";

const MapView = () => {
  // Estado para la selección de elementos en el mapa (paradas o líneas)
  const [selectedStop, setSelectedStop] = useState(null);
  const [selectedLine, setSelectedLine] = useState(null);

  // Estado para los filtros de búsqueda (aún gestionado localmente o podría ser otro hook)
  const [filters, setFilters] = useState({
    origin: "",
    destination: "",
    timeStart: "",
    timeEnd: "",
    route: "",
    company: "",
    showDisabled: false,
  });

  /**
   * Hook `useMapInitialization`:
   * Inicializa el mapa base de OpenLayers.
   * - `mapTargetId`: ID del div donde se renderizará el mapa.
   * - `popupTargetId`: ID del div que contendrá los popups.
   * - `initialViewOptions`: Configuración inicial de la vista del mapa (centro y zoom).
   * Retorna:
   *  - `getMap`: Función para obtener la instancia del mapa de OpenLayers.
   *  - `popupOverlayRef`: Referencia al overlay del popup para posicionarlo.
   *  - `isMapInitialized`: Booleano que indica si el mapa ya fue inicializado.
   */
  const { getMap, popupOverlayRef, isMapInitialized } = useMapInitialization(
    MAP_TARGET_ID,
    POPUP_TARGET_ID,
    {
      center: [-56.199, -34.907], // Centro inicial en Montevideo
      zoom: 13, // Nivel de zoom inicial
    }
  );

  /**
   * Hook `useMapData`:
   * Obtiene y procesa los datos de paradas y líneas.
   * - `gsAdapter`: El adaptador que se comunica con GeoServer.
   * Retorna:
   *  - `stops`: Array de datos de paradas procesadas.
   *  - `lines`: Array de datos de líneas procesadas.
   *  - `isLoading`: Booleano que indica si los datos están cargando.
   *  - `error`: Objeto de error si la carga falló.
   */
  const { stops, lines, isLoading, error } = useMapData(gsAdapter);

  /**
   * Función de estilo para las paradas.
   * Esta función se pasa al hook `useVectorLayer` para estilizar cada parada.
   * @param {import('ol/Feature').default} feature - La feature (parada) a estilizar.
   * @returns {Style} El estilo de OpenLayers para la parada.
   */
  const stopStyleFunction = (feature) =>
    new Style({
      image: new Circle({
        radius: 7,
        fill: new Fill({
          color: feature.get("enabled") ? "#10B981" : "#EF4444", // Verde si está activa, rojo si no
        }),
        stroke: new Stroke({ color: "#FFFFFF", width: 2 }), // Borde blanco
      }),
    });

  /**
   * Función de estilo para las líneas.
   * Esta función se pasa al hook `useVectorLayer` para estilizar cada línea.
   * @param {import('ol/Feature').default} feature - La feature (línea) a estilizar.
   * @returns {Style} El estilo de OpenLayers para la línea.
   */
  const lineStyleFunction = (feature) =>
    new Style({
      stroke: new Stroke({
        color: feature.get("enabled") ? "#3B82F6" : "#EF4444", // Azul si está activa, rojo si no
        width: 4,
      }),
    });

  /**
   * Hook `useVectorLayer` para las paradas:
   * Gestiona la capa vectorial de paradas en el mapa.
   * - `getMap()`: La instancia del mapa obtenida de `useMapInitialization`.
   * - `stops`: Los datos de las paradas obtenidos de `useMapData`.
   * - `options`: Configuración de la capa, incluyendo la función de estilo y el nombre.
   */
  useVectorLayer(isMapInitialized ? getMap() : null, stops, {
    styleFunction: stopStyleFunction,
    layerName: "stops-layer",
    zIndex: 10 // Asegura que las paradas estén sobre las líneas
  });

  /**
   * Hook `useVectorLayer` para las líneas:
   * Gestiona la capa vectorial de líneas en el mapa.
   * - `getMap()`: La instancia del mapa.
   * - `lines`: Los datos de las líneas.
   * - `options`: Configuración de la capa.
   */
  useVectorLayer(isMapInitialized ? getMap() : null, lines, {
    styleFunction: lineStyleFunction,
    layerName: "lines-layer",
    zIndex: 5 // Las líneas debajo de las paradas
  });

  // Referencia para el botón de cerrar el popup.
  const popupCloserRef = useRef(null);

  // Efecto para manejar los clics en el mapa y mostrar popups.
  // Este efecto se ejecuta cuando el mapa está inicializado.
  useEffect(() => {
    if (!isMapInitialized) return;

    const mapInstance = getMap();
    if (!mapInstance || !popupOverlayRef.current) return;

    const clickHandler = (evt) => {
      // Intenta obtener una feature (elemento geográfico) en el pixel donde se hizo clic.
      const feature = mapInstance.forEachFeatureAtPixel(evt.pixel, (f) => f);
      const overlay = popupOverlayRef.current;

      if (feature) {
        const featureType = feature.get("type"); // 'stop' o 'line', según lo definido en useVectorLayer
        const featureId = feature.get("id");

        if (featureType === "stop") {
          const stopData = stops.find((s) => s.id === featureId);
          setSelectedStop(stopData);
          setSelectedLine(null); // Asegura que solo un tipo de detalle se muestre
          overlay.setPosition(evt.coordinate); // Posiciona el popup en la coordenada del clic
        } else if (featureType === "line") {
          const lineData = lines.find((l) => l.id === featureId);
          setSelectedLine(lineData);
          setSelectedStop(null); // Asegura que solo un tipo de detalle se muestre
          overlay.setPosition(evt.coordinate);
        } else {
          // Si se hace clic en algo que no es ni parada ni línea, o en el espacio vacío,
          // se cierra el popup.
          overlay.setPosition(undefined);
          setSelectedStop(null);
          setSelectedLine(null);
        }
      } else {
        // Si no se hace clic en ninguna feature, se cierra el popup.
        overlay.setPosition(undefined);
        setSelectedStop(null);
        setSelectedLine(null);
      }
    };

    mapInstance.on("click", clickHandler);

    // Limpieza: remover el listener de clic cuando el componente se desmonta o las dependencias cambian.
    return () => {
      mapInstance.un("click", clickHandler);
    };
  }, [isMapInitialized, getMap, popupOverlayRef, stops, lines]); // Dependencias del efecto

  // Manejador para cerrar el popup desde su botón.
  const handleClosePopup = () => {
    if (popupOverlayRef.current) {
      popupOverlayRef.current.setPosition(undefined); // Oculta el popup
    }
    setSelectedStop(null); // Limpia la parada seleccionada
    setSelectedLine(null); // Limpia la línea seleccionada
  };

  // Renderizado del componente
  if (isLoading) {
    return <p className="text-center mt-10">Cargando datos del mapa...</p>;
  }

  if (error) {
    return (
      <p className="text-center mt-10 text-red-500">
        [MapView.jsx] Error al cargar datos desde el servidor: {error.message}
        (Verifica la conexión con GeoServer y la consola para más detalles)
      </p>
    );
  }

  return (
    <div className="min-h-screen flex flex-col md:flex-row">
      {/* Panel lateral para filtros de búsqueda */}
      <div className="w-full md:w-96 p-4 bg-white border-r overflow-y-auto">
        <SearchFilters filters={filters} onFilterChange={setFilters} />
      </div>

      {/* Contenedor principal del mapa y el popup */}
      <div className="flex-1 relative">
        {/* El div donde se renderizará el mapa de OpenLayers */}
        <div id={MAP_TARGET_ID} className="w-full h-[calc(100vh-var(--navbar-height,64px))] md:h-full" />
        
        {/* El div que actuará como contenedor para el popup de OpenLayers */}
        {/* Su visibilidad y contenido son controlados por OpenLayers y el estado de selectedStop/selectedLine */}
        <div id={POPUP_TARGET_ID} className="ol-popup bg-white p-3 rounded shadow-lg">
          <button
            ref={popupCloserRef} // Referencia para el botón de cierre
            className="ol-popup-closer absolute top-1 right-1 text-lg font-bold" // Estilos para el botón de cierre
            onClick={handleClosePopup} // Llama a la función para cerrar el popup
          >
            &times; {/* Símbolo de 'x' para cerrar */}
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
