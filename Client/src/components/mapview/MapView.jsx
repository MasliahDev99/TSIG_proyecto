"use client"

import { useEffect, useRef } from "react"
import { createRoot } from "react-dom/client"
import "ol/ol.css"
import Map from "ol/Map"
import View from "ol/View"
import TileLayer from "ol/layer/Tile"
import VectorLayer from "ol/layer/Vector"
import OSM from "ol/source/OSM"
import VectorSource from "ol/source/Vector"
import GeoJSON from "ol/format/GeoJSON"
import { Style, Stroke, Circle as CircleStyle, Fill } from "ol/style"
import { Point, LineString } from "ol/geom"
import Feature from "ol/Feature"
import { bbox as bboxStrategy } from "ol/loadingstrategy"
import proj4 from "proj4"
import { register } from "ol/proj/proj4"
import Overlay from "ol/Overlay"
import { StopForm, LineForm } from "@/components"
import { get as getProjection } from "ol/proj"
import { Modify } from "ol/interaction"

const temporaryMarkerStyle = new Style({
  image: new CircleStyle({
    radius: 7,
    fill: new Fill({ color: "rgba(50, 100, 255, 0.6)" }), // Blueish
    stroke: new Stroke({ color: "rgba(50, 100, 255, 1)", width: 2 }),
  }),
  stroke: new Stroke({
    // For LineStrings (line in progress)
    color: "rgba(50, 100, 255, 0.7)",
    width: 4,
  }),
})

const selectedForLineStyle = new Style({
  image: new CircleStyle({
    radius: 8,
    fill: new Fill({ color: "rgba(34, 197, 94, 0.7)" }), // Greenish for selected stops
    stroke: new Stroke({ color: "rgba(22, 163, 74, 1)", width: 2 }),
  }),
})

const routePointStyle = new Style({
  image: new CircleStyle({
    radius: 5,
    fill: new Fill({ color: "rgba(255, 165, 0, 0.7)" }), // Orange for route points
    stroke: new Stroke({ color: "rgba(255, 140, 0, 1)", width: 2 }),
  }),
})

const defaultStopStyle = new Style({
  image: new CircleStyle({
    radius: 6,
    fill: new Fill({ color: "rgba(239, 68, 68, 0.7)" }), // Reddish
    stroke: new Stroke({ color: "white", width: 1.5 }),
  }),
})

const defaultLineStyle = new Style({
  stroke: new Stroke({ color: "rgba(0, 180, 180, 0.8)", width: 3 }), // Cyan
})

