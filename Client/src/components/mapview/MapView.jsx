"use client"

import { useEffect, useRef, useState, useCallback } from "react"
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
import { StopForm, LineForm } from "@/components"
import DraggableModal from "@/components/ui/DraggableModal"
import { get as getProjection, transform } from "ol/proj"
import { Modify } from "ol/interaction"
import { EyeIcon, EyeOffIcon, MapIcon } from "lucide-react"
import { getUniqueAttributes } from "@/utils/layerUtils"



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

// Estilos para las nuevas capas - definidos fuera del componente
const limitesDepartamentalesStyle = new Style({
  stroke: new Stroke({
    color: "rgba(255, 0, 0, 0.8)", // Rojo para límites departamentales
    width: 2,
  }),
  fill: new Fill({
    color: "rgba(255, 0, 0, 0.1)", // Relleno transparente
  }),
})

const localidadesCensalesStyle = new Style({
  stroke: new Stroke({
    color: "rgba(0, 255, 0, 0.8)", // Verde para localidades censales
    width: 1,
  }),
  fill: new Fill({
    color: "rgba(0, 255, 0, 0.1)", // Relleno transparente
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
const LayerControl = ({
  showRutasNacionales,
  showCaminosDepartamentales,
  showLines,
  showLimitesDepartamentales,
  showMojones,
  showLocalidadesCensales,
  onToggleRutas,
  onToggleCaminos,
  onToggleLines,
  onToggleLimites,
  onToggleLocalidades,
  onToggleMojones,
}) => {
  return (
    <div className="absolute top-4 right-4 bg-white rounded-lg shadow-lg border border-gray-200 p-3 z-10 min-w-[200px]">
      <div className="flex items-center mb-2">
        <MapIcon className="h-4 w-4 mr-2 text-gray-600" />
        <h3 className="text-sm font-medium text-gray-800">Control de Capas</h3>
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

        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="w-4 h-1 bg-cyan-600 mr-2 rounded"></div>
            <span className="text-xs text-gray-700">Líneas de Ómnibus</span>
          </div>
          <button
            onClick={onToggleLines}
            className={`p-1 rounded ${showLines ? "text-blue-600" : "text-gray-400"}`}
            title={showLines ? "Ocultar líneas" : "Mostrar líneas"}
          >
            {showLines ? <EyeIcon className="h-4 w-4" /> : <EyeOffIcon className="h-4 w-4" />}
          </button>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="w-4 h-1 bg-red-600 mr-2 rounded"></div>
            <span className="text-xs text-gray-700">Departamentos</span>
          </div>
          <button
            onClick={onToggleLimites}
            className={`p-1 rounded ${showLimitesDepartamentales ? "text-blue-600" : "text-gray-400"}`}
            title={showLimitesDepartamentales ? "Ocultar límites" : "Mostrar límites"}
          >
            {showLimitesDepartamentales ? <EyeIcon className="h-4 w-4" /> : <EyeOffIcon className="h-4 w-4" />}
          </button>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="w-4 h-1 bg-green-600 mr-2 rounded"></div>
            <span className="text-xs text-gray-700">Localidades</span>
          </div>
          <button
            onClick={onToggleLocalidades}
            className={`p-1 rounded ${showLocalidadesCensales ? "text-blue-600" : "text-gray-400"}`}
            title={showLocalidadesCensales ? "Ocultar localidades" : "Mostrar localidades"}
          >
            {showLocalidadesCensales ? <EyeIcon className="h-4 w-4" /> : <EyeOffIcon className="h-4 w-4" />}
          </button>

        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <div className="w-4 h-1 bg-black mr-2 rounded"></div>
            <span className="text-xs text-gray-700">Postes de Kilometros</span>
          </div>
          <button
            onClick={onToggleMojones}
            className={`p-1 rounded ${showMojones ? "text-blue-600" : "text-gray-400"}`}
            title={showMojones ? "Ocultar postes" : "Mostrar postes"}
          >
            {showMojones ? <EyeIcon className="h-4 w-4" /> : <EyeOffIcon className="h-4 w-4" />}
          </button>
        </div>
      </div>

      <div className="mt-3 pt-2 border-t border-gray-200">
        <p className="text-xs text-gray-500">
          {showRutasNacionales || showCaminosDepartamentales
            ? "Las líneas deben seguir completamente las rutas visibles"
            : "Active al menos una capa de caminería para crear paradas y líneas"}
        </p>
      </div>
    </div>
  )
}

// Componente separado para el indicador de progreso
const RouteProgressIndicator = ({ isVisible, progress, message }) => {
  if (!isVisible) return null

  return (
    <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-lg border border-gray-200 p-3 z-10 max-w-xs">
      <div className="flex items-center space-x-2">
        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
        <div className="flex-1">
          <div className="text-xs font-medium text-gray-700 mb-1">{message || "Calculando ruta..."}</div>
          <div className="w-full bg-gray-200 rounded-full h-1.5">
            <div
              className="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
              style={{ width: `${Math.max(0, Math.min(100, progress || 0))}%` }}
            />
          </div>
          <div className="text-xs text-gray-500 mt-1">{Math.round(progress || 0)}%</div>
        </div>
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
  const temporaryLayerRef = useRef(null)
  const stopLayerRef = useRef(null)
  const lineLayerRef = useRef(null)
  const camineriaLayerRef = useRef(null)
  const limitesDepartamentalesLayerRef = useRef(null)
  const localidadesCensalesLayerRef = useRef(null)
  const mojonesLayerRef = useRef(null)

  const editableLineLayerRef = useRef(null)
  const lineModifyInteractionRef = useRef(null)
  const isEditingLineRouteRef = useRef(false)
  const currentEditingLineIdRef = useRef(null)
  const originalLineCoordinatesRef = useRef([])

  const isLinkingStopsRef = useRef(false)
  const currentLinkingLineIdRef = useRef(null)
  const currentLinkingRouteRef = useRef([])


  // Estados para controlar la visibilidad de las capas
  const [showLines, setShowLines] = useState(true)
  const [showLimitesDepartamentales, setShowLimitesDepartamentales] = useState(false)
  const [showLocalidadesCensales, setShowLocalidadesCensales] = useState(false)
  const [showMojones, setShowMojones] = useState(false)

  // Ref para el worker
  const routeWorkerRef = useRef(null)

  // Estados para controlar la visibilidad de las capas
  const [showRutasNacionales, setShowRutasNacionales] = useState(false)
  const [showCaminosDepartamentales, setShowCaminosDepartamentales] = useState(false)

  // Estado para almacenar los puntos actuales de la línea en construcción
  const [currentLinePoints, setCurrentLinePoints] = useState([])

  // Estados simplificados para el progreso
  const [routeCalculation, setRouteCalculation] = useState({
    isCalculating: false,
    progress: 0,
    message: "",
  })

  // Función para calcular ruta con algoritmo de grafos real
  const calculateRouteWithGraph = useCallback(
    async (startCoord, endCoord) => {
      console.log("🗺️ Iniciando cálculo de ruta con algoritmo de grafos")

      setRouteCalculation({
        isCalculating: true,
        progress: 10,
        message: "Preparando datos de caminería...",
      })

      try {
        if (!camineriaLayerRef.current || !camineriaLayerRef.current.getSource()) {
          throw new Error("No hay datos de caminería disponibles")
        }

        const features = camineriaLayerRef.current.getSource().getFeatures()
        if (features.length === 0) {
          throw new Error("No hay rutas cargadas")
        }

        // Filtrar features visibles
        const visibleFeatures = features.filter((feature) => {
          const isNacional = esRutaNacional(feature)
          return (isNacional && showRutasNacionales) || (!isNacional && showCaminosDepartamentales)
        })

        if (visibleFeatures.length === 0) {
          throw new Error("No hay rutas visibles")
        }

        console.log(`📊 Procesando ${visibleFeatures.length} features de caminería`)

        setRouteCalculation((prev) => ({
          ...prev,
          progress: 20,
          message: "Construyendo grafo de rutas...",
        }))

        // Preparar datos para el worker
        const featuresData = visibleFeatures.map((feature) => {
          const geometry = feature.getGeometry()
          const properties = feature.getProperties()

          // Crear objeto limpio solo con datos serializables
          const cleanProperties = {}
          for (const [key, value] of Object.entries(properties)) {
            if (
              typeof value === "string" ||
              typeof value === "number" ||
              typeof value === "boolean" ||
              value === null ||
              value === undefined
            ) {
              cleanProperties[key] = value
            }
          }

          return {
            geometry: {
              type: geometry.getType(),
              coordinates: geometry.getCoordinates(),
            },
            properties: cleanProperties,
          }
        })

        // Crear worker inline si no existe
        if (!routeWorkerRef.current) {
          const workerCode = `
           console.log("🔧 Route Calculator Worker iniciado")

           // Función para construir el grafo de rutas
           function buildRoadGraph(features) {
             const graph = {
               nodes: new Map(),
               edges: [],
             }

             console.log("🏗️ Construyendo grafo con", features.length, "features")

             let totalSegments = 0

             features.forEach((feature, featureIndex) => {
               const geometry = feature.geometry
               if (!geometry) return

               let coordinates = []

               // Manejar diferentes tipos de geometría
               if (geometry.type === "LineString") {
                 coordinates = geometry.coordinates
               } else if (geometry.type === "MultiLineString") {
                 coordinates = geometry.coordinates.flat()
               }

               if (coordinates.length < 2) return

               // Crear nodos y aristas para esta feature
               for (let i = 0; i < coordinates.length - 1; i++) {
                 const startCoord = coordinates[i]
                 const endCoord = coordinates[i + 1]

                 // Usar precisión de 0.1 metros para agrupar nodos cercanos
                 const startNodeId = \`\${Math.round(startCoord[0] * 10) / 10},\${Math.round(startCoord[1] * 10) / 10}\`
                 const endNodeId = \`\${Math.round(endCoord[0] * 10) / 10},\${Math.round(endCoord[1] * 10) / 10}\`

                 // Agregar nodos si no existen
                 if (!graph.nodes.has(startNodeId)) {
                   graph.nodes.set(startNodeId, {
                     id: startNodeId,
                     coord: [Math.round(startCoord[0] * 10) / 10, Math.round(startCoord[1] * 10) / 10],
                     connections: new Set(),
                   })
                 }

                 if (!graph.nodes.has(endNodeId)) {
                   graph.nodes.set(endNodeId, {
                     id: endNodeId,
                     coord: [Math.round(endCoord[0] * 10) / 10, Math.round(endCoord[1] * 10) / 10],
                     connections: new Set(),
                   })
                 }

                 // Calcular distancia euclidiana
                 const distance = Math.sqrt(
                   Math.pow(endCoord[0] - startCoord[0], 2) + Math.pow(endCoord[1] - startCoord[1], 2)
                 )

                 // Agregar conexiones bidireccionales
                 graph.nodes.get(startNodeId).connections.add(endNodeId)
                 graph.nodes.get(endNodeId).connections.add(startNodeId)

                 // Agregar arista (solo una vez por par de nodos)
                 const edgeExists = graph.edges.some(
                   (edge) =>
                     (edge.from === startNodeId && edge.to === endNodeId) ||
                     (edge.from === endNodeId && edge.to === startNodeId)
                 )

                 if (!edgeExists) {
                   graph.edges.push({
                     from: startNodeId,
                     to: endNodeId,
                     distance: distance,
                     coords: [startCoord, endCoord],
                   })
                 }

                 totalSegments++
               }

               // Reportar progreso cada 10 features
               if (featureIndex % 10 === 0) {
                 const progress = 20 + (featureIndex / features.length) * 20
                 self.postMessage({
                   type: "progress",
                   progress: Math.round(progress),
                   message: \`Procesando feature \${featureIndex + 1}/\${features.length}...\`,
                 })
               }
             })

             console.log("🔗 Grafo construido:")
             console.log("  - Nodos:", graph.nodes.size)
             console.log("  - Aristas:", graph.edges.length)
             console.log("  - Segmentos procesados:", totalSegments)

             return graph
           }

           // Encontrar el nodo más cercano a una coordenada
           function findNearestNode(graph, targetCoord) {
             let nearestNode = null
             let minDistance = Number.POSITIVE_INFINITY

             for (const [nodeId, node] of graph.nodes) {
               const distance = Math.sqrt(
                 Math.pow(node.coord[0] - targetCoord[0], 2) + Math.pow(node.coord[1] - targetCoord[1], 2)
               )

               if (distance < minDistance) {
                 minDistance = distance
                 nearestNode = nodeId
               }
             }

             console.log("📍 Nodo más cercano encontrado:")
             console.log("  - ID:", nearestNode)
             console.log("  - Distancia:", minDistance.toFixed(2), "metros")
             
             return nearestNode
           }

           // Algoritmo de Dijkstra optimizado
           function dijkstraShortestPath(graph, startNodeId, endNodeId) {
             console.log("🚀 Iniciando algoritmo de Dijkstra")
             console.log("  - Nodo inicio:", startNodeId)
             console.log("  - Nodo destino:", endNodeId)

             const distances = new Map()
             const previous = new Map()
             const unvisited = new Set()

             // Inicializar distancias
             for (const nodeId of graph.nodes.keys()) {
               distances.set(nodeId, Number.POSITIVE_INFINITY)
               unvisited.add(nodeId)
             }
             distances.set(startNodeId, 0)

             let processedNodes = 0
             const totalNodes = unvisited.size

             console.log("📊 Nodos a procesar:", totalNodes)

             while (unvisited.size > 0) {
               // Reportar progreso cada 50 nodos procesados
               if (processedNodes % 50 === 0) {
                 const progress = 40 + ((totalNodes - unvisited.size) / totalNodes) * 50
                 self.postMessage({
                   type: "progress",
                   progress: Math.round(progress),
                   message: \`Calculando ruta... \${Math.round(((totalNodes - unvisited.size) / totalNodes) * 100)}%\`,
                 })
               }

               // Encontrar nodo no visitado con menor distancia
               let currentNode = null
               let minDistance = Number.POSITIVE_INFINITY

               for (const nodeId of unvisited) {
                 const dist = distances.get(nodeId)
                 if (dist < minDistance) {
                   minDistance = dist
                   currentNode = nodeId
                 }
               }

               if (!currentNode || minDistance === Number.POSITIVE_INFINITY) {
                 console.log("❌ No hay más nodos alcanzables")
                 break
               }

               unvisited.delete(currentNode)
               processedNodes++

               // Si llegamos al destino, podemos terminar
               if (currentNode === endNodeId) {
                 console.log("🎯 Destino alcanzado en", processedNodes, "iteraciones")
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
                   (e) => 
                     (e.from === currentNode && e.to === neighborId) || 
                     (e.from === neighborId && e.to === currentNode)
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

             // Verificar si encontramos un camino válido
             if (path.length === 0 || path[0] !== startNodeId) {
               console.log("❌ No se encontró camino al destino")
               return null
             }

             // Convertir IDs de nodos a coordenadas
             const routeCoordinates = path.map((nodeId) => {
               const node = graph.nodes.get(nodeId)
               return node.coord
             })

             const totalDistance = distances.get(endNodeId)

             console.log("✅ Ruta encontrada:")
             console.log("  - Nodos en el camino:", path.length)
             console.log("  - Coordenadas:", routeCoordinates.length)
             console.log("  - Distancia total:", totalDistance.toFixed(2), "metros")

             return {
               coordinates: routeCoordinates,
               distance: totalDistance,
               nodeCount: path.length
             }
           }

           // Función principal de cálculo de ruta
           function calculateShortestRoute(startCoord, endCoord, features) {
             try {
               console.log("🗺️ Iniciando cálculo de ruta en worker")
               console.log("  - Punto inicio:", startCoord)
               console.log("  - Punto destino:", endCoord)
               console.log("  - Features disponibles:", features.length)

               self.postMessage({
                 type: "progress",
                 progress: 10,
                 message: "Construyendo grafo de rutas...",
               })

               // Construir grafo de rutas
               const graph = buildRoadGraph(features)

               if (graph.nodes.size === 0) {
                 return { success: false, message: "No se pudieron procesar las rutas" }
               }

               self.postMessage({
                 type: "progress",
                 progress: 40,
                 message: "Encontrando puntos de conexión...",
               })

               // Encontrar nodos más cercanos a los puntos de inicio y fin
               const startNode = findNearestNode(graph, startCoord)
               const endNode = findNearestNode(graph, endCoord)

               if (!startNode || !endNode) {
                 return { 
                   success: false, 
                   message: "No se pudieron encontrar puntos de conexión en las rutas" 
                 }
               }

               if (startNode === endNode) {
                 return { 
                   success: false, 
                   message: "Los puntos de inicio y fin están en el mismo nodo de la red" 
                 }
               }

               self.postMessage({
                 type: "progress",
                 progress: 45,
                 message: "Calculando ruta más corta...",
               })

               // Calcular ruta usando Dijkstra
               const routeResult = dijkstraShortestPath(graph, startNode, endNode)

               if (!routeResult || !routeResult.coordinates || routeResult.coordinates.length < 2) {
                 return { 
                   success: false, 
                   message: "No se encontró una ruta válida entre los puntos" 
                 }
               }

               self.postMessage({
                 type: "progress",
                 progress: 100,
                 message: "Ruta calculada exitosamente",
               })

               console.log("✅ Cálculo completado exitosamente")
               
               return { 
                 success: true, 
                 route: routeResult.coordinates,
                 distance: routeResult.distance,
                 nodeCount: routeResult.nodeCount
               }
             } catch (error) {
               console.error("❌ Error en cálculo de ruta:", error)
               return { 
                 success: false, 
                 message: \`Error interno: \${error.message}\` 
               }
             }
           }

           // Escuchar mensajes del hilo principal
           self.onmessage = (e) => {
             const { type, data } = e.data

             console.log("📨 Worker recibió mensaje:", type)

             if (type === "CALCULATE_ROUTE") {
               const { startCoord, endCoord, features } = data

               // Ejecutar cálculo
               const result = calculateShortestRoute(startCoord, endCoord, features)

               // Enviar resultado de vuelta
               self.postMessage({
                 type: "result",
                 data: result,
               })
             }
           }

           console.log("✅ Route Calculator Worker listo para recibir tareas")
         `

          // Crear blob y worker
          const blob = new Blob([workerCode], { type: "application/javascript" })
          const workerUrl = URL.createObjectURL(blob)
          routeWorkerRef.current = new Worker(workerUrl)

          // Manejar mensajes del worker
          routeWorkerRef.current.onmessage = (e) => {
            const { type, data, progress, message } = e.data

            if (type === "progress") {
              setRouteCalculation((prev) => ({
                ...prev,
                progress: progress || 0,
                message: message || "Calculando...",
              }))
            } else if (type === "result") {
              setRouteCalculation({
                isCalculating: false,
                progress: 0,
                message: "",
              })

              // Enviar resultado
              window.dispatchEvent(
                new CustomEvent("route-calculation-result", {
                  detail: data,
                }),
              )
            }
          }

          // Manejar errores del worker
          routeWorkerRef.current.onerror = (error) => {
            console.error("❌ Error en worker:", error)
            setRouteCalculation({
              isCalculating: false,
              progress: 0,
              message: "",
            })

            window.dispatchEvent(
              new CustomEvent("route-calculation-result", {
                detail: {
                  success: false,
                  message: "Error interno en el cálculo de ruta",
                },
              }),
            )
          }

          // Limpiar URL del blob cuando termine
          routeWorkerRef.current.addEventListener("message", function cleanup(e) {
            if (e.data.type === "result") {
              URL.revokeObjectURL(workerUrl)
              routeWorkerRef.current.removeEventListener("message", cleanup)
            }
          })
        }

        setRouteCalculation((prev) => ({
          ...prev,
          progress: 15,
          message: "Enviando datos al worker...",
        }))

        // Enviar datos al worker
        routeWorkerRef.current.postMessage({
          type: "CALCULATE_ROUTE",
          data: {
            startCoord,
            endCoord,
            features: featuresData,
          },
        })
      } catch (error) {
        console.error("❌ Error preparando cálculo de ruta:", error)

        setRouteCalculation({
          isCalculating: false,
          progress: 0,
          message: "",
        })

        window.dispatchEvent(
          new CustomEvent("route-calculation-result", {
            detail: {
              success: false,
              message: error.message || "Error preparando el cálculo de ruta",
            },
          }),
        )
      }
    },
    [showRutasNacionales, showCaminosDepartamentales],
  )

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

    // Capa de límites departamentales (debe ir primero - abajo del todo)
    const limitesDepartamentalesSource = new VectorSource({
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
          typename: "tsig2025:limites_departamentales_igm_20220211",
          outputFormat: "application/json",
          srsname: "EPSG:4326",
          bbox: `${wgs84Extent.join(",")},EPSG:4326`,
        })
        return `${baseUrl}?${params.toString()}`
      },
      strategy: bboxStrategy,
    })

    limitesDepartamentalesLayerRef.current = new VectorLayer({
      source: limitesDepartamentalesSource,
      style: (feature) => {
        return showLimitesDepartamentales ? limitesDepartamentalesStyle : null
      },
      zIndex: 1, // Abajo del todo
    })

    limitesDepartamentalesSource.on("featuresloadend", (event) => {
      console.log("✅ Límites departamentales cargados:", event.features.length, "features")
    })

    // Capa de localidades censales (encima de límites departamentales)
    const localidadesCensalesSource = new VectorSource({
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
          typename: "tsig2025:localidades_censales_ine",
          outputFormat: "application/json",
          srsname: "EPSG:4326",
          bbox: `${wgs84Extent.join(",")},EPSG:4326`,
        })
        return `${baseUrl}?${params.toString()}`
      },
      strategy: bboxStrategy,
    })

    localidadesCensalesLayerRef.current = new VectorLayer({
      source: localidadesCensalesSource,
      style: (feature) => {
        return showLocalidadesCensales ? localidadesCensalesStyle : null
      },
      zIndex: 2, // Encima de límites departamentales
    })

    localidadesCensalesSource.on("featuresloadend", (event) => {
      console.log("✅ Localidades censales cargadas:", event.features.length, "features")
    })

      //Capa de mojones
      const mojonesSource = new VectorSource({
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
            typename: "tsig2025:mojones_sd",
            outputFormat: "application/json",
            srsname: "EPSG:4326",
            bbox: `${wgs84Extent.join(",")},EPSG:4326`,
          })
          return `${baseUrl}?${params.toString()}`
        },
        strategy: bboxStrategy,
      })

      mojonesLayerRef.current = new VectorLayer({
        source: mojonesSource,
        style: (feature) => {
          return showMojones
            ? new Style({
                image: new CircleStyle({
                  radius: 4,
                  fill: new Fill({ color: "rgba(0,0,0,0.7)" }),
                  stroke: new Stroke({ color: "#fff", width: 1 }),
                }),
              })
            : null
        },
        zIndex: 5,
      })

    // Capa de caminería
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

    camineriaLayerRef.current = new VectorLayer({
      source: camineriaSource,
      style: (feature) => {
        const isNacional = esRutaNacional(feature)

        if (isNacional && !showRutasNacionales) {
          return null
        }
        if (!isNacional && !showCaminosDepartamentales) {
          return null
        }

        return isNacional ? rutaNacionalStyle : caminoDepartamentalStyle
      },
      zIndex: 3, // Encima de localidades
    })

    camineriaSource.on("featuresloadend", (event) => {
      console.log("✅ Caminería cargada:", event.features.length, "features")
    })

    // Capa de líneas
    const lineSource = new VectorSource({
      format: new GeoJSON(),
      url: (extent) =>
        `/geoserver/tsig2025/ows?service=WFS&version=1.1.0&request=GetFeature&typename=tsig2025:linea&outputFormat=application/json&srsname=EPSG:32721&bbox=${extent.join(",")},EPSG:32721`,
      strategy: bboxStrategy,
    })
    lineLayerRef.current = new VectorLayer({
      source: lineSource,
      style: (feature) => {
        if (!visibleLineIdsRef.current) return defaultLineStyle
        const id = feature.get("id_linea")
        return visibleLineIdsRef.current.has(id) ? defaultLineStyle : null
      },
        zIndex: 4
    })
    setTimeout(() => {
    const features = lineLayerRef.current?.getSource().getFeatures() || []
    const propsList = features.map((f) => f.getProperties())

    window.dispatchEvent(new CustomEvent("lineas-cargadas", { detail: propsList }))
    }, 500)

    // Capa de paradas
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
      zIndex: 5, // Encima de líneas
    })

    // Capa temporal (la más alta)
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
      zIndex: 10, // La más alta
    })

    const map = new Map({
      target: mapRef.current,
      layers: [
        new TileLayer({ source: new OSM() }),
        limitesDepartamentalesLayerRef.current, // Abajo del todo
        localidadesCensalesLayerRef.current, // Encima de límites
        camineriaLayerRef.current,
        lineLayerRef.current,
        stopLayerRef.current,
        mojonesLayerRef.current,
        temporaryLayerRef.current, // Arriba del todo
      ],
      view: new View({
        projection: utmProjection,
        center: montevideoUTM,
        zoom: 10,
      }),
    })
    mapInstanceRef.current = map
    window.mapInstanceRef = mapInstanceRef

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.setTarget(undefined)
        mapInstanceRef.current.dispose()
        mapInstanceRef.current = null
      }
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
  

  // Envio nombres de departamentos y ciudades para filtros
  const departamentoLayer = limitesDepartamentalesLayerRef.current
  const ciudadLayer = localidadesCensalesLayerRef.current

