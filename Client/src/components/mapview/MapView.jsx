
/**
 * Componente MapView
 * 
 * Descripción: 
 * Este componente muestra un mapa interactivo utilizando la librería OpenLayers y GeoServer.
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
import { gsAdapter } from "@/adapters"

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
  const popupCloserRef = useRef(null)

  // Carga de datos desde GeoServer
  useEffect(() => {
    const loadData = async () => {
      try {
        // Cargamos las paradas y líneas desde GeoServer y los procesamos con gsAdapter usando Promise.all para cargarlas de manera simultánea
        const [geoStops, geoLines] = await Promise.all([
          gsAdapter.getStopFromGeoServer(),
          gsAdapter.getLineFromGeoServer()
        ])
        
        // Procesamos los datos para que sean compatibles con la app
        const processedStops = geoStops.features.map(f => ({
          id: f.properties.id,
          name: f.properties.nombre,
          lat: f.geometry.coordinates[1],
          lng: f.geometry.coordinates[0],
          enabled: f.properties.activa,
          hasRefuge: f.properties.refugio,
          lines: f.properties.lineas.split(',').map(Number)
        }))

        // Procesamos las líneas para que sean compatibles con la app
        const processedLines = geoLines.features.map(f => ({
          id: f.properties.id,
          description: f.properties.descripcion,
          company: f.properties.empresa,
          origin: f.properties.origen,
          destination: f.properties.destino,
          enabled: f.properties.activa,
          route: f.geometry.coordinates
        }))
        
        setStops(processedStops)
        setLines(processedLines)
      } catch (error) {
        console.error("Error al cargar los datos - useEffect linea100 MapView:", error)
      }
    }
    
    loadData()
  }, [])

  // Inicialización del mapa
  useEffect(() => {
    // Si no hay mapa y el contenedor del mapa existe, creamos el mapa
    if (!mapRef.current && mapContainerRef.current) {
      const map = new Map({
        target: mapContainerRef.current,
        layers: [
          new TileLayer({ source: new OSM() }) // Capa base de OpenStreetMap
        ],
        view: new View({
          center: fromLonLat([-56.199, -34.907]), // Centro en Montevideo
          zoom: 13
        })
      })
      
      // Configuración de capas
      const stopsSource = new VectorSource()  // Creamos una fuente de datos para las paradas de tipo VectorSource
      const linesSource = new VectorSource() // Creamos una fuente de datos para las líneas de tipo VectorSource
      
      const stopsLayer = new VectorLayer({ // Creamos una capa de tipo VectorLayer para las paradas
        source: stopsSource,  // Asignamos la fuente de datos a la capa
        style: feature => new Style({
          // Dibujamos la parada como un círculo de radio 6 y lo rellenamos con color verde si está activa y rojo si está desactivada
          image: new Circle({ 
            radius: 6,
            fill: new Fill({
              color: feature.get('enabled') ? '#10B981' : '#EF4444'
            }),
            // Dibujamos un borde blanco de radio 2
            stroke: new Stroke({ color: '#fff', width: 2 })
          })
        })
      })
      
      const linesLayer = new VectorLayer({ // Creamos una capa de tipo VectorLayer para las líneas
        source: linesSource, // Asignamos la fuente de datos de la capa
        // Dibujamos la línea como una línea de color azul si está activa y rojo si está desactivada
        style: feature => new Style({
          stroke: new Stroke({
            color: feature.get('enabled') ? '#3B82F6' : '#EF4444',
            width: 3
          })
        })
      })
      
      // Agregamos las capas al mapa en orden de adentro a fuera para que se dibujen en el orden correcto y se vea bien.
      map.addLayer(linesLayer)
      map.addLayer(stopsLayer)
      
      // Geolocalización (comentado por ahora)
      /*
      // Habilitamos la geolocalización con alta precisión
      const geolocation = new Geolocation({
        trackingOptions: { enableHighAccuracy: true },
        projection: map.getView().getProjection()
      })
      
      geolocation.setTracking(true) // Activamos la geolocalización
      // Creamos una feature para la posición del usuario
      const positionFeature = new Feature()
      // Dibujamos el usuario como un círculo de radio 6 y lo rellenamos de color azul (puede ser de otro color)
      positionFeature.setStyle(new Style({
        image: new Circle({
          radius: 6,
          fill: new Fill({ color: '#3399CC' }),
          stroke: new Stroke({ color: '#fff', width: 2 })
        })
      }))
      
      // Agregamos la capa de posición del usuario al mapa
      map.addLayer(new VectorLayer({
        source: new VectorSource({ features: [positionFeature] })
      }))
      
      geolocation.on('change:position', () => {
        const coords = geolocation.getPosition()
        positionFeature.setGeometry(coords ? new Point(coords) : null)
      })
      */

      // Manejo de interacciones
      const popupOverlay = new Overlay({
        element: popupContainerRef.current,
        autoPan: true
      })
      
      map.addOverlay(popupOverlay)
      
      map.on('click', evt => {
        const feature = map.forEachFeatureAtPixel(evt.pixel, f => f)
        if (feature) {
          const type = feature.get('type')
          const id = feature.get('id')
          
          if (type === 'stop') {
            const stop = stops.find(s => s.id === id)
            setSelectedStop(stop)
            popupOverlay.setPosition(evt.coordinate)
          } else if (type === 'line') {
            const line = lines.find(l => l.id === id)
            setSelectedLine(line)
            popupOverlay.setPosition(evt.coordinate)
          }
        }
      })
      
      mapRef.current = map
    }
    
    return () => mapRef.current?.dispose()
  }, [stops, lines])

  // Actualización de features
  useEffect(() => {
    if (mapRef.current) {
      // Buscamos la fuente de datos de paradas
      const stopsSource = mapRef.current.getLayers().getArray()
        .find(l => 
          typeof l.getSource === "function" &&
          l.getSource() &&
          typeof l.getSource().getFeatures === "function" &&
          l.getSource().getFeatures().some(f => f.get('type') === 'stop')
        )?.getSource()
      
      // Buscamos la fuente de datos de líneas
      const linesSource = mapRef.current.getLayers().getArray()
        .find(l => 
          typeof l.getSource === "function" &&
          l.getSource() &&
          typeof l.getSource().getFeatures === "function" &&
          l.getSource().getFeatures().some(f => f.get('type') === 'line')
        )?.getSource()
      
      // Actualizamos las features de paradas
      if (stopsSource) {
        stopsSource.clear()
        stops.forEach(stop => {
          const feature = new Feature({
            geometry: new Point(fromLonLat([stop.lng, stop.lat])),
            type: 'stop',
            id: stop.id,
            enabled: stop.enabled
          })
          stopsSource.addFeature(feature)
        })
      }
      
      // Actualizamos las features de líneas
      if (linesSource) {
        linesSource.clear()
        lines.forEach(line => {
          const feature = new Feature({
            geometry: new LineString(line.route.map(coord => fromLonLat(coord))),
            type: 'line',
            id: line.id,
            enabled: line.enabled
          })
          linesSource.addFeature(feature)
        })
      }
    }
  }, [stops, lines])

  return (
    <div className="min-h-screen flex">
      <div className="w-96 p-4 bg-white border-r">
        <SearchFilters filters={filters} onFilterChange={setFilters} />
      </div>
      
      <div ref={mapContainerRef} className="flex-1 relative">
        <div ref={popupContainerRef} className="ol-popup">
          <button
            ref={popupCloserRef}
            className="ol-popup-closer"
            onClick={() => {
              setSelectedStop(null)
              setSelectedLine(null)
            }}
          />
          
          {selectedStop && (
            <StopDetails stop={selectedStop} onClose={() => setSelectedStop(null)} />
          )}
          
          {selectedLine && (
            <LineDetails line={selectedLine} onClose={() => setSelectedLine(null)} />
          )}
        </div>
      </div>
    </div>
  )
}

export default MapView
