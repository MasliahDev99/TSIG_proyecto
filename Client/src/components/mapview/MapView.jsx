
/**
 * Componente MapView
 * 
 * Descripción: 
 * Este componente muestra un mapa interactivo utilizando la librería OpenLayers.
 * Permite visualizar paradas y líneas de ómnibus simuladas, así como la ubicación actual del usuario.
 * 
 * Características principales:
 * - Muestra un mapa centrado en Montevideo.
 * - Dibuja paradas y líneas de ejemplo sobre el mapa.
 * - Muestra la ubicación actual del usuario si está disponible.
 * - Permite hacer clic sobre una parada o línea para ver información en un popup.
 * 
 * Uso:
 * <MapView />
 * 
 * No recibe props.
 * 
 */

import { useState, useEffect, useRef } from "react"
import "ol/ol.css"
import Map from "ol/Map"
import View from "ol/View"
import TileLayer from "ol/layer/Tile"
import VectorLayer from "ol/layer/Vector"
import VectorSource from "ol/source/Vector"
import OSM from "ol/source/OSM"
import { fromLonLat } from "ol/proj"
import Feature from "ol/Feature"
import Point from "ol/geom/Point"
import LineString from "ol/geom/LineString"
import { Style, Circle, Fill, Stroke } from "ol/style"
import Overlay from "ol/Overlay"
import { Geolocation } from "ol"
import SearchFilters from "../searchFilters/SearchFilters"
import StopDetails from "../details/StopDetails"
import LineDetails from "../details/LineDetails"