// Recolectar datos únicos y bien formateados para los filtros
const checkAndSendAttributes = () => {
  const departamentoLayer = limitesDepartamentalesLayerRef.current
  const ciudadLayer = localidadesCensalesLayerRef.current
  const camineriaLayer = camineriaLayerRef.current
  const mojonesLayer = mojonesLayerRef.current

  if (!departamentoLayer || !ciudadLayer || !camineriaLayer || !mojonesLayer) {
    setTimeout(checkAndSendAttributes, 500)
    return
  }

  const deptoSource = departamentoLayer.getSource()
  const ciudadSource = ciudadLayer.getSource()
  const camineriaSource = camineriaLayer.getSource()
  const mojonesSource = mojonesLayer.getSource()

  if (
    deptoSource.getState() === "ready" &&
    ciudadSource.getState() === "ready" &&
    camineriaSource.getState() === "ready" &&
    mojonesSource.getState() === "ready" &&
    deptoSource.getFeatures().length > 0 &&
    ciudadSource.getFeatures().length > 0 &&
    camineriaSource.getFeatures().length > 0 &&
    mojonesSource.getFeatures().length > 0
  ) {
    const getUniqueAttributes = (layer, attr) => {
      const seen = new Set()
      return layer.getSource().getFeatures().reduce((acc, f) => {
        const val = f.get(attr)
        if (val && !seen.has(val)) {
          seen.add(val)
          acc.push({ label: val, value: val })
        }
        return acc
      }, [])
    }

    // 🔵 Rutas
    const rutasFeatures = camineriaSource.getFeatures()
      .filter(f => {
        const numero = f.get("numero")
        return Number.isInteger(numero) && numero >= 1 && numero <= 99
      })

    // NO transformar geometría si ya están en EPSG:4326
    const rutas = rutasFeatures.map((f) => ({
      type: "Feature",
      geometry: f.getGeometry().clone().getCoordinates
        ? {
            type: f.getGeometry().getType(),
            coordinates: f.getGeometry().getCoordinates()
          }
        : null,
      properties: {
        numero: f.get("numero")
      }
    }))

    window.rutasGeojson = rutas
    const rutasUnicas = [...new Set(rutas.map(f => f.properties.numero))].sort((a, b) => a - b)

    // 🔵 Mojones (también ya están en EPSG:4326, no transformar)
      const mojones = mojonesSource.getFeatures()
        .map(f => {
          const rawRuta = f.get("nom_sd")?.toString()
          const rutaMatch = rawRuta?.match(/^(\d+)(?:-(.+))?/) // captura "63-SD" como [63, SD]
          const ruta = rutaMatch ? Number(rutaMatch[1]) : null
          const sufijo = rutaMatch && rutaMatch[2] ? rutaMatch[2] : null

          const km = Number(f.get("progresiva"))
          const coords = f.getGeometry().getCoordinates()
          return {
            geometry: {
              type: "Point",
              coordinates: coords
            },
            properties: { ruta, km, sufijo }
          }
        })
        .filter(m => Number.isInteger(m.properties.ruta) && Number.isFinite(m.properties.km))


    window.mojonesGeojson = mojones

    // 🔵 Enviar filtros
    window.dispatchEvent(new CustomEvent("load-options", {
      detail: {
        departamentos: getUniqueAttributes(departamentoLayer, "depto"),
        ciudades: getUniqueAttributes(ciudadLayer, "nomloc"),
        rutas: rutasUnicas,
        mojones: mojones.map(m => ({
  ruta: m.properties.ruta,
  km: m.properties.km,
  sufijo: m.properties.sufijo
}))
      }
    }))
  } else {
    setTimeout(checkAndSendAttributes, 500)
  }
}

