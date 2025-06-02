
import { useEffect, useRef } from "react"
import { createRoot } from "react-dom/client" // For React 18+
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
import { get as getProjection, transform } from "ol/proj"
import Overlay from "ol/Overlay"
import {StopForm,LineForm} from "@/components" // Import the form component


// Placeholder for a temporary marker icon (e.g., a simple blue dot)
const temporaryMarkerStyle = new Style({
  image: new CircleStyle({
    radius: 7,
    fill: new Fill({ color: "rgba(0, 0, 255, 0.5)" }),
    stroke: new Stroke({ color: "blue", width: 1 }),
  }),
  stroke: new Stroke({
    // For LineStrings
    color: "rgba(0, 0, 255, 0.5)",
    width: 3,
  }),
})

const selectedForLineStyle = new Style({
  // Style for points selected for a new line
  image: new CircleStyle({
    radius: 8,
    fill: new Fill({ color: "rgba(0,255,0,0.7)" }),
    stroke: new Stroke({ color: "green", width: 2 }),
  }),
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
  temporaryFeatures = [], // Receive temporary features from dashboard
}) {
  const mapRef = useRef(null)
  const mapInstanceRef = useRef(null)
  const popupElementRef = useRef(null) // Renamed from popupRef for clarity
  const popupOverlayRef = useRef(null)
  const popupRootRef = useRef(null) // To store the React root for the popup content
  const temporaryLayerRef = useRef(null) // Layer for temporary features

  const stopLayerRef = useRef(null) // To access stop layer for identifying features
  const lineLayerRef = useRef(null) // To access line layer
  useEffect(() => {
    // Initialize map
    if (!mapRef.current || mapInstanceRef.current) return

    proj4.defs("EPSG:32721", "+proj=utm +zone=21 +south +datum=WGS84 +units=m +no_defs")
    register(proj4)
    const utmProjection = getProjection("EPSG:32721")
    if (!utmProjection) {
      console.error("EPSG:32721 projection not registered.")
      return
    }

    const montevideoLonLat = [-56.164532, -34.901112]
    const centerUtm = transform(montevideoLonLat, "EPSG:4326", utmProjection)

    const lineSource = new VectorSource({
      format: new GeoJSON(),
      url: (extent) =>
        `/geoserver/tsig2025/ows?service=WFS&version=1.1.0&request=GetFeature&typename=tsig2025:linea&outputFormat=application/json&srsname=EPSG:32721&bbox=${extent.join(
          ",",
        )},EPSG:32721`,
      strategy: bboxStrategy,
    })

    const stopSource = new VectorSource({
      format: new GeoJSON(),
      url: (extent) =>
        `/geoserver/tsig2025/ows?service=WFS&version=1.1.0&request=GetFeature&typename=tsig2025:parada&outputFormat=application/json&srsname=EPSG:32721&bbox=${extent.join(
          ",",
        )},EPSG:32721`,
      strategy: bboxStrategy,
    })
  

    const lineLayer = new VectorLayer({
      source: lineSource,
      style: new Style({
        stroke: new Stroke({ color: "rgba(0, 180, 180, 0.8)", width: 3 }),
      }),
    })
    lineLayerRef.current = lineLayer

    const stopLayer = new VectorLayer({
      source: stopSource,
      style: new Style({
        image: new CircleStyle({
          radius: 6,
          fill: new Fill({ color: "rgba(255, 0, 0, 0.7)" }),
          stroke: new Stroke({ color: "white", width: 1.5 }),
        }),
      }),
    })

    stopLayerRef.current = stopLayer

    // Temporary layer for visual feedback (e.g., new stop marker)
    temporaryLayerRef.current = new VectorLayer({
      source: new VectorSource(),
      style: temporaryMarkerStyle,
    })

    if (popupElementRef.current) {
      popupOverlayRef.current = new Overlay({
        element: popupElementRef.current,
        autoPan: { animation: { duration: 250 } },
        stopEvent: false, // Allow events to propagate from the popup (important for React forms)
      })
    }

    const map = new Map({
      target: mapRef.current,
      layers: [new TileLayer({ source: new OSM() }), lineLayer, stopLayer, temporaryLayerRef.current],
      view: new View({
        projection: utmProjection,
        center: centerUtm,
        zoom: 10,
      }),
      overlays: popupOverlayRef.current ? [popupOverlayRef.current] : [],
    })
    mapInstanceRef.current = map

    // Cleanup
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
  }, []) // Initialize map only once

  // Handle map clicks
  useEffect(() => {
    if (!mapInstanceRef.current || !onMapInteractionRequest) return

    const map = mapInstanceRef.current
    const clickHandler = (evt) => {
      if (popupOverlayRef.current && !popupFormConfig?.isVisible) {
        // Hide info popup if form is not meant to be visible
        popupOverlayRef.current.setPosition(undefined)
        if (popupRootRef.current) {
          popupRootRef.current.unmount() // Clear previous React content
          popupRootRef.current = null
        }
      }

      if (isAdmin) {
        const feature = map.forEachFeatureAtPixel(evt.pixel, (f, layer) => {
          // Ignore clicks on the temporary layer if we are trying to edit existing features
          if ((activeTool === "edit-stop" || activeTool === "edit-line") && layer === temporaryLayerRef.current) {
            return null
          }
          return f
        })

        const clickedLayer = map.forEachLayerAtPixel(evt.pixel, (l) => l)

        if (activeTool === "add-stop") {
          onMapInteractionRequest({ type: "MAP_CLICK_FOR_ADD", payload: { coordinates: evt.coordinate } })
        } else if (activeTool === "add-line" && feature && clickedLayer === stopLayerRef.current) {
          // Clicked on a stop feature while 'add-line' is active
          onMapInteractionRequest({
            type: "STOP_CLICK_FOR_LINE",
            payload: { featureData: feature.getProperties(), coordinates: feature.getGeometry().getCoordinates() },
          })
        } else if (activeTool === "edit-stop" && feature) {
          // Ensure we are not clicking a temporary feature if any
          const layer = map.forEachLayerAtPixel(evt.pixel, (l) => l)
          if (layer !== temporaryLayerRef.current) {
            onMapInteractionRequest({
              type: "FEATURE_CLICK_FOR_EDIT",
              payload: { featureData: feature.getProperties(), coordinates: evt.coordinate },
            })
          }
        } else if (activeTool === "edit-line" && feature && clickedLayer === lineLayerRef.current) {
          onMapInteractionRequest({
            type: "LINE_CLICK_FOR_EDIT",
            payload: { featureData: feature.getProperties(), coordinates: evt.coordinate }, // or feature.getGeometry().getClosestPoint(evt.coordinate)
          })
        } else if (activeTool === "add-line" && !feature) {
          // Clicked on map but not on a stop, maybe show a message or do nothing
        } else if (!activeTool && feature) {
          // Default admin click on feature (could show simple info or quick edit)
          console.log("Admin clicked on feature (no active tool):", feature.getProperties())
          // Potentially show a simpler info popup or context menu for admins
        }
      } else if (!isAdmin) {
        // Public user click
        const feature = map.forEachFeatureAtPixel(evt.pixel, (f) => f)
        if (feature && popupElementRef.current && popupOverlayRef.current) {
          // Unmount any existing React root before rendering simple HTML
          if (popupRootRef.current) {
            popupRootRef.current.unmount()
            popupRootRef.current = null
          }
          const props = feature.getProperties()
          let content =
            '<h4 class="text-base font-semibold mb-1">Detalles</h4><hr class="my-1 border-gray-300 dark:border-gray-600"/><dl class="text-xs">'
          for (const key in props) {
            if (key !== "geometry" && Object.prototype.hasOwnProperty.call(props, key)) {
              content += `<dt class="font-medium text-gray-600 dark:text-gray-400">${key}</dt><dd class="ml-2 mb-1 text-gray-800 dark:text-gray-200">${JSON.stringify(
                props[key],
              )}</dd>`
            }
          }
          content += `</dl><button id="popup-closer-btn" class="ol-popup-closer absolute top-2 right-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">&times;</button>`
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
  }, [isAdmin, activeTool, onMapInteractionRequest, popupFormConfig?.isVisible])

  // Effect to render/update temporary features on the map
  useEffect(() => {
    if (temporaryLayerRef.current) {
      const source = temporaryLayerRef.current.getSource()
      source.clear() // Clear previous temporary features
      if (temporaryFeatures && temporaryFeatures.length > 0) {
        const olFeatures = temporaryFeatures
          .map((featureData) => {
            if (featureData.type === "Point" && featureData.coordinates) {
              return new Feature({
                geometry: new Point(featureData.coordinates),
                // Add any other properties if needed
              })
            } else if (featureData.type === "LineString" && featureData.coordinates) {
              return new Feature({
                geometry: new LineString(featureData.coordinates),
              })
            }
            return null
          })
          .filter(Boolean)
        // Apply specific style for points selected for a line
        olFeatures.forEach((f) => {
          if (
            f.getGeometry().getType() === "Point" &&
            temporaryFeatures.find(
              (tf) => tf.style === "selectedForLine" && tf.coordinates === f.getGeometry().getCoordinates(),
            )
          ) {
            f.setStyle(selectedForLineStyle)
          }
        })
        source.addFeatures(olFeatures)
      }
    }
  }, [temporaryFeatures])

  // Effect to manage the React form popup
  useEffect(() => {
    if (popupElementRef.current && popupOverlayRef.current && popupFormConfig) {
      if (popupFormConfig.isVisible && popupFormConfig.mode && popupFormConfig.coordinates) {
        if (!popupRootRef.current) {
          popupRootRef.current = createRoot(popupElementRef.current)
        }
        if (popupFormConfig.mode === "add" || popupFormConfig.mode === "edit") {
          popupRootRef.current.render(
            <StopForm
              key={popupFormConfig.key} // Force re-mount with new key for fresh state
              mode={popupFormConfig.mode}
              initialData={popupFormConfig.initialData}
              onSubmit={onStopFormSubmit}
              onCancel={onStopFormCancel}
              onDelete={onStopFormDelete}
            />,
          )
        } else if (popupFormConfig.mode === "add-line" || popupFormConfig.mode === "edit-line") {
          popupRootRef.current.render(
            <LineForm
              key={popupFormConfig.key}
              mode={popupFormConfig.mode} // 'add-line' or 'edit-line'
              initialData={popupFormConfig.initialData}
              onSubmit={onLineFormSubmit}
              onCancel={onLineFormCancel}
              // onDelete for lines if needed
            />,
          )
        }

        popupOverlayRef.current.setPosition(popupFormConfig.coordinates)
      } else {
        if (popupOverlayRef.current) {
          // Check if it exists before trying to set position
          popupOverlayRef.current.setPosition(undefined) // Hide OpenLayers overlay
        }
        if (popupRootRef.current) {
          // Check if it exists
          popupRootRef.current.unmount() // Unmount React component
          popupRootRef.current = null
        }
        if (popupElementRef.current) popupElementRef.current.innerHTML = "" // Clear any residual HTML
      }
    }
  }, [popupFormConfig, onStopFormSubmit, onStopFormCancel, onStopFormDelete, onLineFormSubmit, onLineFormCancel])

  return (
    <div className="w-full h-full relative">
      <div id="map" ref={mapRef} className="w-full h-full" />
      <div
        id="popup-form-container" // Changed ID for clarity
        ref={popupElementRef}
        className="ol-popup bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 p-1 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 min-w-[320px]" // Adjusted padding and min-width
      >
        {/* React StopForm will be rendered here by the effect */}
      </div>
    </div>
  )
}