export default function MapView({
  isAdmin = false,
  activeTool,
  onMapInteractionRequest,
  popupFormConfig,
  onStopFormSubmit,
  onStopFormCancel,
  onStopFormDelete,
  onLineFormSubmit,
  onLineFormCancel,
  temporaryFeatures = [],
}) {
  const mapRef = useRef(null)
  const mapInstanceRef = useRef(null)
  const popupElementRef = useRef(null)
  const popupOverlayRef = useRef(null)
  const popupRootRef = useRef(null)
  const temporaryLayerRef = useRef(null)
  const stopLayerRef = useRef(null)
  const lineLayerRef = useRef(null)

  // Initialize map
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current) return

    proj4.defs("EPSG:32721", "+proj=utm +zone=21 +south +datum=WGS84 +units=m +no_defs")
    register(proj4)
    const utmProjection = getProjection("EPSG:32721")
    if (!utmProjection) {
      console.error("EPSG:32721 projection not registered.")
      return
    }

    // Centro de Montevideo en coordenadas UTM 32721
    const montevideoUTM = [583000, 6140000] // Aproximadamente

    const lineSource = new VectorSource({
      format: new GeoJSON(),
      url: (extent) =>
        `/geoserver/tsig2025/ows?service=WFS&version=1.1.0&request=GetFeature&typename=tsig2025:linea&outputFormat=application/json&srsname=EPSG:32721&bbox=${extent.join(",")},EPSG:32721`,
      strategy: bboxStrategy,
    })
    lineLayerRef.current = new VectorLayer({ source: lineSource, style: defaultLineStyle })

    const stopSource = new VectorSource({
      format: new GeoJSON(),
      url: (extent) =>
        `/geoserver/tsig2025/ows?service=WFS&version=1.1.0&request=GetFeature&typename=tsig2025:parada&outputFormat=application/json&srsname=EPSG:32721&bbox=${extent.join(",")},EPSG:32721`,
      strategy: bboxStrategy,
    })
    stopLayerRef.current = new VectorLayer({
      source: stopSource,
      style: (feature) => {
        const estado = feature.get("estado") ?? feature.get("activa")
        return new Style({
          image: new CircleStyle({
            radius: 6,
            fill: new Fill({
              color: estado ? "rgba(34, 197, 94, 0.7)" : "rgba(239, 68, 68, 0.7)",
            }),
            stroke: new Stroke({ color: "white", width: 1.5 }),
          }),
        })
      },
    })

    temporaryLayerRef.current = new VectorLayer({
      source: new VectorSource(),
      style: (feature) => {
        const styleType = feature.get("style_type")
        if (styleType === "selectedForLine") return selectedForLineStyle
        if (styleType === "routePoint") return routePointStyle
        return temporaryMarkerStyle
      },
    })

    if (popupElementRef.current) {
      popupOverlayRef.current = new Overlay({
        element: popupElementRef.current,
        autoPan: { animation: { duration: 250 } },
        stopEvent: false,
      })
    }

    const map = new Map({
      target: mapRef.current,
      layers: [
        new TileLayer({ source: new OSM() }),
        lineLayerRef.current,
        stopLayerRef.current,
        temporaryLayerRef.current,
      ],
      view: new View({
        projection: utmProjection,
        center: montevideoUTM,
        zoom: 10,
      }),
      overlays: popupOverlayRef.current ? [popupOverlayRef.current] : [],
    })
    mapInstanceRef.current = map

    // Hacer la referencia del mapa disponible globalmente para edición
    window.mapInstanceRef = mapInstanceRef

    return () => {
      if (popupRootRef.current) {
        popupRootRef.current.unmount()
        popupRootRef.current = null
      }
      if (mapInstanceRef.current) {
        mapInstanceRef.current.setTarget(undefined)
        mapInstanceRef.current.dispose()
        mapInstanceRef.current = null
      }
    }
  }, [])

  // Handle map clicks
  useEffect(() => {
    if (!mapInstanceRef.current || !onMapInteractionRequest) return

    const map = mapInstanceRef.current
    const clickHandler = (evt) => {
      // Skip handling map clicks if a form popup is already visible
      if (popupFormConfig && popupFormConfig.isVisible) {
        return // Don't process map clicks when form is open
      }

      // Always hide non-form popup first, or unmount React form if visible
      if (popupOverlayRef.current) {
        popupOverlayRef.current.setPosition(undefined)
        if (popupRootRef.current) {
          popupRootRef.current.unmount()
          popupRootRef.current = null
        }
        if (popupElementRef.current) popupElementRef.current.innerHTML = ""
      }

      if (isAdmin) {
        let featureClicked = null
        let layerClicked = null
        map.forEachFeatureAtPixel(evt.pixel, (feature, layer) => {
          if (!featureClicked) {
            // Process only the top-most feature
            featureClicked = feature
            layerClicked = layer
          }
        })

        if (activeTool === "add-stop") {
          // Enviar coordenadas UTM directamente
          onMapInteractionRequest({
            type: "MAP_CLICK_FOR_ADD",
            payload: { coordinates: evt.coordinate },
          })
        } else if (activeTool === "add-line") {
          if (featureClicked && layerClicked === stopLayerRef.current) {
            // Clicked on a stop - add it to the line
            onMapInteractionRequest({
              type: "STOP_CLICK_FOR_LINE",
              payload: {
                featureData: featureClicked.getProperties(),
                coordinates: featureClicked.getGeometry().getCoordinates(),
              },
            })
          } else {
            // Clicked on empty space - add route point
            onMapInteractionRequest({
              type: "MAP_CLICK_FOR_LINE_ROUTE",
              payload: { coordinates: evt.coordinate },
            })
          }
        } else if (activeTool === "edit-stop" && featureClicked && layerClicked === stopLayerRef.current) {
          const props = featureClicked.getProperties()
          const geom = featureClicked.getGeometry()
          const coordinates = geom.getCoordinates()

          // Usar coordenadas UTM directamente sin transformar
          const enrichedProps = {
            ...props,
            lat: coordinates[1], // Y = Coordenada Y UTM
            lng: coordinates[0], // X = Coordenada X UTM
          }

          onMapInteractionRequest({
            type: "FEATURE_CLICK_FOR_EDIT",
            payload: {
              featureData: enrichedProps,
              coordinates: coordinates,
            },
          })
        } else if (activeTool === "delete-stop" && featureClicked && layerClicked === stopLayerRef.current) {
          onMapInteractionRequest({
            type: "FEATURE_CLICK_FOR_DELETE",
            payload: {
              featureData: featureClicked.getProperties(),
              coordinates: featureClicked.getGeometry().getCoordinates(),
            },
          })
        } else if (activeTool === "delete-line" && featureClicked && layerClicked === lineLayerRef.current) {
          onMapInteractionRequest({
            type: "LINE_CLICK_FOR_DELETE",
            payload: {
              featureData: featureClicked.getProperties(),
              coordinates: evt.coordinate,
            },
          })
        } else if (activeTool === "edit-line" && featureClicked && layerClicked === lineLayerRef.current) {
          onMapInteractionRequest({
            type: "LINE_CLICK_FOR_EDIT",
            payload: { featureData: featureClicked.getProperties(), coordinates: evt.coordinate },
          })
        } else if (!activeTool && featureClicked) {
          // Admin general click on a feature - show info
          const props = featureClicked.getProperties()
          const geom = featureClicked.getGeometry()
          let utmCoords = ["N/A", "N/A"]
          if (geom && typeof geom.getCoordinates === "function") {
            try {
              const coords = geom.getCoordinates()
              utmCoords = [coords[0].toFixed(2), coords[1].toFixed(2)]
            } catch (e) {
              console.error("Error getting UTM coordinates for admin info popup:", e)
            }
          }

          let content = `<h4 class="text-base font-semibold mb-1 text-black">Admin Info: ${props.nombre || props.name || props.id || "Elemento"}</h4><hr class="my-1 border-gray-300"/><dl class="text-xs text-gray-700">`
          for (const key in props) {
            if (key !== "geometry" && Object.prototype.hasOwnProperty.call(props, key)) {
              content += `<dt class="font-medium text-gray-600">${key}</dt><dd class="ml-2 mb-1 text-black">${JSON.stringify(props[key])}</dd>`
            }
          }
          content += `<dt class="font-medium text-gray-600">Coords UTM (X/Y)</dt><dd class="ml-2 mb-1 text-black">${utmCoords[0]}, ${utmCoords[1]}</dd>`
          content += `</dl><button id="popup-closer-btn" class="ol-popup-closer">&times;</button>`

          if (popupElementRef.current && popupOverlayRef.current) {
            popupElementRef.current.innerHTML = content
            popupOverlayRef.current.setPosition(evt.coordinate)
            document.getElementById("popup-closer-btn")?.addEventListener("click", () => {
              popupOverlayRef.current?.setPosition(undefined)
            })
          }
        }
      } else {
        // Public user click
        let featureClicked = null
        map.forEachFeatureAtPixel(evt.pixel, (feature) => {
          if (!featureClicked) featureClicked = feature
        })

        if (featureClicked && popupElementRef.current && popupOverlayRef.current) {
          const props = featureClicked.getProperties()
          const geom = featureClicked.getGeometry()
          let utmCoords = ["N/A", "N/A"]
          let featureType = "Elemento"

          if (geom) {
            if (geom.getType() === "Point") {
              featureType = "Parada"
              try {
                const coords = geom.getCoordinates()
                utmCoords = [coords[0].toFixed(2), coords[1].toFixed(2)]
              } catch (e) {
                console.error("Error getting UTM coordinates for point:", e)
              }
            } else if (geom.getType() === "LineString" || geom.getType() === "MultiLineString") {
              featureType = "Línea"
              try {
                utmCoords = [evt.coordinate[0].toFixed(2), evt.coordinate[1].toFixed(2)]
              } catch (e) {
                console.error("Error getting UTM coordinates for line click:", e)
              }
            }
          }

          let content = `<h4 class="text-base font-semibold mb-1 text-black">${featureType}: ${props.nombre || props.name || props.descripcion || props.id}</h4><hr class="my-1 border-gray-300"/><dl class="text-xs text-gray-700">`

          // Specific fields for stops as requested
          if (featureType === "Parada") {
            content += `<dt class="font-medium text-gray-600">Nombre:</dt><dd class="ml-2 mb-1 text-black">${props.nombre || "N/D"}</dd>`
            content += `<dt class="font-medium text-gray-600">Ruta/Km:</dt><dd class="ml-2 mb-1 text-black">${props.ruta_km || props.ruta || "N/D"}</dd>`
            content += `<dt class="font-medium text-gray-600">Departamento:</dt><dd class="ml-2 mb-1 text-black">${props.departamento || "N/D"}</dd>`
            content += `<dt class="font-medium text-gray-600">Sentido:</dt><dd class="ml-2 mb-1 text-black">${props.sentido || "N/D"}</dd>`
            content += `<dt class="font-medium text-gray-600">Estado:</dt><dd class="ml-2 mb-1 text-black">${typeof props.activa === "boolean" ? (props.activa ? "Habilitada" : "Deshabilitada") : "N/D"}</dd>`
            content += `<dt class="font-medium text-gray-600">Refugio:</dt><dd class="ml-2 mb-1 text-black">${typeof props.refugio === "boolean" ? (props.refugio ? "Sí" : "No") : "N/D"}</dd>`
            content += `<dt class="font-medium text-gray-600">Observaciones:</dt><dd class="ml-2 mb-1 text-black">${props.observaciones || "Ninguna"}</dd>`
            content += `<dt class="font-medium text-gray-600">Coords UTM (X/Y):</dt><dd class="ml-2 mb-1 text-black">${utmCoords[0]}, ${utmCoords[1]}</dd>`
          } else {
            // Generic display for other feature types (like lines)
            for (const key in props) {
              if (key !== "geometry" && Object.prototype.hasOwnProperty.call(props, key)) {
                content += `<dt class="font-medium text-gray-600">${key}</dt><dd class="ml-2 mb-1 text-black">${JSON.stringify(props[key])}</dd>`
              }
            }
          }
          content += `</dl><button id="popup-closer-btn" class="ol-popup-closer">&times;</button>`

          popupElementRef.current.innerHTML = content
          popupOverlayRef.current.setPosition(evt.coordinate)
          document.getElementById("popup-closer-btn")?.addEventListener("click", () => {
            popupOverlayRef.current?.setPosition(undefined)
          })
        }
      }
    }
    map.on("click", clickHandler)
    return () => map.un("click", clickHandler)
  }, [isAdmin, activeTool, onMapInteractionRequest, popupFormConfig])

  // Render/update temporary features
  useEffect(() => {
    if (temporaryLayerRef.current) {
      const source = temporaryLayerRef.current.getSource()
      source.clear()
      if (temporaryFeatures && temporaryFeatures.length > 0) {
        const olFeatures = temporaryFeatures
          .map((featureData) => {
            let geom
            if (featureData.type === "Point" && featureData.coordinates) {
              geom = new Point(featureData.coordinates)
            } else if (featureData.type === "LineString" && featureData.coordinates) {
              geom = new LineString(featureData.coordinates)
            }
            if (geom) {
              const feature = new Feature({ geometry: geom })
              if (featureData.style === "selectedForLine") {
                feature.set("style_type", "selectedForLine")
              } else if (featureData.style === "routePoint") {
                feature.set("style_type", "routePoint")
              }
              return feature
            }
            return null
          })
          .filter(Boolean)
        source.addFeatures(olFeatures)
      }
    }
  }, [temporaryFeatures])

  const editableMarkerRef = useRef(null)
  const editableLayerRef = useRef(null)
  const isMovingStopRef = useRef(false)

  // Mejorar la función de limpieza de edición
  const cleanupEditMode = () => {
    if (mapInstanceRef.current) {
      const map = mapInstanceRef.current

      // Eliminar capas editables
      map
        .getLayers()
        .getArray()
        .forEach((layer) => {
          if (layer && layer.get && layer.get("isEditable") === true) {
            map.removeLayer(layer)
          }
        })

      // Eliminar interacciones de modificación
      const interactionsToRemove = []
      map.getInteractions().forEach((interaction) => {
        if (interaction instanceof Modify) {
          interactionsToRemove.push(interaction)
        }
      })

      interactionsToRemove.forEach((interaction) => {
        map.removeInteraction(interaction)
      })

      // Resetear referencias
      editableMarkerRef.current = null
      editableLayerRef.current = null
      isMovingStopRef.current = false
    }
  }

  // Agregar la función cleanupEditMode al efecto que maneja el evento end-edit-stop-location
  useEffect(() => {
    const handleStartEdit = (e) => {
      isMovingStopRef.current = true
      const { lat, lng, id } = e.detail
      if (!mapRef.current) return

      const map = mapInstanceRef.current

      // Limpiar cualquier edición previa
      cleanupEditMode()

      // Usar coordenadas UTM directamente
      const point = new Point([Number.parseFloat(lng), Number.parseFloat(lat)])
      const feature = new Feature({ geometry: point })

      feature.setStyle(
        new Style({
          image: new CircleStyle({
            radius: 8,
            fill: new Fill({ color: "rgba(255, 165, 0, 0.8)" }), // Orange for editing
            stroke: new Stroke({ color: "rgba(255, 140, 0, 1)", width: 3 }),
          }),
        }),
      )

      const source = new VectorSource({ features: [feature] })
      const vectorLayer = new VectorLayer({ source })

      // Marcar la capa como editable para poder limpiarla después
      vectorLayer.set("isEditable", true)

      editableLayerRef.current = vectorLayer
      editableMarkerRef.current = feature
      map.addLayer(vectorLayer)

      const modify = new Modify({ source })
      map.addInteraction(modify)

      modify.on("modifyend", (evt) => {
        const coords = feature.getGeometry().getCoordinates()
        // Mantener coordenadas UTM
        window.dispatchEvent(
          new CustomEvent("update-stop-coordinates", {
            detail: {
              lat: coords[1].toFixed(2), // Y UTM
              lng: coords[0].toFixed(2), // X UTM
            },
          }),
        )
      })
    }

    const handleEndEdit = () => {
      cleanupEditMode()
    }

    window.addEventListener("start-edit-stop-location", handleStartEdit)
    window.addEventListener("end-edit-stop-location", handleEndEdit)

    return () => {
      window.removeEventListener("start-edit-stop-location", handleStartEdit)
      window.removeEventListener("end-edit-stop-location", handleEndEdit)
      cleanupEditMode()
    }
  }, [])

  // Manage React form popup
  useEffect(() => {
    if (popupElementRef.current && popupOverlayRef.current && popupFormConfig) {
      if (popupFormConfig.isVisible && popupFormConfig.mode && popupFormConfig.coordinates) {
        if (!popupRootRef.current) {
          popupRootRef.current = createRoot(popupElementRef.current)
        }
        let FormComponent = null
        if (popupFormConfig.mode === "add" || popupFormConfig.mode === "edit") {
          FormComponent = StopForm
        } else if (popupFormConfig.mode === "add-line" || popupFormConfig.mode === "edit-line") {
          FormComponent = LineForm
        }

        if (FormComponent) {
          popupRootRef.current.render(
            <FormComponent
              key={popupFormConfig.key}
              mode={popupFormConfig.mode}
              initialData={popupFormConfig.initialData}
              onSubmit={
                popupFormConfig.mode.includes("stop") ||
                popupFormConfig.mode === "edit" ||
                popupFormConfig.mode === "add"
                  ? onStopFormSubmit
                  : onLineFormSubmit
              }
              onCancel={
                popupFormConfig.mode.includes("stop") ||
                popupFormConfig.mode === "edit" ||
                popupFormConfig.mode === "add"
                  ? onStopFormCancel
                  : onLineFormCancel
              }
              onDelete={
                popupFormConfig.mode.includes("stop") || popupFormConfig.mode === "edit" ? onStopFormDelete : undefined
              }
            />,
          )
        }
        popupOverlayRef.current.setPosition(popupFormConfig.coordinates)
      } else {
        // If popup should not be visible
        if (popupOverlayRef.current) popupOverlayRef.current.setPosition(undefined)
        if (popupRootRef.current) {
          popupRootRef.current.unmount()
          popupRootRef.current = null
        }
        if (popupElementRef.current) popupElementRef.current.innerHTML = ""
      }
    }
  }, [popupFormConfig, onStopFormSubmit, onStopFormCancel, onStopFormDelete, onLineFormSubmit, onLineFormCancel])

  // Mejorado: Manejo de clics para mover el punto editable
  useEffect(() => {
    const handleClickToMove = (evt) => {
      // Solo procesar si estamos en modo de edición de ubicación
      if (!isMovingStopRef.current) return
      if (!editableMarkerRef.current || !editableLayerRef.current || !mapInstanceRef.current) return

      // No procesar clics en el popup del formulario
      if (evt.originalEvent?.target.closest("#popup-form-container")) return

      // Verificar si el clic fue en una feature existente (parada o línea)
      const map = mapInstanceRef.current
      let clickedOnFeature = false

      map.forEachFeatureAtPixel(evt.pixel, (feature, layer) => {
        // Si el clic fue en una feature que no es la capa editable, ignorar
        if (layer !== editableLayerRef.current) {
          clickedOnFeature = true
        }
      })

      // Si se hizo clic en una feature existente (no editable), no mover el punto
      if (clickedOnFeature) return

      // Mover el punto editable a la nueva posición
      const newCoord = evt.coordinate
      editableMarkerRef.current.getGeometry().setCoordinates(newCoord)

      // Actualizar las coordenadas en el formulario
      window.dispatchEvent(
        new CustomEvent("update-stop-coordinates", {
          detail: {
            lat: newCoord[1].toFixed(2), // Y UTM
            lng: newCoord[0].toFixed(2), // X UTM
          },
        }),
      )
    }

    const map = mapInstanceRef.current
    if (map) {
      map.on("singleclick", handleClickToMove)
    }

    return () => {
      if (map) {
        map.un("singleclick", handleClickToMove)
      }
    }
  }, [])

  // Refresh map data when requested
  useEffect(() => {
    const handleRefresh = () => {
      if (stopLayerRef.current) {
        stopLayerRef.current.getSource().refresh()
      }
      if (lineLayerRef.current) {
        lineLayerRef.current.getSource().refresh()
      }
    }

    window.addEventListener("refresh-map-data", handleRefresh)
    return () => window.removeEventListener("refresh-map-data", handleRefresh)
  }, [])

  return (
    <div className="w-full h-full relative">
      <div id="map" ref={mapRef} className="w-full h-full" />
      <div
        id="popup-form-container"
        ref={popupElementRef}
        className="ol-popup bg-white text-black p-4 rounded-lg shadow-xl border border-gray-300 dark:border-gray-600 min-w-[320px] max-w-md"
      >
        {/* React Form will be rendered here */}
      </div>
    </div>
  )
}
