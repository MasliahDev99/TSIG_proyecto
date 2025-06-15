"use client"

import { useEffect, useRef, useState } from "react"
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
import { get as getProjection, transform } from "ol/proj"
import { Modify } from "ol/interaction"
import { EyeIcon, EyeOffIcon, MapIcon } from "lucide-react"

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

const editableRoutePointStyle = new Style({
  image: new CircleStyle({
    radius: 6,
    fill: new Fill({ color: "rgba(255, 215, 0, 0.8)" }), // Gold for editable route points
    stroke: new Stroke({ color: "rgba(255, 140, 0, 1)", width: 3 }),
  }),
})

const editableLineStyle = new Style({
  stroke: new Stroke({
    color: "rgba(255, 165, 0, 0.9)",
    width: 4,
    lineDash: [10, 5], // Dashed line for editing mode
  }),
})

const invalidLineStyle = new Style({
  stroke: new Stroke({
    color: "rgba(239, 68, 68, 0.9)", // Red for invalid segments
    width: 4,
    lineDash: [5, 5],
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

// Estilos simplificados
const rutaNacionalStyle = new Style({
  stroke: new Stroke({
    color: "rgba(220, 38, 127, 0.9)", // Rosa para rutas nacionales
    width: 4,
  }),
})

const caminoDepartamentalStyle = new Style({
  stroke: new Stroke({
    color: "rgba(139, 69, 19, 0.8)", // Marrón para caminos departamentales
    width: 2,
  }),
})

// Función simplificada para clasificar
const esRutaNacional = (feature) => {
  const props = feature.getProperties()
  const numero = props.numero || 0
  // Simplificado: rutas nacionales son las numeradas del 1 al 99
  return numero >= 1 && numero <= 99
}

// Componente para el control de capas
const LayerControl = ({ showRutasNacionales, showCaminosDepartamentales, onToggleRutas, onToggleCaminos }) => {
  return (
    <div className="absolute top-4 right-4 bg-white rounded-lg shadow-lg border border-gray-200 p-3 z-10 min-w-[200px]">
      <div className="flex items-center mb-2">
        <MapIcon className="h-4 w-4 mr-2 text-gray-600" />
        <h3 className="text-sm font-medium text-gray-800">Capas de Caminería</h3>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="w-4 h-1 bg-pink-600 mr-2 rounded"></div>
            <span className="text-xs text-gray-700">Rutas Nacionales</span>
          </div>
          <button
            onClick={onToggleRutas}
            className={`p-1 rounded ${showRutasNacionales ? "text-blue-600" : "text-gray-400"}`}
            title={showRutasNacionales ? "Ocultar rutas nacionales" : "Mostrar rutas nacionales"}
          >
            {showRutasNacionales ? <EyeIcon className="h-4 w-4" /> : <EyeOffIcon className="h-4 w-4" />}
          </button>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="w-4 h-1 bg-amber-800 mr-2 rounded"></div>
            <span className="text-xs text-gray-700">Caminos Departamentales</span>
          </div>
          <button
            onClick={onToggleCaminos}
            className={`p-1 rounded ${showCaminosDepartamentales ? "text-blue-600" : "text-gray-400"}`}
            title={showCaminosDepartamentales ? "Ocultar caminos departamentales" : "Mostrar caminos departamentales"}
          >
            {showCaminosDepartamentales ? <EyeIcon className="h-4 w-4" /> : <EyeOffIcon className="h-4 w-4" />}
          </button>
        </div>
      </div>

      <div className="mt-3 pt-2 border-t border-gray-200">
        <p className="text-xs text-gray-500">
          {showRutasNacionales || showCaminosDepartamentales
            ? "Las líneas deben seguir completamente las rutas visibles"
            : "Active al menos una capa para crear paradas y líneas"}
        </p>
      </div>
    </div>
  )
}

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
  const camineriaLayerRef = useRef(null)

  const editableLineLayerRef = useRef(null)
  const lineModifyInteractionRef = useRef(null)
  const isEditingLineRouteRef = useRef(false)
  const currentEditingLineIdRef = useRef(null)
  const originalLineCoordinatesRef = useRef([])

  // Estados para controlar la visibilidad de las capas
  const [showRutasNacionales, setShowRutasNacionales] = useState(false)
  const [showCaminosDepartamentales, setShowCaminosDepartamentales] = useState(false)

  // Estado para almacenar los puntos actuales de la línea en construcción
  const [currentLinePoints, setCurrentLinePoints] = useState([])

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
    const montevideoUTM = [583000, 6140000]

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

    // Capa de caminería con estilo optimizado
    const camineriaSource = new VectorSource({
      format: new GeoJSON({
        dataProjection: "EPSG:4326",
        featureProjection: "EPSG:32721",
      }),
      url: (extent) => {
        const wgs84Extent = [
          ...transform([extent[0], extent[1]], "EPSG:32721", "EPSG:4326"),
          ...transform([extent[2], extent[3]], "EPSG:32721", "EPSG:4326"),
        ]

        const baseUrl = `/geoserver/tsig2025/ows`
        const params = new URLSearchParams({
          service: "WFS",
          version: "1.1.0",
          request: "GetFeature",
          typename: "tsig2025:v_camineria_nacional",
          outputFormat: "application/json",
          srsname: "EPSG:4326",
          bbox: `${wgs84Extent.join(",")},EPSG:4326`,
        })
        return `${baseUrl}?${params.toString()}`
      },
      strategy: bboxStrategy,
    })

    // Función de estilo optimizada que se ejecuta una sola vez
    const camineriaStyleFunction = (feature) => {
      const isNacional = esRutaNacional(feature)

      // Verificar visibilidad
      if (isNacional && !showRutasNacionales) {
        return null // No renderizar
      }
      if (!isNacional && !showCaminosDepartamentales) {
        return null // No renderizar
      }

      return isNacional ? rutaNacionalStyle : caminoDepartamentalStyle
    }

    camineriaLayerRef.current = new VectorLayer({
      source: camineriaSource,
      style: camineriaStyleFunction,
    })

    camineriaSource.on("featuresloadend", (event) => {
      console.log("✅ Caminería cargada:", event.features.length, "features")
    })

    temporaryLayerRef.current = new VectorLayer({
      source: new VectorSource(),
      style: (feature) => {
        const styleType = feature.get("style_type")
        const isValid = feature.get("is_valid")

        if (styleType === "selectedForLine") return selectedForLineStyle
        if (styleType === "routePoint") return routePointStyle

        // Para líneas temporales, usar estilo según validez
        if (feature.getGeometry().getType() === "LineString") {
          return isValid === false ? invalidLineStyle : temporaryMarkerStyle
        }

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
        camineriaLayerRef.current,
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
      camineriaLayerRef.current = null
    }
  }, []) // Solo dependencias iniciales

  // Efecto para sincronizar los puntos actuales de la línea
  useEffect(() => {
    const handleUpdateCurrentLinePoints = (event) => {
      const { linePoints } = event.detail
      setCurrentLinePoints(linePoints || [])
    }

    window.addEventListener("update-current-line-points", handleUpdateCurrentLinePoints)

    return () => {
      window.removeEventListener("update-current-line-points", handleUpdateCurrentLinePoints)
    }
  }, [])

  // Efecto optimizado para actualizar visibilidad
  useEffect(() => {
    if (camineriaLayerRef.current) {
      // Actualizar el estilo de la capa
      camineriaLayerRef.current.setStyle((feature) => {
        const isNacional = esRutaNacional(feature)

        if (isNacional && !showRutasNacionales) {
          return null
        }
        if (!isNacional && !showCaminosDepartamentales) {
          return null
        }

        return isNacional ? rutaNacionalStyle : caminoDepartamentalStyle
      })
    }
  }, [showRutasNacionales, showCaminosDepartamentales])

  // Handle map clicks
  useEffect(() => {
    if (!mapInstanceRef.current || !onMapInteractionRequest) return

    const map = mapInstanceRef.current
    const clickHandler = (evt) => {
      if (popupFormConfig && popupFormConfig.isVisible) {
        // Si el formulario está visible, verificar si es para routing
        if (popupFormConfig.mode === "add-line" && popupFormConfig.initialData?.isRoutingMode) {
          console.log("🎯 Formulario de routing abierto, verificando clic en parada...")

          let featureClicked = null
          let layerClicked = null
          map.forEachFeatureAtPixel(evt.pixel, (feature, layer) => {
            if (!featureClicked) {
              featureClicked = feature
              layerClicked = layer
            }
          })

          // Si se hizo clic en una parada, procesarla para routing
          if (featureClicked && layerClicked === stopLayerRef.current) {
            console.log("🚏 Clic en parada detectado para routing")
            onMapInteractionRequest({
              type: "STOP_CLICK_FOR_ROUTING_LINE",
              payload: {
                featureData: featureClicked.getProperties(),
                coordinates: featureClicked.getGeometry().getCoordinates(),
              },
            })
            return // Salir temprano para evitar otros procesamientos
          }
        }

        // Para otros casos con formulario abierto, no procesar clics
        return
      }

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
            featureClicked = feature
            layerClicked = layer
          }
        })

        if (activeTool === "add-stop") {
          if (!showRutasNacionales && !showCaminosDepartamentales) {
            if (popupElementRef.current && popupOverlayRef.current) {
              popupElementRef.current.innerHTML = `
        <div class="p-3 text-sm text-red-700 bg-red-100 rounded-lg border border-red-200">
          <h4 class="font-medium mb-1">⚠️ Sin capas de referencia</h4>
          <p>Active al menos una capa de caminería para crear paradas.</p>
          <button id="popup-closer-btn" class="ol-popup-closer">&times;</button>
        </div>
      `
              popupOverlayRef.current.setPosition(evt.coordinate)
              document.getElementById("popup-closer-btn")?.addEventListener("click", () => {
                popupOverlayRef.current?.setPosition(undefined)
              })
            }
            return
          }

          if (!isPointOnCamineria(evt.coordinate)) {
            if (popupElementRef.current && popupOverlayRef.current) {
              const capasVisibles = []
              if (showRutasNacionales) capasVisibles.push("rutas nacionales (rosa)")
              if (showCaminosDepartamentales) capasVisibles.push("caminos departamentales (marrón)")

              popupElementRef.current.innerHTML = `
<div class="p-3 text-sm text-red-700 bg-red-100 rounded-lg border border-red-200">
  <h4 class="font-medium mb-1">⚠️ Ubicación no válida</h4>
  <p>Las paradas solo pueden crearse sobre: ${capasVisibles.join(" o ")}.</p>
  <button id="popup-closer-btn" class="ol-popup-closer">&times;</button>
</div>
`
              popupOverlayRef.current.setPosition(evt.coordinate)
              document.getElementById("popup-closer-btn")?.addEventListener("click", () => {
                popupOverlayRef.current?.setPosition(undefined)
              })
            }
            return
          }

          onMapInteractionRequest({
            type: "MAP_CLICK_FOR_ADD",
            payload: { coordinates: evt.coordinate },
          })
        } else if (activeTool === "add-line") {
          if (featureClicked && layerClicked === stopLayerRef.current) {
            // Clicked on a stop - validate the segment if there are existing points
            const newCoordinate = featureClicked.getGeometry().getCoordinates()

            if (currentLinePoints.length > 0) {
              const lastPoint = currentLinePoints[currentLinePoints.length - 1]
              const segmentCoordinates = [lastPoint.coordinates, newCoordinate]

              if (!validateSegmentFollowsRoads(segmentCoordinates)) {
                showInvalidSegmentMessage(evt.coordinate, "parada")
                return
              }
            }

            onMapInteractionRequest({
              type: "STOP_CLICK_FOR_LINE",
              payload: {
                featureData: featureClicked.getProperties(),
                coordinates: newCoordinate,
              },
            })
          } else {
            // Verificar si hay capas visibles
            if (!showRutasNacionales && !showCaminosDepartamentales) {
              if (popupElementRef.current && popupOverlayRef.current) {
                popupElementRef.current.innerHTML = `
          <div class="p-3 text-sm text-red-700 bg-red-100 rounded-lg border border-red-200">
            <h4 class="font-medium mb-1">⚠️ Sin capas de referencia</h4>
            <p>Active al menos una capa de caminería para crear puntos de ruta.</p>
            <button id="popup-closer-btn" class="ol-popup-closer">&times;</button>
          </div>
        `
                popupOverlayRef.current.setPosition(evt.coordinate)
                document.getElementById("popup-closer-btn")?.addEventListener("click", () => {
                  popupOverlayRef.current?.setPosition(undefined)
                })
              }
              return
            }

            // Validar que el punto esté sobre una ruta
            if (!isPointOnCamineria(evt.coordinate)) {
              if (popupElementRef.current && popupOverlayRef.current) {
                const capasVisibles = []
                if (showRutasNacionales) capasVisibles.push("rutas nacionales (rosa)")
                if (showCaminosDepartamentales) capasVisibles.push("caminos departamentales (marrón)")

                popupElementRef.current.innerHTML = `
          <div class="p-3 text-sm text-red-700 bg-red-100 rounded-lg border border-red-200">
            <h4 class="font-medium mb-1">⚠️ Ubicación no válida</h4>
            <p>Los puntos de ruta solo pueden crearse sobre: ${capasVisibles.join(" o ")}.</p>
            <button id="popup-closer-btn" class="ol-popup-closer">&times;</button>
          </div>
        `
                popupOverlayRef.current.setPosition(evt.coordinate)
                document.getElementById("popup-closer-btn")?.addEventListener("click", () => {
                  popupOverlayRef.current?.setPosition(undefined)
                })
              }
              return
            }

            // Si hay puntos existentes, validar el segmento completo
            if (currentLinePoints.length > 0) {
              const lastPoint = currentLinePoints[currentLinePoints.length - 1]
              const segmentCoordinates = [lastPoint.coordinates, evt.coordinate]

              if (!validateSegmentFollowsRoads(segmentCoordinates)) {
                showInvalidSegmentMessage(evt.coordinate, "punto de ruta")
                return
              }
            }

            onMapInteractionRequest({
              type: "MAP_CLICK_FOR_LINE_ROUTE",
              payload: { coordinates: evt.coordinate },
            })
          }
        } else if (activeTool === "add-line-routing") {
          // Verificar si hay capas visibles
          if (!showRutasNacionales && !showCaminosDepartamentales) {
            if (popupElementRef.current && popupOverlayRef.current) {
              popupElementRef.current.innerHTML = `
        <div class="p-3 text-sm text-red-700 bg-red-100 rounded-lg border border-red-200">
          <h4 class="font-medium mb-1">⚠️ Sin capas de referencia</h4>
          <p>Active al menos una capa de caminería para crear rutas automáticas.</p>
          <button id="popup-closer-btn" class="ol-popup-closer">&times;</button>
        </div>
      `
              popupOverlayRef.current.setPosition(evt.coordinate)
              document.getElementById("popup-closer-btn")?.addEventListener("click", () => {
                popupOverlayRef.current?.setPosition(undefined)
              })
            }
            return
          }

          // Validar que el punto esté sobre una ruta
          if (!isPointOnCamineria(evt.coordinate)) {
            if (popupElementRef.current && popupOverlayRef.current) {
              const capasVisibles = []
              if (showRutasNacionales) capasVisibles.push("rutas nacionales (rosa)")
              if (showCaminosDepartamentales) capasVisibles.push("caminos departamentales (marrón)")

              popupElementRef.current.innerHTML = `
        <div class="p-3 text-sm text-red-700 bg-red-100 rounded-lg border border-red-200">
          <h4 class="font-medium mb-1">⚠️ Ubicación no válida</h4>
          <p>Los puntos de ruta solo pueden seleccionarse sobre: ${capasVisibles.join(" o ")}.</p>
          <button id="popup-closer-btn" class="ol-popup-closer">&times;</button>
        </div>
      `
              popupOverlayRef.current.setPosition(evt.coordinate)
              document.getElementById("popup-closer-btn")?.addEventListener("click", () => {
                popupOverlayRef.current?.setPosition(undefined)
              })
            }
            return
          }

          onMapInteractionRequest({
            type: "ROUTING_POINT_SELECTED",
            payload: { coordinates: evt.coordinate },
          })
        } else if (activeTool === "edit-stop" && featureClicked && layerClicked === stopLayerRef.current) {
          const props = featureClicked.getProperties()
          const geom = featureClicked.getGeometry()
          const coordinates = geom.getCoordinates()

          const enrichedProps = {
            ...props,
            lat: coordinates[1],
            lng: coordinates[0],
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
        } else if (activeTool === "edit-line" && !featureClicked && isEditingLineRouteRef.current) {
          // Add new route point when in line editing mode
          window.dispatchEvent(
            new CustomEvent("add-line-route-point", {
              detail: { coordinate: evt.coordinate },
            }),
          )
        } else if (!activeTool && featureClicked) {
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
        // Public user click logic (simplified)
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

    // Handle right-click for removing points/stops during line creation AND line editing
    const rightClickHandler = (evt) => {
      if (!isAdmin) return

      evt.preventDefault() // Prevent context menu

      let featureClicked = null
      let layerClicked = null
      map.forEachFeatureAtPixel(evt.pixel, (feature, layer) => {
        if (!featureClicked) {
          featureClicked = feature
          layerClicked = layer
        }
      })

      // Handle right-click during line creation (add-line tool)
      if (activeTool === "add-line") {
        // Check if clicked on a temporary feature (selected stop or route point)
        if (featureClicked && layerClicked === temporaryLayerRef.current) {
          const styleType = featureClicked.get("style_type")
          const geometry = featureClicked.getGeometry()
          const coordinates = geometry.getCoordinates()

          if (styleType === "selectedForLine") {
            // Remove selected stop
            onMapInteractionRequest({
              type: "REMOVE_STOP_FROM_LINE",
              payload: { coordinates },
            })
          } else if (styleType === "routePoint") {
            // Remove route point
            onMapInteractionRequest({
              type: "REMOVE_ROUTE_POINT",
              payload: { coordinates },
            })
          }
        }
      }
      // Handle right-click during line editing
      else if (isEditingLineRouteRef.current && editableLineLayerRef.current) {
        // Check if clicked on an editable point feature
        if (featureClicked && layerClicked === editableLineLayerRef.current) {
          const geometry = featureClicked.getGeometry()

          // Only handle point features (not the line itself)
          if (geometry.getType() === "Point") {
            const pointIndex = featureClicked.get("pointIndex")
            const coordinates = geometry.getCoordinates()

            console.log("🗑️ Click derecho en punto editable, índice:", pointIndex)

            // Get current line coordinates
            const source = editableLineLayerRef.current.getSource()
            const features = source.getFeatures()
            const lineFeature = features.find((f) => f.getGeometry().getType() === "LineString")

            if (lineFeature && typeof pointIndex === "number") {
              const currentCoordinates = lineFeature.getGeometry().getCoordinates()

              // Don't allow deletion if it would leave less than 2 points
              if (currentCoordinates.length <= 2) {
                console.log("❌ No se puede eliminar: la línea debe tener al menos 2 puntos")
                if (popupElementRef.current && popupOverlayRef.current) {
                  popupElementRef.current.innerHTML = `
                    <div class="p-3 text-sm text-red-700 bg-red-100 rounded-lg border border-red-200">
                      <h4 class="font-medium mb-1">❌ No se puede eliminar</h4>
                      <p>La línea debe tener al menos 2 puntos.</p>
                      <button id="popup-closer-btn" class="ol-popup-closer">&times;</button>
                    </div>
                  `
                  popupOverlayRef.current.setPosition(coordinates)
                  document.getElementById("popup-closer-btn")?.addEventListener("click", () => {
                    popupOverlayRef.current?.setPosition(undefined)
                  })

                  // Auto-cerrar después de 3 segundos
                  setTimeout(() => {
                    if (popupOverlayRef.current) {
                      popupOverlayRef.current.setPosition(undefined)
                    }
                  }, 3000)
                }
                return
              }

              // Remove the point from coordinates array
              const newCoordinates = currentCoordinates.filter((_, index) => index !== pointIndex)

              console.log("🔍 Validando línea después de eliminar punto...")

              // Validate the line after removing the point
              const validation = validateLineFollowsRoads(newCoordinates, false)

              if (!validation.isValid) {
                console.log("❌ No se puede eliminar: la línea resultante no seguiría las rutas")
                if (popupElementRef.current && popupOverlayRef.current) {
                  popupElementRef.current.innerHTML = `
                    <div class="p-3 text-sm text-red-700 bg-red-100 rounded-lg border border-red-200">
                      <h4 class="font-medium mb-1">❌ No se puede eliminar</h4>
                      <p>Eliminar este punto haría que la línea no siga las rutas disponibles.</p>
                      <button id="popup-closer-btn" class="ol-popup-closer">&times;</button>
                    </div>
                  `
                  popupOverlayRef.current.setPosition(coordinates)
                  document.getElementById("popup-closer-btn")?.addEventListener("click", () => {
                    popupOverlayRef.current?.setPosition(undefined)
                  })

                  // Auto-cerrar después de 4 segundos
                  setTimeout(() => {
                    if (popupOverlayRef.current) {
                      popupOverlayRef.current.setPosition(undefined)
                    }
                  }, 4000)
                }
                return
              }

              console.log("✅ Eliminando punto válido")

              // Update the line geometry
              lineFeature.getGeometry().setCoordinates(newCoordinates)
              originalLineCoordinatesRef.current = [...newCoordinates]

              // Remove the point feature from the source
              source.removeFeature(featureClicked)

              // Update point indices for remaining point features
              const pointFeatures = features.filter((f) => f.getGeometry().getType() === "Point")
              pointFeatures.forEach((pointFeature, index) => {
                if (index < newCoordinates.length) {
                  pointFeature.getGeometry().setCoordinates(newCoordinates[index])
                  pointFeature.set("pointIndex", index)
                  pointFeature.set("originalCoordinate", [...newCoordinates[index]])
                }
              })

              // Dispatch update event
              window.dispatchEvent(
                new CustomEvent("update-line-route", {
                  detail: {
                    lineId: currentEditingLineIdRef.current,
                    coordinates: newCoordinates,
                  },
                }),
              )

              // Show success message
              if (popupElementRef.current && popupOverlayRef.current) {
                popupElementRef.current.innerHTML = `
                  <div class="p-3 text-sm text-green-700 bg-green-100 rounded-lg border border-green-200">
                    <h4 class="font-medium mb-1">✅ Punto eliminado</h4>
                    <p>El punto se eliminó correctamente de la línea.</p>
                    <button id="popup-closer-btn" class="ol-popup-closer">&times;</button>
                  </div>
                `
                popupOverlayRef.current.setPosition(coordinates)
                document.getElementById("popup-closer-btn")?.addEventListener("click", () => {
                  popupOverlayRef.current?.setPosition(undefined)
                })

                // Auto-cerrar después de 2 segundos
                setTimeout(() => {
                  if (popupOverlayRef.current) {
                    popupOverlayRef.current.setPosition(undefined)
                  }
                }, 2000)
              }
            }
          }
        }
      }
    }

    map.on("contextmenu", rightClickHandler)

    // Handle double-click for removing points/stops during line creation
    const doubleClickHandler = (evt) => {
      if (!isAdmin || activeTool !== "add-line") return

      evt.preventDefault()

      let featureClicked = null
      let layerClicked = null
      map.forEachFeatureAtPixel(evt.pixel, (feature, layer) => {
        if (!featureClicked) {
          featureClicked = feature
          layerClicked = layer
        }
      })

      // Check if double-clicked on a stop or temporary feature
      if (featureClicked) {
        if (layerClicked === stopLayerRef.current) {
          // Double-clicked on a stop - remove it from selection
          const stopData = featureClicked.getProperties()
          const stopId = stopData.id_parada || stopData.id

          onMapInteractionRequest({
            type: "REMOVE_STOP_FROM_LINE_BY_ID",
            payload: { stopId },
          })
        } else if (layerClicked === temporaryLayerRef.current) {
          // Double-clicked on a temporary feature
          const styleType = featureClicked.get("style_type")
          const geometry = featureClicked.getGeometry()
          const coordinates = geometry.getCoordinates()

          if (styleType === "selectedForLine") {
            onMapInteractionRequest({
              type: "REMOVE_STOP_FROM_LINE",
              payload: { coordinates },
            })
          } else if (styleType === "routePoint") {
            onMapInteractionRequest({
              type: "REMOVE_ROUTE_POINT",
              payload: { coordinates },
            })
          }
        }
      }
    }

    map.on("dblclick", doubleClickHandler)

    return () => {
      map.un("click", clickHandler)
      map.un("contextmenu", rightClickHandler)
      map.un("dblclick", doubleClickHandler)
    }
  }, [
    isAdmin,
    activeTool,
    onMapInteractionRequest,
    popupFormConfig,
    showRutasNacionales,
    showCaminosDepartamentales,
    isEditingLineRouteRef,
    currentLinePoints,
  ])

  // Función para validar que un segmento sigue las rutas
  const validateSegmentFollowsRoads = (segmentCoordinates) => {
    if (segmentCoordinates.length !== 2) return false

    console.log("🔍 Validando segmento:", segmentCoordinates)

    // Verificar que hay capas de caminería visibles
    if (!showRutasNacionales && !showCaminosDepartamentales) {
      console.log("❌ No hay capas de caminería visibles")
      return false
    }

    // Verificar que hay features de caminería cargadas
    if (!camineriaLayerRef.current || !camineriaLayerRef.current.getSource()) {
      console.log("❌ No hay capa de caminería disponible")
      return false
    }

    const features = camineriaLayerRef.current.getSource().getFeatures()
    if (features.length === 0) {
      console.log("❌ No hay features de caminería cargadas")
      return false
    }

    const tolerance = 25 // Tolerancia estricta
    const samplePoints = 20 // Muchos puntos de muestra

    const [startPoint, endPoint] = segmentCoordinates

    // Verificar que ambos extremos estén sobre rutas
    if (!isPointOnCamineriaWithTolerance(startPoint, tolerance)) {
      console.log("❌ Punto inicial del segmento no está sobre ruta")
      return false
    }

    if (!isPointOnCamineriaWithTolerance(endPoint, tolerance)) {
      console.log("❌ Punto final del segmento no está sobre ruta")
      return false
    }

    // Verificar todos los puntos interpolados del segmento
    for (let i = 1; i < samplePoints; i++) {
      const ratio = i / samplePoints
      const interpolatedPoint = [
        startPoint[0] + (endPoint[0] - startPoint[0]) * ratio,
        startPoint[1] + (endPoint[1] - startPoint[1]) * ratio,
      ]

      if (!isPointOnCamineriaWithTolerance(interpolatedPoint, tolerance)) {
        console.log(`❌ Punto interpolado ${i}/${samplePoints} no está sobre ruta`)
        console.log(
          `📍 Coordenadas problemáticas: [${interpolatedPoint[0].toFixed(2)}, ${interpolatedPoint[1].toFixed(2)}]`,
        )
        return false
      }
    }

    console.log("✅ Segmento válido - sigue completamente las rutas")
    return true
  }

  // Función para mostrar mensaje de segmento inválido
  const showInvalidSegmentMessage = (coordinate, tipoElemento) => {
    if (popupElementRef.current && popupOverlayRef.current) {
      const capasVisibles = []
      if (showRutasNacionales) capasVisibles.push("rutas nacionales (rosa)")
      if (showCaminosDepartamentales) capasVisibles.push("caminos departamentales (marrón)")

      popupElementRef.current.innerHTML = `
        <div class="p-3 text-sm text-red-700 bg-red-100 rounded-lg border border-red-200">
          <h4 class="font-medium mb-1">❌ Tramo no válido</h4>
          <p>No se puede colocar este ${tipoElemento} porque el tramo desde el último punto no sigue completamente las rutas disponibles (${capasVisibles.join(" o ")}).</p>
          <p class="mt-2 text-xs">💡 Coloque puntos intermedios que sigan las rutas para conectar estos puntos.</p>
          <button id="popup-closer-btn" class="ol-popup-closer">&times;</button>
        </div>
      `
      popupOverlayRef.current.setPosition(coordinate)
      document.getElementById("popup-closer-btn")?.addEventListener("click", () => {
        popupOverlayRef.current?.setPosition(undefined)
      })

      // Auto-cerrar después de 5 segundos
      setTimeout(() => {
        if (popupOverlayRef.current) {
          popupOverlayRef.current.setPosition(undefined)
        }
      }, 5000)
    }
  }

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
              // Agregar información de validez para líneas
              if (featureData.is_valid !== undefined) {
                feature.set("is_valid", featureData.is_valid)
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

  const cleanupEditMode = () => {
    if (mapInstanceRef.current) {
      const map = mapInstanceRef.current

      // Remove editable layers
      map.getLayers().forEach((layer) => {
        if (layer.get("isEditable")) {
          map.removeLayer(layer)
        }
      })

      // Remove modify interactions
      map.getInteractions().forEach((interaction) => {
        if (interaction.constructor.name === "Modify") {
          map.removeInteraction(interaction)
        }
      })
    }
  }

  const cleanupLineEditMode = () => {
    if (mapInstanceRef.current) {
      const map = mapInstanceRef.current

      // Remove line editing layers
      map.getLayers().forEach((layer) => {
        if (layer.get("isLineEditable")) {
          map.removeLayer(layer)
        }
      })

      // Remove line modify interactions
      map.getInteractions().forEach((interaction) => {
        if (interaction.constructor.name === "Modify" && interaction.get("isLineModify")) {
          map.removeInteraction(interaction)
        }
      })
    }
  }

  // Función optimizada para verificar proximidad
  const isPointOnCamineria = (coordinate) => {
    console.log("🔍 Verificando punto:", coordinate)

    if (!camineriaLayerRef.current || !camineriaLayerRef.current.getSource()) {
      console.log("❌ No hay capa de caminería disponible")
      return false
    }

    const features = camineriaLayerRef.current.getSource().getFeatures()
    console.log("🛣️ Features de caminería disponibles:", features.length)

    if (features.length === 0) {
      console.log("❌ No hay features de caminería cargadas")
      return false
    }

    // Verificar si hay al menos una capa visible
    if (!showRutasNacionales && !showCaminosDepartamentales) {
      console.log("❌ No hay capas de caminería visibles")
      return false
    }

    const tolerance = 20 // Tolerancia para puntos individuales

    let validFeaturesCount = 0
    let closestDistance = Number.POSITIVE_INFINITY

    for (const feature of features) {
      const geometry = feature.getGeometry()
      if (!geometry) continue

      const isNacional = esRutaNacional(feature)

      // Solo verificar features visibles
      if ((isNacional && !showRutasNacionales) || (!isNacional && !showCaminosDepartamentales)) {
        continue
      }

      validFeaturesCount++

      try {
        const closestPoint = geometry.getClosestPoint(coordinate)
        const distance = Math.sqrt(
          Math.pow(coordinate[0] - closestPoint[0], 2) + Math.pow(coordinate[1] - closestPoint[1], 2),
        )

        if (distance < closestDistance) {
          closestDistance = distance
        }

        console.log(
          `📏 Distancia a ${isNacional ? "ruta nacional" : "camino departamental"}:`,
          distance.toFixed(2),
          "metros",
        )

        if (distance <= tolerance) {
          console.log("✅ Punto está sobre un camino válido (distancia:", distance.toFixed(2), "m)")
          return true
        }
      } catch (error) {
        console.error("Error calculando distancia:", error)
      }
    }

    console.log("📊 Resumen validación:")
    console.log("- Features válidos verificados:", validFeaturesCount)
    console.log("- Distancia más cercana:", closestDistance.toFixed(2), "metros")
    console.log("- Tolerancia:", tolerance, "metros")
    console.log("❌ Punto no está sobre ningún camino válido")

    return false
  }

  // Función para validar que una línea completa siga las rutas
  const validateLineFollowsRoads = (coordinates, isConstructionMode = false) => {
    if (!coordinates || coordinates.length < 2) {
      return { isValid: false, invalidSegments: [] }
    }

    console.log("🛣️ Validando línea completa con", coordinates.length, "puntos")

    // Verificar que hay capas de caminería visibles
    if (!showRutasNacionales && !showCaminosDepartamentales) {
      console.log("❌ No hay capas de caminería visibles")
      return { isValid: false, invalidSegments: [] }
    }

    // Verificar que hay features de caminería cargadas
    if (!camineriaLayerRef.current || !camineriaLayerRef.current.getSource()) {
      console.log("❌ No hay capa de caminería disponible")
      return { isValid: false, invalidSegments: [] }
    }

    const features = camineriaLayerRef.current.getSource().getFeatures()
    if (features.length === 0) {
      console.log("❌ No hay features de caminería cargadas")
      return { isValid: false, invalidSegments: [] }
    }

    const invalidSegments = []

    // Tolerancia muy estricta
    const lineTolerance = 25 // Muy estricta: 25 metros
    const segmentSamplePoints = 15 // Muchos puntos de muestra para verificar todo el recorrido

    console.log(`📏 Usando tolerancia ESTRICTA: ${lineTolerance}m, puntos de muestra: ${segmentSamplePoints}`)

    // Primero verificar que TODOS los puntos estén sobre rutas
    for (let i = 0; i < coordinates.length; i++) {
      if (!isPointOnCamineriaWithTolerance(coordinates[i], lineTolerance)) {
        console.log(`❌ Punto ${i + 1} no está sobre una ruta válida`)
        invalidSegments.push(i)
      }
    }

    // Si ya hay puntos inválidos, no continuar
    if (invalidSegments.length > 0) {
      console.log(`❌ ${invalidSegments.length} puntos no están sobre rutas válidas`)
      return { isValid: false, invalidSegments }
    }

    // Verificar cada segmento del recorrido
    for (let i = 0; i < coordinates.length - 1; i++) {
      const startPoint = coordinates[i]
      const endPoint = coordinates[i + 1]

      console.log(`🔍 Validando segmento ${i + 1}/${coordinates.length - 1}`)

      // Verificar TODOS los puntos intermedios del segmento
      let segmentValid = true
      for (let j = 1; j < segmentSamplePoints; j++) {
        const ratio = j / segmentSamplePoints
        const interpolatedPoint = [
          startPoint[0] + (endPoint[0] - startPoint[0]) * ratio,
          startPoint[1] + (endPoint[1] - startPoint[1]) * ratio,
        ]

        if (!isPointOnCamineriaWithTolerance(interpolatedPoint, lineTolerance)) {
          console.log(`❌ Punto interpolado ${j}/${segmentSamplePoints} del segmento ${i + 1} NO está sobre ruta`)
          console.log(
            `📍 Coordenadas problemáticas: [${interpolatedPoint[0].toFixed(2)}, ${interpolatedPoint[1].toFixed(2)}]`,
          )
          segmentValid = false
          break
        }
      }

      if (!segmentValid) {
        invalidSegments.push(i)
        console.log(`❌ Segmento ${i + 1} es INVÁLIDO - no sigue las rutas`)
      }
    }

    const isValid = invalidSegments.length === 0
    console.log(`📊 RESULTADO FINAL: ${isValid ? "✅ LÍNEA VÁLIDA" : "❌ LÍNEA INVÁLIDA"}`)

    if (!isValid) {
      console.log("❌ Segmentos inválidos:", invalidSegments)
      console.log("💡 La línea debe seguir COMPLETAMENTE las rutas disponibles")
    }

    return { isValid, invalidSegments }
  }

  // Función auxiliar para validación con tolerancia personalizada
  const isPointOnCamineriaWithTolerance = (coordinate, tolerance) => {
    if (!camineriaLayerRef.current || !camineriaLayerRef.current.getSource()) {
      return false
    }

    const features = camineriaLayerRef.current.getSource().getFeatures()
    if (features.length === 0) return false

    // Verificar si hay al menos una capa visible
    if (!showRutasNacionales && !showCaminosDepartamentales) {
      return false
    }

    let closestDistance = Number.POSITIVE_INFINITY
    let foundValidRoute = false

    for (const feature of features) {
      const geometry = feature.getGeometry()
      if (!geometry) continue

      const isNacional = esRutaNacional(feature)

      // Solo verificar features visibles
      if ((isNacional && !showRutasNacionales) || (!isNacional && !showCaminosDepartamentales)) {
        continue
      }

      try {
        const closestPoint = geometry.getClosestPoint(coordinate)
        const distance = Math.sqrt(
          Math.pow(coordinate[0] - closestPoint[0], 2) + Math.pow(coordinate[1] - closestPoint[1], 2),
        )

        if (distance < closestDistance) {
          closestDistance = distance
        }

        if (distance <= tolerance) {
          foundValidRoute = true
          break // Encontramos una ruta válida, no necesitamos seguir buscando
        }
      } catch (error) {
        console.error("Error calculando distancia:", error)
      }
    }

    if (!foundValidRoute && closestDistance !== Number.POSITIVE_INFINITY) {
      console.log(`📏 Punto más cercano a ruta: ${closestDistance.toFixed(2)}m (tolerancia: ${tolerance}m)`)
    }

    return foundValidRoute
  }

  // Edit mode effects (simplified)
  useEffect(() => {
    const handleStartEdit = (e) => {
      isMovingStopRef.current = true
      const { lat, lng, id } = e.detail
      if (!mapRef.current) return

      const map = mapInstanceRef.current
      cleanupEditMode()

      // Crear una función que capture el estado actual
      const getCurrentLayerVisibility = () => {
        return {
          rutasVisible: showRutasNacionales,
          caminosVisible: showCaminosDepartamentales,
        }
      }

      // Verificar si hay al menos una capa de caminería visible
      const { rutasVisible, caminosVisible } = getCurrentLayerVisibility()
      if (!rutasVisible && !caminosVisible) {
        // Solo activar automáticamente las capas, sin mostrar popup que interfiera
        console.log("⚠️ No hay capas visibles, activando automáticamente...")
        setShowRutasNacionales(true)
        setShowCaminosDepartamentales(true)
      }

      const originalCoordinates = [Number.parseFloat(lng), Number.parseFloat(lat)]
      const point = new Point(originalCoordinates)
      const feature = new Feature({ geometry: point })

      // Guardar las coordenadas originales en el feature
      feature.set("originalCoordinates", originalCoordinates)

      feature.setStyle(
        new Style({
          image: new CircleStyle({
            radius: 8,
            fill: new Fill({ color: "rgba(255, 165, 0, 0.8)" }),
            stroke: new Stroke({ color: "rgba(255, 140, 0, 1)", width: 3 }),
          }),
        }),
      )

      const source = new VectorSource({ features: [feature] })
      const vectorLayer = new VectorLayer({ source })
      vectorLayer.set("isEditable", true)

      editableLayerRef.current = vectorLayer
      editableMarkerRef.current = feature
      map.addLayer(vectorLayer)

      const modify = new Modify({ source })
      map.addInteraction(modify)

      // Evento que se dispara mientras se está arrastrando (antes de soltar)
      modify.on("modifystart", (evt) => {
        console.log("🎯 Iniciando modificación de parada")
      })

      // Evento que se dispara cuando se suelta el punto
      modify.on("modifyend", (evt) => {
        const coords = feature.getGeometry().getCoordinates()
        console.log("🔍 Verificando nueva posición:", coords)

        // Verificar si hay capas visibles primero usando el estado actual
        const currentVisibility = getCurrentLayerVisibility()
        if (!currentVisibility.rutasVisible && !currentVisibility.caminosVisible) {
          console.log("❌ No hay capas visibles, revirtiendo...")
          const originalCoords = feature.get("originalCoordinates")
          feature.getGeometry().setCoordinates(originalCoords)

          // Solo mostrar mensaje en consola, no popup que interfiera
          console.log("❌ Active al menos una capa de caminería para mover la parada")
          return
        }

        // Verificar si el punto modificado está sobre un camino
        const isValidLocation = isPointOnCamineria(coords)
        console.log("✅ ¿Ubicación válida?", isValidLocation)

        if (!isValidLocation) {
          console.log("❌ Ubicación no válida, revirtiendo...")

          // Revertir a la posición original INMEDIATAMENTE
          const originalCoords = feature.get("originalCoordinates")
          feature.getGeometry().setCoordinates(originalCoords)

          // Solo mostrar mensaje en consola para no interferir con el formulario
          const capasVisibles = []
          if (currentVisibility.rutasVisible) capasVisibles.push("rutas nacionales")
          if (currentVisibility.caminosVisible) capasVisibles.push("caminos departamentales")

          console.log(`❌ Ubicación no válida. Las paradas solo pueden ubicarse sobre: ${capasVisibles.join(" o ")}`)

          // NO actualizar las coordenadas en el formulario
          return
        }

        console.log("✅ Ubicación válida, actualizando coordenadas")

        // Si la ubicación es válida, actualizar las coordenadas originales para futuras validaciones
        feature.set("originalCoordinates", coords)

        window.dispatchEvent(
          new CustomEvent("update-stop-coordinates", {
            detail: {
              lat: coords[1].toFixed(2),
              lng: coords[0].toFixed(2),
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
  }, [showRutasNacionales, showCaminosDepartamentales])

  // Line route editing effects
  useEffect(() => {
    const handleStartLineEdit = (e) => {
      const { lineId, coordinates } = e.detail
      if (!mapInstanceRef.current) return

      console.log("🛠️ Iniciando edición de línea:", lineId, coordinates)

      // Guardar las coordenadas originales
      originalLineCoordinatesRef.current = [...coordinates]

      isEditingLineRouteRef.current = true
      currentEditingLineIdRef.current = lineId

      const map = mapInstanceRef.current
      cleanupLineEditMode()

      // Verificar si hay al menos una capa de caminería visible
      if (!showRutasNacionales && !showCaminosDepartamentales) {
        console.log("⚠️ No hay capas visibles, activando automáticamente...")
        setShowRutasNacionales(true)
        setShowCaminosDepartamentales(true)
      }

      // Validar la línea inicial (modo edición, más estricto)
      const validation = validateLineFollowsRoads(coordinates, false)
      if (!validation.isValid) {
        console.log("⚠️ La línea actual no sigue completamente las rutas disponibles")
      }

      // Create editable line feature
      const lineGeometry = new LineString(coordinates)
      const lineFeature = new Feature({ geometry: lineGeometry })
      lineFeature.setStyle(validation.isValid ? editableLineStyle : invalidLineStyle)

      // Create editable points for each coordinate
      const pointFeatures = coordinates.map((coord, index) => {
        const pointGeometry = new Point(coord)
        const pointFeature = new Feature({
          geometry: pointGeometry,
          pointIndex: index,
          originalCoordinate: [...coord], // Guardar coordenada original
        })
        pointFeature.setStyle(editableRoutePointStyle)
        return pointFeature
      })

      const source = new VectorSource({
        features: [lineFeature, ...pointFeatures],
      })
      const vectorLayer = new VectorLayer({ source })
      vectorLayer.set("isLineEditable", true)

      editableLineLayerRef.current = vectorLayer
      map.addLayer(vectorLayer)

      // Create modify interaction for the line and points
      const modify = new Modify({
        source,
        condition: (event) => true,
      })
      modify.set("isLineModify", true)
      lineModifyInteractionRef.current = modify
      map.addInteraction(modify)

      // Handle modifications
      modify.on("modifyend", (evt) => {
        const features = evt.features.getArray()

        // Find the line feature and extract coordinates
        const lineFeature = features.find((f) => f.getGeometry().getType() === "LineString")
        if (lineFeature) {
          const newCoordinates = lineFeature.getGeometry().getCoordinates()

          console.log("🔍 Validando línea modificada...")

          // Verificar si hay al menos una capa de caminería visible
          if (!showRutasNacionales && !showCaminosDepartamentales) {
            console.log("❌ No hay capas visibles, revirtiendo...")
            lineFeature.getGeometry().setCoordinates(originalLineCoordinatesRef.current)
            return
          }

          // Validar la línea completa (modo edición, más estricto)
          const validation = validateLineFollowsRoads(newCoordinates, false)

          if (!validation.isValid) {
            console.log("❌ La línea modificada no sigue las rutas disponibles, revirtiendo...")

            // Revertir a las coordenadas originales
            lineFeature.getGeometry().setCoordinates(originalLineCoordinatesRef.current)
            lineFeature.setStyle(editableLineStyle)

            // Revertir también los puntos
            const pointFeatures = features.filter((f) => f.getGeometry().getType() === "Point")
            pointFeatures.forEach((pointFeature, index) => {
              if (index < originalLineCoordinatesRef.current.length) {
                pointFeature.getGeometry().setCoordinates(originalLineCoordinatesRef.current[index])
              }
            })

            // Mostrar mensaje en consola
            const capasVisibles = []
            if (showRutasNacionales) capasVisibles.push("rutas nacionales")
            if (showCaminosDepartamentales) capasVisibles.push("caminos departamentales")

            console.log(`❌ La línea debe seguir completamente las rutas: ${capasVisibles.join(" o ")}`)
            return
          }

          console.log("✅ Línea válida, actualizando...")

          // Si la línea es válida, actualizar las coordenadas originales
          originalLineCoordinatesRef.current = [...newCoordinates]
          lineFeature.setStyle(editableLineStyle)

          // Update point features to match line coordinates
          const pointFeatures = features.filter((f) => f.getGeometry().getType() === "Point")
          pointFeatures.forEach((pointFeature, index) => {
            if (index < newCoordinates.length) {
              pointFeature.getGeometry().setCoordinates(newCoordinates[index])
              pointFeature.set("originalCoordinate", [...newCoordinates[index]])
            }
          })

          // Dispatch event with updated coordinates
          window.dispatchEvent(
            new CustomEvent("update-line-route", {
              detail: {
                lineId: currentEditingLineIdRef.current,
                coordinates: newCoordinates,
              },
            }),
          )
        }
      })
    }

    const handleEndLineEdit = () => {
      console.log("🏁 Finalizando edición de línea")
      cleanupLineEditMode()
      isEditingLineRouteRef.current = false
      currentEditingLineIdRef.current = null
      originalLineCoordinatesRef.current = []
    }

    const handleAddRoutePoint = (e) => {
      if (!isEditingLineRouteRef.current || !editableLineLayerRef.current) return

      const { coordinate } = e.detail

      // Verificar si hay capas visibles
      if (!showRutasNacionales && !showCaminosDepartamentales) {
        console.log("⚠️ No hay capas visibles, activando automáticamente...")
        setShowRutasNacionales(true)
        setShowCaminosDepartamentales(true)
        return
      }

      // Validar que el punto esté sobre una ruta
      if (!isPointOnCamineria(coordinate)) {
        console.log("❌ No se puede añadir punto: ubicación no está sobre una ruta válida")

        const capasVisibles = []
        if (showRutasNacionales) capasVisibles.push("rutas nacionales")
        if (showCaminosDepartamentales) capasVisibles.push("caminos departamentales")

        console.log(`❌ Los puntos de la línea solo pueden ubicarse sobre: ${capasVisibles.join(" o ")}`)
        return
      }

      const source = editableLineLayerRef.current.getSource()
      const features = source.getFeatures()

      // Find the line feature
      const lineFeature = features.find((f) => f.getGeometry().getType() === "LineString")
      if (!lineFeature) return

      const lineGeometry = lineFeature.getGeometry()
      const coordinates = lineGeometry.getCoordinates()

      // Add new coordinate at the end
      const newCoordinates = [...coordinates, coordinate]

      // Validar la línea completa con el nuevo punto (modo edición)
      const validation = validateLineFollowsRoads(newCoordinates, false)

      if (!validation.isValid) {
        console.log("❌ No se puede añadir punto: la línea resultante no seguiría las rutas")
        return
      }

      // Si es válida, actualizar la línea
      lineGeometry.setCoordinates(newCoordinates)
      originalLineCoordinatesRef.current = [...newCoordinates]

      // Add new point feature
      const newPointFeature = new Feature({
        geometry: new Point(coordinate),
        pointIndex: newCoordinates.length - 1,
        originalCoordinate: [...coordinate],
      })
      newPointFeature.setStyle(editableRoutePointStyle)
      source.addFeature(newPointFeature)

      // Dispatch update event
      window.dispatchEvent(
        new CustomEvent("update-line-route", {
          detail: {
            lineId: currentEditingLineIdRef.current,
            coordinates: newCoordinates,
          },
        }),
      )
    }

    window.addEventListener("start-edit-line-route", handleStartLineEdit)
    window.addEventListener("end-edit-line-route", handleEndLineEdit)
    window.addEventListener("add-line-route-point", handleAddRoutePoint)

    return () => {
      window.removeEventListener("start-edit-line-route", handleStartLineEdit)
      window.removeEventListener("end-edit-line-route", handleEndLineEdit)
      window.removeEventListener("add-line-route-point", handleAddRoutePoint)
      cleanupLineEditMode()
    }
  }, [showRutasNacionales, showCaminosDepartamentales])

  // Form popup management
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
        if (popupOverlayRef.current) popupOverlayRef.current.setPosition(undefined)
        if (popupRootRef.current) {
          popupRootRef.current.unmount()
          popupRootRef.current = null
        }
        if (popupElementRef.current) popupElementRef.current.innerHTML = ""
      }
    }
  }, [popupFormConfig, onStopFormSubmit, onStopFormCancel, onStopFormDelete, onLineFormSubmit, onLineFormCancel])

  // Click to move editable point
  useEffect(() => {
    const handleClickToMove = (evt) => {
      if (!isMovingStopRef.current) return
      if (!editableMarkerRef.current || !editableLayerRef.current || !mapInstanceRef.current) return
      if (evt.originalEvent?.target.closest("#popup-form-container")) return

      const map = mapInstanceRef.current
      let clickedOnFeature = false

      map.forEachFeatureAtPixel(evt.pixel, (feature, layer) => {
        if (layer !== editableLayerRef.current) {
          clickedOnFeature = true
        }
      })

      if (clickedOnFeature) return

      // Verificar si hay al menos una capa de caminería visible
      if (!showRutasNacionales && !showCaminosDepartamentales) {
        console.log("⚠️ Sin capas de referencia - Active al menos una capa de caminería para mover la parada")
        return
      }

      console.log("🖱️ Click para mover parada a:", evt.coordinate)

      // Verificar si el punto está sobre un camino ANTES de mover
      if (!isPointOnCamineria(evt.coordinate)) {
        console.log("❌ Click en ubicación no válida")

        const capasVisibles = []
        if (showRutasNacionales) capasVisibles.push("rutas nacionales")
        if (showCaminosDepartamentales) capasVisibles.push("caminos departamentales")

        console.log(`❌ Las paradas solo pueden ubicarse sobre: ${capasVisibles.join(" o ")}`)
        return // No mover la parada
      }

      console.log("✅ Click en ubicación válida, moviendo parada")

      const newCoord = evt.coordinate
      editableMarkerRef.current.getGeometry().setCoordinates(newCoord)

      // Actualizar también las coordenadas originales
      editableMarkerRef.current.set("originalCoordinates", newCoord)

      window.dispatchEvent(
        new CustomEvent("update-stop-coordinates", {
          detail: {
            lat: newCoord[1].toFixed(2),
            lng: newCoord[0].toFixed(2),
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

  // Refresh map data
  useEffect(() => {
    const handleRefresh = () => {
      if (stopLayerRef.current) {
        stopLayerRef.current.getSource().refresh()
      }
      if (lineLayerRef.current) {
        lineLayerRef.current.getSource().refresh()
      }
      if (camineriaLayerRef.current) {
        camineriaLayerRef.current.getSource().refresh()
      }
    }

    window.addEventListener("refresh-map-data", handleRefresh)
    return () => window.removeEventListener("refresh-map-data", handleRefresh)
  }, [])

  // Validation for line construction
  useEffect(() => {
    const handleValidateLineConstruction = (e) => {
      const { coordinates, isConstructionMode } = e.detail
      console.log(
        "🔍 Recibida solicitud de validación:",
        coordinates.length,
        "puntos, modo construcción:",
        isConstructionMode,
      )

      const validation = validateLineFollowsRoads(coordinates, isConstructionMode)

      console.log("📤 Enviando resultado de validación:", validation.isValid)

      // Enviar resultado INMEDIATAMENTE
      window.dispatchEvent(
        new CustomEvent("line-construction-validation-result", {
          detail: {
            isValid: validation.isValid,
            invalidSegments: validation.invalidSegments,
          },
        }),
      )
    }

    window.addEventListener("validate-line-construction", handleValidateLineConstruction)

    return () => {
      window.removeEventListener("validate-line-construction", handleValidateLineConstruction)
    }
  }, [showRutasNacionales, showCaminosDepartamentales])

  // Función para calcular la ruta más corta entre dos puntos
  const calculateShortestRoute = (startCoord, endCoord) => {
    console.log("🗺️ Calculando ruta más corta entre:", startCoord, "y", endCoord)

    if (!camineriaLayerRef.current || !camineriaLayerRef.current.getSource()) {
      return { success: false, message: "No hay datos de caminería disponibles" }
    }

    const features = camineriaLayerRef.current.getSource().getFeatures()
    if (features.length === 0) {
      return { success: false, message: "No hay rutas cargadas" }
    }

    // Filtrar features visibles
    const visibleFeatures = features.filter((feature) => {
      const isNacional = esRutaNacional(feature)
      return (isNacional && showRutasNacionales) || (!isNacional && showCaminosDepartamentales)
    })

    if (visibleFeatures.length === 0) {
      return { success: false, message: "No hay rutas visibles" }
    }

    try {
      // Construir grafo de rutas
      const graph = buildRoadGraph(visibleFeatures)

      // Encontrar nodos más cercanos a los puntos de inicio y fin
      const startNode = findNearestNode(graph, startCoord)
      const endNode = findNearestNode(graph, endCoord)

      if (!startNode || !endNode) {
        return { success: false, message: "No se pudieron encontrar puntos de conexión en las rutas" }
      }

      // Calcular ruta usando Dijkstra
      const route = dijkstraShortestPath(graph, startNode, endNode)

      if (!route || route.length < 2) {
        return { success: false, message: "No se encontró una ruta válida entre los puntos" }
      }

      console.log("✅ Ruta calculada con", route.length, "puntos")
      return { success: true, route }
    } catch (error) {
      console.error("Error en cálculo de ruta:", error)
      return { success: false, message: "Error interno al calcular la ruta" }
    }
  }

  // Construir grafo de rutas a partir de las features de caminería
  const buildRoadGraph = (features) => {
    const graph = {
      nodes: new window.Map(), // Usar window.Map explícitamente
      edges: [],
    }

    const tolerance = 50 // Tolerancia para conectar segmentos

    features.forEach((feature, featureIndex) => {
      const geometry = feature.getGeometry()
      if (!geometry) return

      let coordinates = []

      // Manejar diferentes tipos de geometría
      if (geometry.getType() === "LineString") {
        coordinates = geometry.getCoordinates()
      } else if (geometry.getType() === "MultiLineString") {
        // Para MultiLineString, tomar todas las coordenadas
        const multiCoords = geometry.getCoordinates()
        coordinates = multiCoords.flat()
      }

      if (coordinates.length < 2) return

      // Crear nodos y aristas para esta feature
      for (let i = 0; i < coordinates.length - 1; i++) {
        const startCoord = coordinates[i]
        const endCoord = coordinates[i + 1]

        const startNodeId = `${startCoord[0].toFixed(1)},${startCoord[1].toFixed(1)}`
        const endNodeId = `${endCoord[0].toFixed(1)},${endCoord[1].toFixed(1)}`

        // Agregar nodos si no existen
        if (!graph.nodes.has(startNodeId)) {
          graph.nodes.set(startNodeId, {
            id: startNodeId,
            coord: startCoord,
            connections: new Set(),
          })
        }

        if (!graph.nodes.has(endNodeId)) {
          graph.nodes.set(endNodeId, {
            id: endNodeId,
            coord: endCoord,
            connections: new Set(),
          })
        }

        // Calcular distancia
        const distance = Math.sqrt(Math.pow(endCoord[0] - startCoord[0], 2) + Math.pow(endCoord[1] - startCoord[1], 2))

        // Agregar conexiones bidireccionales
        graph.nodes.get(startNodeId).connections.add(endNodeId)
        graph.nodes.get(endNodeId).connections.add(startNodeId)

        // Agregar arista
        graph.edges.push({
          from: startNodeId,
          to: endNodeId,
          distance: distance,
          coords: [startCoord, endCoord],
        })
      }
    })

    console.log("🔗 Grafo construido:", graph.nodes.size, "nodos,", graph.edges.length, "aristas")
    return graph
  }

  // Encontrar el nodo más cercano a una coordenada
  const findNearestNode = (graph, targetCoord) => {
    let nearestNode = null
    let minDistance = Number.POSITIVE_INFINITY

    for (const [nodeId, node] of graph.nodes) {
      const distance = Math.sqrt(
        Math.pow(node.coord[0] - targetCoord[0], 2) + Math.pow(node.coord[1] - targetCoord[1], 2),
      )

      if (distance < minDistance) {
        minDistance = distance
        nearestNode = nodeId
      }
    }

    console.log("📍 Nodo más cercano:", nearestNode, "distancia:", minDistance.toFixed(2))
    return nearestNode
  }

  // Algoritmo de Dijkstra para encontrar el camino más corto
  const dijkstraShortestPath = (graph, startNodeId, endNodeId) => {
    const distances = new window.Map()
    const previous = new window.Map()
    const unvisited = new Set()

    // Inicializar distancias
    for (const nodeId of graph.nodes.keys()) {
      distances.set(nodeId, Number.POSITIVE_INFINITY)
      unvisited.add(nodeId)
    }
    distances.set(startNodeId, 0)

    while (unvisited.size > 0) {
      // Encontrar nodo no visitado con menor distancia
      let currentNode = null
      let minDistance = Number.POSITIVE_INFINITY

      for (const nodeId of unvisited) {
        if (distances.get(nodeId) < minDistance) {
          minDistance = distances.get(nodeId)
          currentNode = nodeId
        }
      }

      if (!currentNode || minDistance === Number.POSITIVE_INFINITY) {
        break // No hay más nodos alcanzables
      }

      unvisited.delete(currentNode)

      // Si llegamos al destino, podemos terminar
      if (currentNode === endNodeId) {
        break
      }

      // Examinar vecinos
      const currentNodeData = graph.nodes.get(currentNode)
      if (!currentNodeData || !currentNodeData.connections) {
        continue
      }

      for (const neighborId of currentNodeData.connections) {
        if (!unvisited.has(neighborId)) continue

        // Encontrar la arista entre currentNode y neighbor
        const edge = graph.edges.find(
          (e) => (e.from === currentNode && e.to === neighborId) || (e.from === neighborId && e.to === currentNode),
        )

        if (edge) {
          const altDistance = distances.get(currentNode) + edge.distance

          if (altDistance < distances.get(neighborId)) {
            distances.set(neighborId, altDistance)
            previous.set(neighborId, currentNode)
          }
        }
      }
    }

    // Reconstruir el camino
    const path = []
    let currentNode = endNodeId

    while (currentNode !== undefined) {
      path.unshift(currentNode)
      currentNode = previous.get(currentNode)
    }

    // Si no hay camino al nodo de inicio, no hay ruta
    if (path[0] !== startNodeId) {
      return null
    }

    // Convertir IDs de nodos a coordenadas
    const routeCoordinates = path.map((nodeId) => {
      const node = graph.nodes.get(nodeId)
      return node.coord
    })

    console.log("🛣️ Ruta encontrada:", path.length, "nodos,", routeCoordinates.length, "coordenadas")
    return routeCoordinates
  }

  // Función para calcular la distancia mínima de un punto a una línea
  const calculateDistanceToLine = (point, lineCoordinates) => {
    if (lineCoordinates.length < 2) return Number.POSITIVE_INFINITY

    let minDistance = Number.POSITIVE_INFINITY

    // Verificar distancia a cada segmento de la línea
    for (let i = 0; i < lineCoordinates.length - 1; i++) {
      const segmentStart = lineCoordinates[i]
      const segmentEnd = lineCoordinates[i + 1]

      const distance = distancePointToSegment(point, segmentStart, segmentEnd)
      if (distance < minDistance) {
        minDistance = distance
      }
    }

    return minDistance
  }

  // Función auxiliar para calcular distancia de punto a segmento
  const distancePointToSegment = (point, segmentStart, segmentEnd) => {
    const [px, py] = point
    const [x1, y1] = segmentStart
    const [x2, y2] = segmentEnd

    const A = px - x1
    const B = py - y1
    const C = x2 - x1
    const D = y2 - y1

    const dot = A * C + B * D
    const lenSq = C * C + D * D

    if (lenSq === 0) {
      // El segmento es un punto
      return Math.sqrt(A * A + B * B)
    }

    const param = dot / lenSq

    let xx, yy

    if (param < 0) {
      xx = x1
      yy = y1
    } else if (param > 1) {
      xx = x2
      yy = y2
    } else {
      xx = x1 + param * C
      yy = y1 + param * D
    }

    const dx = px - xx
    const dy = py - yy
    return Math.sqrt(dx * dx + dy * dy)
  }

  // Escuchar eventos de cálculo de ruta
  useEffect(() => {
    const handleCalculateRoute = (event) => {
      const { startCoord, endCoord } = event.detail

      console.log("🎯 Calculando ruta desde:", startCoord, "hasta:", endCoord)

      const result = calculateShortestRoute(startCoord, endCoord)

      // Enviar resultado
      window.dispatchEvent(
        new CustomEvent("route-calculation-result", {
          detail: result,
        }),
      )
    }

    window.addEventListener("calculate-shortest-route", handleCalculateRoute)

    return () => {
      window.removeEventListener("calculate-shortest-route", handleCalculateRoute)
    }
  }, [showRutasNacionales, showCaminosDepartamentales])

  return (
    <div className="w-full h-full relative">
      <div id="map" ref={mapRef} className="w-full h-full" />

      {/* Control de capas simplificado */}
      <LayerControl
        showRutasNacionales={showRutasNacionales}
        showCaminosDepartamentales={showCaminosDepartamentales}
        onToggleRutas={() => setShowRutasNacionales(!showRutasNacionales)}
        onToggleCaminos={() => setShowCaminosDepartamentales(!showCaminosDepartamentales)}
      />

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