const MapView = () => {
  const [stops, setStops] = useState([])
  const [lines, setLines] = useState([])
  const [selectedStop, setSelectedStop] = useState(null)
  const [selectedLine, setSelectedLine] = useState(null)
  const [filters, setFilters] = useState({
    origin: "",
    destination: "",
    timeStart: "",
    timeEnd: "",
    route: "",
    company: "",
    showDisabled: false,
  })
  const mapRef = useRef(null)
  const mapContainerRef = useRef(null)
  const popupContainerRef = useRef(null)
  const popupContentRef = useRef(null)
  const popupCloserRef = useRef(null)
  const popupOverlayRef = useRef(null)

  // Simulación de datos para demostración
  useEffect(() => {
    // Aquí se cargarían los datos reales desde una API
    const mockStops = [
      { id: 1, name: "Terminal Montevideo", lat: -34.907, lng: -56.199, enabled: true, hasRefuge: true, lines: [1, 2] },
      { id: 2, name: "Parada Ruta 5 km 30", lat: -34.8, lng: -56.25, enabled: true, hasRefuge: false, lines: [1] },
      { id: 3, name: "Terminal Maldonado", lat: -34.909, lng: -54.96, enabled: true, hasRefuge: true, lines: [2] },
    ]

    const mockLines = [
      {
        id: 1,
        description: "Montevideo - Canelones",
        company: "COPSA",
        origin: "Montevideo",
        destination: "Canelones",
        enabled: true,
        route: [
          [-56.199, -34.907],
          [-56.22, -34.85],
          [-56.25, -34.8],
        ],
      },
      {
        id: 2,
        description: "Montevideo - Maldonado",
        company: "COPSA",
        origin: "Montevideo",
        destination: "Maldonado",
        enabled: true,
        route: [
          [-56.199, -34.907],
          [-55.5, -34.908],
          [-54.96, -34.909],
        ],
      },
    ]

    setStops(mockStops)
    setLines(mockLines)
  }, [])

  // Inicializar el mapa
  useEffect(() => {
    if (!mapRef.current && mapContainerRef.current) {
      // Crear popup overlay
      const popupOverlay = new Overlay({
        element: popupContainerRef.current,
        autoPan: true,
        autoPanAnimation: {
          duration: 250,
        },
      })

      // Configurar el cierre del popup
      if (popupCloserRef.current) {
        popupCloserRef.current.onclick = () => {
          popupOverlay.setPosition(undefined)
          return false
        }
      }

      // Crear fuentes de datos vectoriales
      const stopsSource = new VectorSource()
      const linesSource = new VectorSource()

      // Crear capas vectoriales
      const stopsLayer = new VectorLayer({
        source: stopsSource,
        style: (feature) => {
          const enabled = feature.get("enabled")
          return new Style({
            image: new Circle({
              radius: 6,
              fill: new Fill({
                color: enabled ? "rgba(0, 128, 0, 0.8)" : "rgba(255, 0, 0, 0.8)",
              }),
              stroke: new Stroke({
                color: "#fff",
                width: 2,
              }),
            }),
          })
        },
      })

      const linesLayer = new VectorLayer({
        source: linesSource,
        style: (feature) => {
          const enabled = feature.get("enabled")
          return new Style({
            stroke: new Stroke({
              color: enabled ? "#3B82F6" : "#EF4444",
              width: 3,
            }),
          })
        },
      })

      // Crear mapa
      const map = new Map({
        target: mapContainerRef.current,
        layers: [
          new TileLayer({
            source: new OSM(),
          }),
          linesLayer,
          stopsLayer,
        ],
        view: new View({
          center: fromLonLat([-56.199, -34.907]), // Montevideo
          zoom: 13,
        }),
        overlays: [popupOverlay],
      })

      // Configurar geolocalización
      const geolocation = new Geolocation({
        trackingOptions: {
          enableHighAccuracy: true,
        },
        projection: map.getView().getProjection(),
      })

      geolocation.setTracking(true)

      // Crear un punto para la ubicación actual
      const positionFeature = new Feature()
      positionFeature.setStyle(
        new Style({
          image: new Circle({
            radius: 6,
            fill: new Fill({
              color: "#3399CC",
            }),
            stroke: new Stroke({
              color: "#fff",
              width: 2,
            }),
          }),
        }),
      )

      // Añadir el punto a una capa
      const positionLayer = new VectorLayer({
        source: new VectorSource({
          features: [positionFeature],
        }),
      })
      map.addLayer(positionLayer)

      // Actualizar la posición cuando cambie
      geolocation.on("change:position", () => {
        const coordinates = geolocation.getPosition()
        positionFeature.setGeometry(coordinates ? new Point(coordinates) : null)
        map.getView().setCenter(coordinates)
      })

      // Manejar clics en el mapa
      map.on("click", (evt) => {
        const feature = map.forEachFeatureAtPixel(evt.pixel, (feature) => feature)

        if (feature) {
          const featureType = feature.get("type")
          const featureId = feature.get("id")

          if (featureType === "stop") {
            const stop = stops.find((s) => s.id === featureId)
            if (stop) {
              setSelectedStop(stop)
              setSelectedLine(null)
            }
          } else if (featureType === "line") {
            const line = lines.find((l) => l.id === featureId)
            if (line) {
              setSelectedLine(line)
              setSelectedStop(null)
            }
          }

          // Mostrar popup
          const coordinates = evt.coordinate
          popupContentRef.current.innerHTML = feature.get("popupContent")
          popupOverlay.setPosition(coordinates)
        } else {
          popupOverlay.setPosition(undefined)
        }
      })

      mapRef.current = map
      popupOverlayRef.current = popupOverlay
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.setTarget(null)
        mapRef.current = null
      }
    }
  }, [])

  // Actualizar marcadores y líneas cuando cambian los datos o filtros
  useEffect(() => {
    if (!mapRef.current) return

    // Obtener las capas vectoriales
    const stopsLayer = mapRef.current.getLayers().getArray()[1]
    const linesLayer = mapRef.current.getLayers().getArray()[2]
    const stopsSource = stopsLayer.getSource()
    const linesSource = linesLayer.getSource()

    // Limpiar fuentes
    stopsSource.clear()
    linesSource.clear()

    // Filtrar líneas y paradas según los filtros aplicados
    const filteredLines = lines.filter((line) => {
      if (!filters.showDisabled && !line.enabled) return false
      if (filters.origin && !line.origin.toLowerCase().includes(filters.origin.toLowerCase())) return false
      if (filters.destination && !line.destination.toLowerCase().includes(filters.destination.toLowerCase()))
        return false
      if (filters.company && !line.company.toLowerCase().includes(filters.company.toLowerCase())) return false
      return true
    })

    const filteredStops = stops.filter((stop) => {
      if (!filters.showDisabled && !stop.enabled) return false
      // Filtrar paradas que pertenecen a líneas filtradas
      if (filteredLines.length > 0) {
        return stop.lines.some((lineId) => filteredLines.some((line) => line.id === lineId))
      }
      return true
    })

    // Añadir paradas al mapa
    filteredStops.forEach((stop) => {
      const feature = new Feature({
        geometry: new Point(fromLonLat([stop.lng, stop.lat])),
        id: stop.id,
        name: stop.name,
        enabled: stop.enabled,
        hasRefuge: stop.hasRefuge,
        type: "stop",
        popupContent: `
          <div>
            <h3 class="font-bold">${stop.name}</h3>
            <p>Estado: ${stop.enabled ? "Habilitada" : "Deshabilitada"}</p>
            <p>Refugio: ${stop.hasRefuge ? "Sí" : "No"}</p>
          </div>
        `,
      })

      stopsSource.addFeature(feature)
    })

    // Añadir líneas al mapa
    filteredLines.forEach((line) => {
      // Convertir coordenadas a formato OpenLayers
      const coordinates = line.route.map((coord) => fromLonLat(coord))

      const feature = new Feature({
        geometry: new LineString(coordinates),
        id: line.id,
        description: line.description,
        company: line.company,
        origin: line.origin,
        destination: line.destination,
        enabled: line.enabled,
        type: "line",
        popupContent: `
          <div>
            <h3 class="font-bold">${line.description}</h3>
            <p>Empresa: ${line.company}</p>
            <p>Origen: ${line.origin}</p>
            <p>Destino: ${line.destination}</p>
          </div>
        `,
      })

      linesSource.addFeature(feature)
    })
  }, [stops, lines, filters])

  const handleFilterChange = (newFilters) => {
    setFilters({ ...filters, ...newFilters })
  }

  const closeDetails = () => {
    setSelectedStop(null)
    setSelectedLine(null)
  }

  return (
    <div className="flex min-h-screen ">
      {/* Panel lateral de filtros */}
      <div className="w-80 bg-white p-4 shadow-md overflow-y-auto">
        <SearchFilters filters={filters} onFilterChange={handleFilterChange} />

        {selectedStop && <StopDetails stop={selectedStop} onClose={closeDetails} />}

        {selectedLine && <LineDetails line={selectedLine} onClose={closeDetails} />}
      </div>

      {/* Mapa principal */}
      <div className="flex-1 relative">
        <div ref={mapContainerRef} className="absolute inset-0"></div>

        {/* Popup para el mapa */}
        <div ref={popupContainerRef} className="ol-popup hidden">
          <a href="#" ref={popupCloserRef} className="ol-popup-closer"></a>
          <div ref={popupContentRef}></div>
        </div>
      </div>
    </div>
  )
}

export default MapView