checkAndSendAttributes()





function handleFilteredLines(e) {
  const lineasFiltradas = e.detail
  visibleLineIdsRef.current = new Set(lineasFiltradas.map((l) => l.id_linea))
  lineLayerRef.current?.changed()
}

const handleClearFilters = () => {
  setFilters(initialFilters)
  setKmOptions([]) // Limpia los kilómetros mostrados

  window.dispatchEvent(new CustomEvent("filtrar-lineas", { detail: lineas }))
  window.dispatchEvent(new CustomEvent("limpiar-filtros"))
}




useEffect(() => {
  const handleFilteredLines = (e) => {
    const lineasFiltradas = e.detail
    const idsFiltradas = new Set(lineasFiltradas.map((l) => l.id_linea))

    lineLayerRef.current?.getSource().getFeatures().forEach((feature) => {
      const id = feature.get("id_linea")
      feature.setStyle(idsFiltradas.has(id) ? null : new Style({ display: "none" }))
    })
  }

  window.addEventListener("filtrar-lineas", handleFilteredLines)
  return () => window.removeEventListener("filtrar-lineas", handleFilteredLines)
}, [])






  // Efectos para actualizar visibilidad de capas
  useEffect(() => {
    if (camineriaLayerRef.current) {
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

  // Efectos para actualizar visibilidad de mojones
  useEffect(() => {
  if (mojonesLayerRef.current) {
    mojonesLayerRef.current.setStyle((feature) => {
      return showMojones
        ? new Style({
            image: new CircleStyle({
              radius: 4,
              fill: new Fill({ color: "rgba(0,0,0,0.7)" }),
              stroke: new Stroke({ color: "#fff", width: 1 }),
            }),
          })
        : null
    })
  }
}, [showMojones])


  // Escuchar eventos de cálculo de ruta
  useEffect(() => {
    const handleCalculateRoute = async (event) => {
      const { startCoord, endCoord } = event.detail

      console.log("🎯 Calculando ruta desde:", startCoord, "hasta:", endCoord)

      await calculateRouteWithGraph(startCoord, endCoord)
    }

    window.addEventListener("calculate-shortest-route", handleCalculateRoute)

    return () => {
      window.removeEventListener("calculate-shortest-route", handleCalculateRoute)
    }
  }, [calculateRouteWithGraph])

  useEffect(() => {
    if (lineLayerRef.current) {
      lineLayerRef.current.setStyle((feature) => {
        return showLines ? defaultLineStyle : null
      })
    }
  }, [showLines])

  useEffect(() => {
    if (limitesDepartamentalesLayerRef.current) {
      limitesDepartamentalesLayerRef.current.setStyle((feature) => {
        return showLimitesDepartamentales ? limitesDepartamentalesStyle : null
      })
    }
  }, [showLimitesDepartamentales])

  useEffect(() => {
    if (localidadesCensalesLayerRef.current) {
      localidadesCensalesLayerRef.current.setStyle((feature) => {
        return showLocalidadesCensales ? localidadesCensalesStyle : null
      })
    }
  }, [showLocalidadesCensales])

  // Función para detectar el departamento y ciudad de una coordenada
  const detectLocationInfo = (coordinate) => {
    console.log("🔍 Detectando ubicación para coordenada:", coordinate)

    let department = null
    let city = null

    // Detectar departamento
    if (limitesDepartamentalesLayerRef.current && limitesDepartamentalesLayerRef.current.getSource()) {
      const departmentFeatures = limitesDepartamentalesLayerRef.current.getSource().getFeatures()
      console.log("📍 Features de límites departamentales disponibles:", departmentFeatures.length)

      for (const feature of departmentFeatures) {
        const geometry = feature.getGeometry()
        if (geometry) {
          try {
            const isInside = geometry.intersectsCoordinate(coordinate)
            if (isInside) {
              const props = feature.getProperties()
              department = props.depto
              console.log("🏛️ Departamento detectado:", department)
              break
            }
          } catch (error) {
            console.error("Error verificando intersección con departamento:", error)
          }
        }
      }
    }

    // Detectar ciudad (localidad censal)
    if (localidadesCensalesLayerRef.current && localidadesCensalesLayerRef.current.getSource()) {
      const cityFeatures = localidadesCensalesLayerRef.current.getSource().getFeatures()
      console.log("🏙️ Features de localidades censales disponibles:", cityFeatures.length)

      for (const feature of cityFeatures) {
        const geometry = feature.getGeometry()
        if (geometry) {
          try {
            const isInside = geometry.intersectsCoordinate(coordinate)
            if (isInside) {
              const props = feature.getProperties()
              console.log("🔍 Propiedades completas de localidad censal:", props)
              // Usar específicamente el campo nomloc
              city = props.nomloc
              console.log("🏙️ Ciudad detectada desde nomloc:", city)
              break
            }
          } catch (error) {
            console.error("Error verificando intersección con localidad:", error)
          }
        }
      }
    }

    // Si no se detectó ciudad, usar "Sin ciudad"
    if (!city) {
      city = "Sin ciudad"
      console.log("🏙️ No se detectó ciudad, usando:", city)
    }

    console.log("📍 Ubicación detectada FINAL - Departamento:", department, "Ciudad:", city)
    return { department, city }
  }
  

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

        // Si está en modo vincular paradas, permitir clics en paradas aunque el formulario esté abierto
        if (isLinkingStopsRef.current) {
          let featureClicked = null
          let layerClicked = null
          map.forEachFeatureAtPixel(evt.pixel, (feature, layer) => {
            if (!featureClicked) {
              featureClicked = feature
              layerClicked = layer
            }
          })

          if (featureClicked && layerClicked === stopLayerRef.current) {
            // Procesar vinculación de parada
            const stopCoordinate = featureClicked.getGeometry().getCoordinates()
            const stopData = featureClicked.getProperties()
            const stopId = stopData.id_parada || stopData.id

            console.log("🔗 Verificando parada para vincular:", stopId)

            // Calcular distancia de la parada a la línea
            const distanceToLine = calculateDistanceToLine(stopCoordinate, currentLinkingRouteRef.current)

            console.log(`🔗 Distancia de parada a línea: ${distanceToLine.toFixed(2)}m`)

            if (distanceToLine > 25) {
              alert(
                `❌ La parada está a ${distanceToLine.toFixed(1)}m de la línea. Debe estar a menos de 25m para vincularla.`,
              )
              return
            }

            // Vincular parada
            console.log("✅ Vinculando parada a la línea")

            window.dispatchEvent(
              new CustomEvent("link-stop-to-line", {
                detail: {
                  lineId: currentLinkingLineIdRef.current,
                  stopId: stopId,
                  stopData: stopData,
                  distance: distanceToLine,
                },
              }),
            )
            return
          }
        }

        // Para otros casos con formulario abierto, no procesar clics
        return
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
            alert("⚠️ Active al menos una capa de caminería para crear paradas.")
            return
          }

          if (!isPointOnCamineria(evt.coordinate)) {
            const capasVisibles = []
            if (showRutasNacionales) capasVisibles.push("rutas nacionales (rosa)")
            if (showCaminosDepartamentales) capasVisibles.push("caminos departamentales (marrón)")

            alert(`⚠️ Las paradas solo pueden crearse sobre: ${capasVisibles.join(" o ")}.`)
            return
          }

          // Detectar departamento y ciudad automáticamente
          const locationInfo = detectLocationInfo(evt.coordinate)
          console.log("🏛️ Información de ubicación detectada para nueva parada:", locationInfo)

          onMapInteractionRequest({
            type: "MAP_CLICK_FOR_ADD",
            payload: {
              coordinates: evt.coordinate,
              detectedDepartment: locationInfo.department,
              detectedCity: locationInfo.city,
            },
          })
        } else if (activeTool === "add-line") {
          if (featureClicked && layerClicked === stopLayerRef.current) {
            // Clicked on a stop - validate the segment if there are existing points
            const newCoordinate = featureClicked.getGeometry().getCoordinates()
            const locationInfo = detectLocationInfo(newCoordinate)
            console.log("🏛️ Información de ubicación detectada para parada de línea:", locationInfo)

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
                detectedDepartment: locationInfo.department,
                detectedCity: locationInfo.city,
              },
            })
          } else {
            // Verificar si hay capas visibles
            if (!showRutasNacionales && !showCaminosDepartamentales) {
              alert("⚠️ Active al menos una capa de caminería para crear puntos de ruta.")
              return
            }

            // Validar que el punto esté sobre una ruta
            if (!isPointOnCamineria(evt.coordinate)) {
              const capasVisibles = []
              if (showRutasNacionales) capasVisibles.push("rutas nacionales (rosa)")
              if (showCaminosDepartamentales) capasVisibles.push("caminos departamentales (marrón)")

              alert(`⚠️ Los puntos de ruta solo pueden crearse sobre: ${capasVisibles.join(" o ")}.`)
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
            alert("⚠️ Active al menos una capa de caminería para crear rutas automáticas.")
            return
          }

          // Validar que el punto esté sobre una ruta
          if (!isPointOnCamineria(evt.coordinate)) {
            const capasVisibles = []
            if (showRutasNacionales) capasVisibles.push("rutas nacionales (rosa)")
            if (showCaminosDepartamentales) capasVisibles.push("caminos departamentales (marrón)")

            alert(`⚠️ Los puntos de ruta solo pueden seleccionarse sobre: ${capasVisibles.join(" o ")}.`)
            return
          }

          // Detectar departamento y ciudad automáticamente para el punto de routing
          const locationInfo = detectLocationInfo(evt.coordinate)
          console.log("🏛️ Información de ubicación detectada para punto de routing:", locationInfo)

          onMapInteractionRequest({
            type: "ROUTING_POINT_SELECTED",
            payload: {
              coordinates: evt.coordinate,
              detectedDepartment: locationInfo.department,
              detectedCity: locationInfo.city,
            },
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
        } else if (isLinkingStopsRef.current && featureClicked && layerClicked === stopLayerRef.current) {
          // Modo vincular paradas activo
          const stopCoordinate = featureClicked.getGeometry().getCoordinates()
          const stopData = featureClicked.getProperties()
          const stopId = stopData.id_parada || stopData.id

          console.log("🔗 Verificando parada para vincular:", stopId)

          // Calcular distancia de la parada a la línea
          const distanceToLine = calculateDistanceToLine(stopCoordinate, currentLinkingRouteRef.current)

          console.log(`🔗 Distancia de parada a línea: ${distanceToLine.toFixed(2)}m`)

          if (distanceToLine > 25) {
            alert(
              `❌ La parada está a ${distanceToLine.toFixed(1)}m de la línea. Debe estar a menos de 25m para vincularla.`,
            )
            return
          }

          // Vincular parada
          console.log("✅ Vinculando parada a la línea")

          window.dispatchEvent(
            new CustomEvent("link-stop-to-line", {
              detail: {
                lineId: currentLinkingLineIdRef.current,
                stopId: stopId,
                stopData: stopData,
                distance: distanceToLine,
              },
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

          let content = `Admin Info: ${props.nombre || props.name || props.id || "Elemento"}\n`
          for (const key in props) {
            if (key !== "geometry" && Object.prototype.hasOwnProperty.call(props, key)) {
              content += `${key}: ${JSON.stringify(props[key])}\n`
            }
          }
          content += `Coords UTM (X/Y): ${utmCoords[0]}, ${utmCoords[1]}`

          alert(content)
        }
      } else {
        // Public user click logic (simplified)
        let featureClicked = null
        map.forEachFeatureAtPixel(evt.pixel, (feature) => {
          if (!featureClicked) featureClicked = feature
        })
      let layerClicked = null

      map.forEachFeatureAtPixel(evt.pixel, (feature, layer) => {
        if (!featureClicked) {
          featureClicked = feature
          layerClicked = layer
        }
      })

        if (featureClicked) {
            const props = featureClicked.getProperties()
            const geom = featureClicked.getGeometry()
            let utmCoords = ["N/A", "N/A"]
            let featureType = "Elemento"

            if (geom) {
              if (geom.getType() === "Point") {
                if (layerClicked === stopLayerRef.current) {
                  featureType = "Parada"
                } else if (layerClicked === mojonesLayerRef.current) {
                  featureType = "Mojón"
                } else {
                  featureType = "Punto"
                }

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

            let content = `${featureType}: ${props.nombre || props.name || props.descripcion || props.id}\n`

            if (featureType === "Parada") {
              content += `Nombre: ${props.nombre || "N/D"}\n`
              content += `Ruta/Km: ${props.ruta_km || props.ruta || "N/D"}\n`
              content += `Departamento: ${props.departamento || "N/D"}\n`
              content += `Ciudad: ${props.ciudad || "N/D"}\n`
              content += `Sentido: ${props.sentido || "N/D"}\n`
              content += `Estado: ${typeof props.activa === "boolean" ? (props.activa ? "Habilitada" : "Deshabilitada") : "N/D"}\n`
              content += `Refugio: ${typeof props.refugio === "boolean" ? (props.refugio ? "Sí" : "No") : "N/D"}\n`
              content += `Observaciones: ${props.observaciones || "Ninguna"}\n`
              content += `Coords UTM (X/Y): ${utmCoords[0]}, ${utmCoords[1]}`
            } else if (featureType === "Mojón") {
              content += `Ruta: ${props.ruta || "N/D"}\n`
              content += `Km: ${props.km || "N/D"}\n`
              content += `Coords UTM (X/Y): ${utmCoords[0]}, ${utmCoords[1]}`
            } else {
              for (const key in props) {
                if (key !== "geometry" && Object.prototype.hasOwnProperty.call(props, key)) {
                  content += `${key}: ${JSON.stringify(props[key])}\n`
                }
              }
            }

            alert(content)
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
                alert("❌ No se puede eliminar: la línea debe tener al menos 2 puntos.")
                return
              }

              // Remove the point from coordinates array
              const newCoordinates = currentCoordinates.filter((_, index) => index !== pointIndex)

              console.log("🔍 Validando línea después de eliminar punto...")

              // Validate the line after removing the point
              const validation = validateLineFollowsRoads(newCoordinates, false)

              if (!validation.isValid) {
                console.log("❌ No se puede eliminar: la línea resultante no seguiría las rutas")
                alert("❌ No se puede eliminar: eliminar este punto haría que la línea no siga las rutas disponibles.")
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

              console.log("✅ Punto eliminado correctamente")
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
    const capasVisibles = []
    if (showRutasNacionales) capasVisibles.push("rutas nacionales (rosa)")
    if (showCaminosDepartamentales) capasVisibles.push("caminos departamentales (marrón)")

    alert(
      `❌ No se puede colocar este ${tipoElemento} porque el tramo desde el último punto no sigue completamente las rutas disponibles (${capasVisibles.join(" o ")}).\n\n💡 Coloque puntos intermedios que sigan las rutas para conectar estos puntos.`,
    )
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
        // Detectar nueva ubicación (departamento y ciudad)
        const newLocationInfo = detectLocationInfo(coords)
        console.log("🏛️ Nueva ubicación detectada:", newLocationInfo)

        // Actualizar coordenadas y ubicación en el formulario
        window.dispatchEvent(
          new CustomEvent("update-stop-coordinates", {
            detail: {
              lat: coords[1].toFixed(2),
              lng: coords[0].toFixed(2),
              detectedDepartment: newLocationInfo.department,
              detectedCity: newLocationInfo.city,
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
          originalCoordinate: [...coord],
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

  // Link stops mode effects
  useEffect(() => {
    const handleStartLinkStops = (e) => {
      const { lineId, routeCoordinates } = e.detail
      console.log("🔗 DEBUG INICIO VINCULACIÓN:")
      console.log("  - lineId:", lineId)
      console.log("  - routeCoordinates recibido:", routeCoordinates)
      console.log("  - Tipo:", typeof routeCoordinates)
      console.log("  - Es array:", Array.isArray(routeCoordinates))
      console.log("  - Longitud:", routeCoordinates ? routeCoordinates.length : "N/A")

      if (routeCoordinates && Array.isArray(routeCoordinates) && routeCoordinates.length > 0) {
        console.log("  - Primer elemento:", routeCoordinates[0])
        console.log("  - Tipo primer elemento:", typeof routeCoordinates[0])
        console.log("  - Es array primer elemento:", Array.isArray(routeCoordinates[0]))
      }

      isLinkingStopsRef.current = true
      currentLinkingLineIdRef.current = lineId
      currentLinkingRouteRef.current = routeCoordinates || []

      console.log("🔗 Estado guardado en ref:")
      console.log("  - currentLinkingRouteRef.current:", currentLinkingRouteRef.current)
    }

    const handleEndLinkStops = () => {
      console.log("🔗 Finalizando modo vincular paradas")
      isLinkingStopsRef.current = false
      currentLinkingLineIdRef.current = null
      currentLinkingRouteRef.current = []
    }

    window.addEventListener("start-link-stops-mode", handleStartLinkStops)
    window.addEventListener("end-link-stops-mode", handleEndLinkStops)

    return () => {
      window.removeEventListener("start-link-stops-mode", handleStartLinkStops)
      window.removeEventListener("end-link-stops-mode", handleEndLinkStops)
    }
  }, [])

  // Función para obtener el título del modal basado en el modo
  const getModalTitle = (mode) => {
    switch (mode) {
      case "add":
        return "Añadir Nueva Parada"
      case "edit":
        return "Editar Parada"
      case "add-line":
        return popupFormConfig.initialData?.isRoutingMode ? "Nueva Línea (Automática)" : "Nueva Línea (Manual)"
      case "edit-line":
        return "Editar Línea"
      default:
        return "Formulario"
    }
  }

  // Click to move editable point
  useEffect(() => {
    const handleClickToMove = (evt) => {
      if (!isMovingStopRef.current) return
      if (!editableMarkerRef.current || !editableLayerRef.current || !mapInstanceRef.current) return

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
      if (limitesDepartamentalesLayerRef.current) {
        limitesDepartamentalesLayerRef.current.getSource().refresh()
      }
      if (localidadesCensalesLayerRef.current) {
        localidadesCensalesLayerRef.current.getSource().refresh()
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

  // Función para calcular la distancia de un punto a una línea
  const calculateDistanceToLine = (point, lineCoordinates) => {
    console.log("🔍 calculateDistanceToLine - DEBUG COMPLETO:")
    console.log("  - Punto recibido:", point)
    console.log("  - Tipo de punto:", typeof point, "Es array:", Array.isArray(point))

    console.log("  - lineCoordinates recibido:", lineCoordinates)
    console.log("  - Tipo de lineCoordinates:", typeof lineCoordinates)
    console.log("  - Es array:", Array.isArray(lineCoordinates))
    console.log("  - Longitud:", lineCoordinates ? lineCoordinates.length : "N/A")

    // Logging más detallado de la estructura
    if (lineCoordinates && Array.isArray(lineCoordinates)) {
      console.log("  - Primeros 3 elementos:", lineCoordinates.slice(0, 3))
      console.log("  - Tipo del primer elemento:", typeof lineCoordinates[0])
      console.log("  - Es array el primer elemento:", Array.isArray(lineCoordinates[0]))
      if (lineCoordinates[0] && Array.isArray(lineCoordinates[0])) {
        console.log("  - Contenido del primer elemento:", lineCoordinates[0])
      }
    }

    // Validaciones básicas
    if (!lineCoordinates) {
      console.warn("❌ RETURN 1: lineCoordinates es null o undefined")
      return Number.MAX_VALUE
    }

    if (!Array.isArray(lineCoordinates)) {
      console.warn("❌ RETURN 2: lineCoordinates no es un array")
      return Number.MAX_VALUE
    }

    if (lineCoordinates.length < 2) {
      console.warn("❌ RETURN 3: La línea no tiene suficientes puntos:", lineCoordinates.length)
      return Number.MAX_VALUE
    }

    if (!point || !Array.isArray(point) || point.length < 2) {
      console.warn("❌ RETURN 4: Punto inválido:", point)
      return Number.MAX_VALUE
    }

    console.log("✅ Validaciones básicas pasadas, iniciando cálculo...")

    let minDistance = Number.MAX_VALUE
    let validSegments = 0

    for (let i = 0; i < lineCoordinates.length - 1; i++) {
      const startPoint = lineCoordinates[i]
      const endPoint = lineCoordinates[i + 1]

      console.log(`🔍 Procesando segmento ${i}:`)
      console.log(`  - startPoint:`, startPoint, typeof startPoint, Array.isArray(startPoint))
      console.log(`  - endPoint:`, endPoint, typeof endPoint, Array.isArray(endPoint))

      // Validar que los puntos sean válidos
      if (!startPoint || !endPoint || !Array.isArray(startPoint) || !Array.isArray(endPoint)) {
        console.warn(`❌ Segmento ${i} - Puntos inválidos:`, startPoint, endPoint)
        continue
      }

      if (startPoint.length < 2 || endPoint.length < 2) {
        console.warn(`❌ Segmento ${i} - Coordenadas insuficientes:`, startPoint, endPoint)
        continue
      }

      console.log(`✅ Segmento ${i} válido, calculando distancia...`)
      validSegments++

      const distance = calculateDistanceToSegmentUTM(point, startPoint, endPoint)
      console.log(`📏 Distancia calculada para segmento ${i}: ${distance}`)

      if (!isNaN(distance) && distance < minDistance) {
        minDistance = distance
        console.log(`🎯 Nueva distancia mínima: ${minDistance.toFixed(2)}m`)
      }
    }

    console.log(`📊 RESUMEN FINAL:`)
    console.log(`  - Segmentos válidos procesados: ${validSegments}`)
    console.log(`  - Distancia mínima final: ${minDistance}`)
    console.log(`  - ¿Es MAX_VALUE?: ${minDistance === Number.MAX_VALUE}`)

    return minDistance === Number.MAX_VALUE ? 0 : minDistance
  }

  // Función auxiliar para calcular la distancia de un punto a un segmento en coordenadas UTM
  const calculateDistanceToSegmentUTM = (point, startPoint, endPoint) => {
    // Validar entrada
    if (!point || !startPoint || !endPoint) {
      console.warn("❌ Puntos null en calculateDistanceToSegmentUTM")
      return Number.MAX_VALUE
    }

    if (!Array.isArray(point) || !Array.isArray(startPoint) || !Array.isArray(endPoint)) {
      console.warn("❌ Puntos no son arrays en calculateDistanceToSegmentUTM")
      return Number.MAX_VALUE
    }

    if (point.length < 2 || startPoint.length < 2 || endPoint.length < 2) {
      console.warn("❌ Puntos con coordenadas insuficientes en calculateDistanceToSegmentUTM")
      return Number.MAX_VALUE
    }

    // Extraer coordenadas UTM (ya están en metros)
    const [px, py] = point
    const [x1, y1] = startPoint
    const [x2, y2] = endPoint

    console.log(`🔍 Calculando distancia UTM:`)
    console.log(`  - Punto: [${px.toFixed(2)}, ${py.toFixed(2)}]`)
    console.log(`  - Inicio segmento: [${x1.toFixed(2)}, ${y1.toFixed(2)}]`)
    console.log(`  - Fin segmento: [${x2.toFixed(2)}, ${y2.toFixed(2)}]`)

    // Vector del segmento
    const dx = x2 - x1
    const dy = y2 - y1

    // Longitud al cuadrado del segmento
    const lengthSquared = dx * dx + dy * dy

    console.log(`📏 Longitud del segmento: ${Math.sqrt(lengthSquared).toFixed(2)}m`)

    // Si el segmento tiene longitud cero, calcular distancia al punto
    if (lengthSquared === 0) {
      const distX = px - x1
      const distY = py - y1
      const distance = Math.sqrt(distX * distX + distY * distY)
      console.log(`📏 Segmento de longitud cero, distancia al punto: ${distance.toFixed(2)}m`)
      return distance
    }

    // Parámetro t que representa la proyección del punto sobre la línea
    let t = ((px - x1) * dx + (py - y1) * dy) / lengthSquared

    console.log(`📐 Parámetro t (antes de limitar): ${t.toFixed(4)}`)

    // Limitar t al segmento [0, 1]
    t = Math.max(0, Math.min(1, t))

    console.log(`📐 Parámetro t (después de limitar): ${t.toFixed(4)}`)

    // Punto más cercano en el segmento
    const closestX = x1 + t * dx
    const closestY = y1 + t * dy

    console.log(`📍 Punto más cercano en segmento: [${closestX.toFixed(2)}, ${closestY.toFixed(2)}]`)

    // Distancia euclidiana en metros (ya que estamos en UTM)
    const distX = px - closestX
    const distY = py - closestY
    const distance = Math.sqrt(distX * distX + distY * distY)

    console.log(`📏 Distancia final calculada: ${distance.toFixed(2)}m`)

    return distance
  }

  return (
    <div className="w-full h-full relative">
      <div id="map" ref={mapRef} className="w-full h-full" />

      {/* Control de capas simplificado */}
      <LayerControl
        showRutasNacionales={showRutasNacionales}
        showCaminosDepartamentales={showCaminosDepartamentales}
        showLines={showLines}
        showLimitesDepartamentales={showLimitesDepartamentales}
        showLocalidadesCensales={showLocalidadesCensales}
        showMojones={showMojones}
        onToggleRutas={() => setShowRutasNacionales(!showRutasNacionales)}
        onToggleCaminos={() => setShowCaminosDepartamentales(!showCaminosDepartamentales)}
        onToggleLines={() => setShowLines(!showLines)}
        onToggleLimites={() => setShowLimitesDepartamentales(!showLimitesDepartamentales)}
        onToggleLocalidades={() => setShowLocalidadesCensales(!showLocalidadesCensales)}
        onToggleMojones={() => setShowMojones(!showMojones)}
      />

      {/* Modal draggable para formularios */}
      <DraggableModal
        isVisible={popupFormConfig.isVisible}
        onClose={popupFormConfig.mode?.includes("line") ? onLineFormCancel : onStopFormCancel}
        title={getModalTitle(popupFormConfig.mode)}
      >
        {popupFormConfig.mode === "add" && (
          <StopForm
            mode="add"
            initialData={popupFormConfig.initialData}
            onSubmit={onStopFormSubmit}
            onCancel={onStopFormCancel}
          />
        )}

        {popupFormConfig.mode === "edit" && (
          <StopForm
            mode="edit"
            initialData={popupFormConfig.initialData}
            onSubmit={onStopFormSubmit}
            onCancel={onStopFormCancel}
            onDelete={onStopFormDelete}
          />
        )}

        {popupFormConfig.mode === "add-line" && (
          <LineForm
            mode="add-line"
            initialData={popupFormConfig.initialData}
            onSubmit={onLineFormSubmit}
            onCancel={onLineFormCancel}
          />
        )}

        {popupFormConfig.mode === "edit-line" && (
          <LineForm
            mode="edit-line"
            initialData={popupFormConfig.initialData}
            onSubmit={onLineFormSubmit}
            onCancel={onLineFormCancel}
          />
        )}
      </DraggableModal>

      {/* Indicador de progreso de ruta */}
      <RouteProgressIndicator
        isVisible={routeCalculation.isCalculating}
        progress={routeCalculation.progress}
        message={routeCalculation.message}
      />
    </div>
  )
}
