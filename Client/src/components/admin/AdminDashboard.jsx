"use client"

import { MapView } from "@/components"
import { useState, useEffect, useRef } from "react"
import { PlusCircleIcon, EditIcon, MessageSquareTextIcon, CheckCircleIcon, RouteIcon, TrashIcon } from "lucide-react"
import axios from "axios"

const AdminToolsPanel = ({
  onToolSelect,
  selectedTool,
  instructionMessage,
  onFinalizeLine,
  currentLinePointsCount,
  currentStopsCount,
}) => {
  const tools = [
    { id: "add-stop", label: "Añadir Parada", icon: <PlusCircleIcon className="mr-2 h-5 w-5" /> },
    { id: "edit-stop", label: "Editar Parada", icon: <EditIcon className="mr-2 h-5 w-5" /> },
    { id: "delete-stop", label: "Eliminar Parada", icon: <TrashIcon className="mr-2 h-5 w-5" /> },
    { id: "add-line", label: "Añadir Línea Manual", icon: <RouteIcon className="mr-2 h-5 w-5" /> },
    { id: "add-line-routing", label: "Línea Punto a Punto", icon: <RouteIcon className="mr-2 h-5 w-5" /> },
    { id: "edit-line", label: "Editar Línea", icon: <EditIcon className="mr-2 h-5 w-5" /> },
    { id: "delete-line", label: "Eliminar Línea", icon: <TrashIcon className="mr-2 h-5 w-5" /> },
  ]

  return (
    <div className="w-80 h-full bg-white dark:bg-gray-800 p-6 space-y-4 shadow-lg overflow-y-auto border-l border-gray-200">
      <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Herramientas de Admin</h3>
      <hr className="border-gray-200 dark:border-gray-700 mb-4" />

      {instructionMessage && (
        <div className="p-3 mb-4 text-sm text-blue-700 bg-blue-100 rounded-lg dark:bg-blue-200 dark:text-blue-800 flex items-start">
          <MessageSquareTextIcon className="h-5 w-5 mr-2 flex-shrink-0" />
          <span>{instructionMessage}</span>
        </div>
      )}

      {/* Herramientas principales */}
      <div className="space-y-2">
        <h4 className="text-sm font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">
          Gestión de Datos
        </h4>
        {tools.map((tool) => (
          <button
            key={tool.id}
            onClick={() => onToolSelect(tool.id)}
            className={`w-full flex items-center px-3 py-2 text-sm font-medium rounded-md
              ${
                selectedTool === tool.id
                  ? "bg-slate-200 dark:bg-slate-700 text-slate-900 dark:text-white"
                  : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
              }`}
          >
            {tool.icon}
            {tool.label}
          </button>
        ))}

        {selectedTool === "add-line" && currentLinePointsCount > 0 && (
          <div className="mt-4 p-3 bg-green-50 rounded-lg border border-green-200">
            <div className="text-sm text-green-800 mb-2">
              <strong>Puntos seleccionados: {currentLinePointsCount}</strong>
            </div>
            <div className="text-xs text-green-700 mb-3">
              • Paradas: {currentStopsCount}• Puntos de ruta: {currentLinePointsCount - currentStopsCount}
            </div>
            <button
              onClick={onFinalizeLine}
              className="w-full flex items-center justify-center px-3 py-2 text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
            >
              <CheckCircleIcon className="mr-2 h-5 w-5" />
              Finalizar Línea
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default function AdminDashboard({ isAdmin = false }) {
  const [selectedTool, setSelectedTool] = useState(null)
  const [popupFormConfig, setPopupFormConfig] = useState({
    isVisible: false,
    mode: null,
    coordinates: null,
    initialData: null,
    message: "",
    key: 0,
  })
  const [temporaryMapFeatures, setTemporaryMapFeatures] = useState([])
  const [currentLinePoints, setCurrentLinePoints] = useState([]) // Todos los puntos (paradas + puntos de ruta)
  const [currentLineStops, setCurrentLineStops] = useState([]) // Solo las paradas
  const [isFinalizingLine, setIsFinalizingLine] = useState(false)
  const processingRef = useRef(false)
  // Agregar estado para rastrear departamentos de origen y destino
  const [lineOriginDepartment, setLineOriginDepartment] = useState("")
  const [lineDestinationDepartment, setLineDestinationDepartment] = useState("")
  // Agregar estados para rastrear ciudades de origen y destino
  const [lineOriginCity, setLineOriginCity] = useState("")
  const [lineDestinationCity, setLineDestinationCity] = useState("")

  // Efecto para sincronizar los puntos actuales con el mapa
  useEffect(() => {
    // Enviar los puntos actuales al mapa para validación
    window.dispatchEvent(
      new CustomEvent("update-current-line-points", {
        detail: { linePoints: currentLinePoints },
      }),
    )
  }, [currentLinePoints])

  useEffect(() => {
    if (selectedTool === "add-stop") {
      if (!(popupFormConfig.isVisible && popupFormConfig.mode === "add")) {
        setTemporaryMapFeatures([])
      }
      setPopupFormConfig((prev) => ({
        ...prev,
        isVisible: popupFormConfig.isVisible && popupFormConfig.mode === "add" ? true : false,
        message: "Haga clic en el mapa para ubicar la nueva parada.",
      }))
    } else if (selectedTool === "edit-stop") {
      setTemporaryMapFeatures([])
      setPopupFormConfig((prev) => ({
        ...prev,
        isVisible: false,
        message: "Seleccione una parada existente en el mapa para editarla.",
      }))
    } else if (selectedTool === "delete-stop") {
      setTemporaryMapFeatures([])
      setPopupFormConfig((prev) => ({
        ...prev,
        isVisible: false,
        message: "Seleccione una parada existente en el mapa para eliminarla.",
      }))
    } else if (selectedTool === "add-line") {
      if (!isFinalizingLine && !(popupFormConfig.isVisible && popupFormConfig.mode === "add-line")) {
        setCurrentLinePoints([])
        setCurrentLineStops([])
        setTemporaryMapFeatures([])
      }
      setPopupFormConfig((prev) => ({
        ...prev,
        isVisible: popupFormConfig.isVisible && popupFormConfig.mode === "add-line" ? true : false,
        message:
          "Haga clic en paradas para asignarlas a la línea, o en puntos vacíos para definir la ruta. Solo se permiten tramos que sigan completamente las rutas. Doble clic para deseleccionar.",
      }))
    } else if (selectedTool === "add-line-routing") {
      if (
        !isFinalizingLine &&
        !(
          popupFormConfig.isVisible &&
          (popupFormConfig.mode === "add-line-routing" || popupFormConfig.mode === "add-line")
        )
      ) {
        setCurrentLinePoints([])
        setCurrentLineStops([])
        setTemporaryMapFeatures([])
      }
      setPopupFormConfig((prev) => ({
        ...prev,
        isVisible:
          popupFormConfig.isVisible &&
          (popupFormConfig.mode === "add-line-routing" || popupFormConfig.mode === "add-line")
            ? true
            : false,
        message:
          "Seleccione dos puntos sobre las rutas para calcular el camino más corto. Primer clic: punto de inicio, segundo clic: punto de destino.",
      }))
    } else if (selectedTool === "edit-line") {
      setTemporaryMapFeatures([])
      setPopupFormConfig((prev) => ({
        ...prev,
        isVisible: false,
        message:
          "Seleccione una línea existente en el mapa para editarla. Una vez abierto el formulario, use 'Editar Recorrido' para modificar la ruta.",
      }))
    } else if (selectedTool === "delete-line") {
      setTemporaryMapFeatures([])
      setPopupFormConfig((prev) => ({
        ...prev,
        isVisible: false,
        message: "Seleccione una línea existente en el mapa para eliminarla.",
      }))
    } else {
      if (!popupFormConfig.isVisible) {
        setTemporaryMapFeatures([])
        setCurrentLinePoints([])
        setCurrentLineStops([])
        setPopupFormConfig({ isVisible: false, mode: null, message: "", key: 0, initialData: null, coordinates: null })
      }
    }
  }, [selectedTool, isFinalizingLine])

  const handleToolSelect = (toolId) => {
    setSelectedTool(toolId === selectedTool ? null : toolId)
  }

  const handleMapInteraction = (interaction) => {
    console.log("Map Interaction Received in Dashboard:", interaction)

    if (selectedTool === "add-stop" && interaction.type === "MAP_CLICK_FOR_ADD") {
      const newTempPoint = { type: "Point", coordinates: interaction.payload.coordinates }
      setTemporaryMapFeatures([newTempPoint])

      setPopupFormConfig({
        isVisible: true,
        mode: "add",
        coordinates: interaction.payload.coordinates,
        initialData: {
          lat: interaction.payload.coordinates[1],
          lng: interaction.payload.coordinates[0],
          detectedDepartment: interaction.payload.detectedDepartment, // Pasar departamento detectado
          detectedCity: interaction.payload.detectedCity, // Pasar ciudad detectada
        },
        message: "Complete los datos de la nueva parada.",
        key: Date.now(),
      })
    } else if (selectedTool === "edit-stop" && interaction.type === "FEATURE_CLICK_FOR_EDIT") {
      setPopupFormConfig({
        isVisible: true,
        mode: "edit",
        coordinates: interaction.payload.coordinates,
        initialData: interaction.payload.featureData,
        message: "Editando parada existente.",
        key: Date.now(),
      })
      setTemporaryMapFeatures([])
    } else if (selectedTool === "delete-stop" && interaction.type === "FEATURE_CLICK_FOR_DELETE") {
      const stopData = interaction.payload.featureData
      const stopId = stopData.id_parada || stopData.id
      if (!stopId) {
        alert("ID de parada no definido. No se puede eliminar.")
        return
      }
      if (window.confirm(`¿Está seguro de que desea eliminar la parada "${stopData.nombre || stopData.name}"?`)) {
        handleStopDelete(stopId)
      }
    } else if (selectedTool === "add-line" && interaction.type === "STOP_CLICK_FOR_LINE") {
      const newStop = {
        id: interaction.payload.featureData.id_parada || interaction.payload.featureData.id,
        name: interaction.payload.featureData.nombre || interaction.payload.featureData.name,
        coordinates: interaction.payload.coordinates,
        type: "stop",
        department: interaction.payload.detectedDepartment,
        city: interaction.payload.detectedCity, // Agregar ciudad
      }

      // Check if stop is already selected
      const isAlreadySelected = currentLineStops.some((stop) => stop.id === newStop.id)
      if (isAlreadySelected) {
        setPopupFormConfig((prev) => ({
          ...prev,
          message: "Esta parada ya está seleccionada para la línea.",
        }))
        return
      }

      const updatedLinePoints = [...currentLinePoints, newStop]
      const updatedLineStops = [...currentLineStops, newStop]

      // Si es la primera parada, establecer como origen
      if (updatedLineStops.length === 1) {
        setLineOriginDepartment(newStop.department || "")
        setLineOriginCity(newStop.city || "Sin ciudad") // Agregar estado para ciudad origen
      }
      // Siempre actualizar el destino con la última parada
      setLineDestinationDepartment(newStop.department || "")
      setLineDestinationCity(newStop.city || "Sin ciudad") // Agregar estado para ciudad destino

      setCurrentLinePoints(updatedLinePoints)
      setCurrentLineStops(updatedLineStops)

      updateTemporaryFeatures(updatedLinePoints)

      setPopupFormConfig((prev) => ({
        ...prev,
        message: `✅ Parada añadida. ${updatedLineStops.length} parada(s) y ${updatedLinePoints.length - updatedLineStops.length} punto(s) de ruta seleccionados.`,
      }))
    } else if (selectedTool === "add-line" && interaction.type === "MAP_CLICK_FOR_LINE_ROUTE") {
      // Clicked on empty space - add route point
      const newRoutePoint = {
        id: `route_${Date.now()}`, // Temporary ID for route points
        coordinates: interaction.payload.coordinates,
        type: "route", // Mark as route point
      }

      const updatedLinePoints = [...currentLinePoints, newRoutePoint]
      setCurrentLinePoints(updatedLinePoints)
      // Don't add to stops array since this is just a route point

      updateTemporaryFeatures(updatedLinePoints)

      setPopupFormConfig((prev) => ({
        ...prev,
        message: `✅ Punto de ruta añadido. ${currentLineStops.length} parada(s) y ${updatedLinePoints.length - currentLineStops.length} punto(s) de ruta seleccionados.`,
      }))
    } else if (selectedTool === "add-line" && interaction.type === "REMOVE_STOP_FROM_LINE") {
      // Remove a selected stop from the line
      const coordsToRemove = interaction.payload.coordinates

      const updatedLineStops = currentLineStops.filter((stop) => {
        const distance = Math.sqrt(
          Math.pow(stop.coordinates[0] - coordsToRemove[0], 2) + Math.pow(stop.coordinates[1] - coordsToRemove[1], 2),
        )
        return distance > 1 // Remove if within 1 meter
      })

      const updatedLinePoints = currentLinePoints.filter((point) => {
        const distance = Math.sqrt(
          Math.pow(point.coordinates[0] - coordsToRemove[0], 2) + Math.pow(point.coordinates[1] - coordsToRemove[1], 2),
        )
        return distance > 1 // Remove if within 1 meter
      })

      setCurrentLineStops(updatedLineStops)
      setCurrentLinePoints(updatedLinePoints)
      updateTemporaryFeatures(updatedLinePoints)

      setPopupFormConfig((prev) => ({
        ...prev,
        message: `Parada eliminada. ${updatedLineStops.length} parada(s) y ${updatedLinePoints.length - updatedLineStops.length} punto(s) de ruta seleccionados.`,
      }))
    } else if (selectedTool === "add-line" && interaction.type === "REMOVE_ROUTE_POINT") {
      // Remove a route point from the line
      const coordsToRemove = interaction.payload.coordinates

      const updatedLinePoints = currentLinePoints.filter((point) => {
        const distance = Math.sqrt(
          Math.pow(point.coordinates[0] - coordsToRemove[0], 2) + Math.pow(point.coordinates[1] - coordsToRemove[1], 2),
        )
        return distance > 1 // Remove if within 1 meter
      })

      // Recalcular las paradas (mantener solo las que siguen en la lista)
      const updatedLineStops = currentLineStops.filter((stop) => {
        return updatedLinePoints.some((point) => point.type === "stop" && point.id === stop.id)
      })

      setCurrentLinePoints(updatedLinePoints)
      setCurrentLineStops(updatedLineStops)
      updateTemporaryFeatures(updatedLinePoints)

      setPopupFormConfig((prev) => ({
        ...prev,
        message: `Punto de ruta eliminado. ${updatedLineStops.length} parada(s) y ${updatedLinePoints.length - updatedLineStops.length} punto(s) de ruta seleccionados.`,
      }))
    } else if (selectedTool === "edit-line" && interaction.type === "LINE_CLICK_FOR_EDIT") {
      setPopupFormConfig({
        isVisible: true,
        mode: "edit-line",
        coordinates: interaction.payload.coordinates,
        initialData: interaction.payload.featureData,
        message: "Editando línea existente.",
        key: Date.now(),
      })
      setTemporaryMapFeatures([])
    } else if (selectedTool === "delete-line" && interaction.type === "LINE_CLICK_FOR_DELETE") {
      const lineData = interaction.payload.featureData
      const lineId = lineData.id_linea || lineData.id || lineData.gid
      const lineName = lineData.nombre_linea || lineData.descripcion || lineData.nombre || `ID: ${lineId}`

      console.log("🔍 Datos de línea para eliminar:", lineData)
      console.log("🔍 ID extraído:", lineId)

      if (!lineId) {
        alert("Error: No se pudo obtener el ID de la línea.")
        return
      }

      if (window.confirm(`¿Está seguro de que desea eliminar la línea "${lineName}"?`)) {
        handleLineDelete(lineId)
      }
    } else if (selectedTool === "add-line" && interaction.type === "REMOVE_STOP_FROM_LINE_BY_ID") {
      // Remove a selected stop by ID
      const stopIdToRemove = interaction.payload.stopId

      const updatedLineStops = currentLineStops.filter((stop) => stop.id !== stopIdToRemove)
      const updatedLinePoints = currentLinePoints.filter((point) => {
        if (point.type === "stop") {
          return point.id !== stopIdToRemove
        }
        return true // Keep route points
      })

      setCurrentLineStops(updatedLineStops)
      setCurrentLinePoints(updatedLinePoints)
      updateTemporaryFeatures(updatedLinePoints)

      setPopupFormConfig((prev) => ({
        ...prev,
        message: `Parada deseleccionada. ${updatedLineStops.length} parada(s) y ${updatedLinePoints.length - updatedLineStops.length} punto(s) de ruta seleccionados.`,
      }))
    } else if (selectedTool === "add-line-routing" && interaction.type === "ROUTING_POINT_SELECTED") {
      const newPoint = {
        id: `routing_${Date.now()}`,
        coordinates: interaction.payload.coordinates,
        type: "routing",
      }

      const updatedPoints = [...currentLinePoints, newPoint]
      setCurrentLinePoints(updatedPoints)

      // Detectar departamento para cada punto
      const department = interaction.payload.detectedDepartment || ""
      console.log(
        "🏛️ Departamento detectado para punto de routing:",
        department,
        "en coordenadas:",
        interaction.payload.coordinates,
      )

      // Si es el primer punto, establecer como origen
      if (updatedPoints.length === 1) {
        console.log("🏛️ Estableciendo departamento de origen:", department)
        setLineOriginDepartment(department)
        setLineOriginCity(interaction.payload.detectedCity || "Sin ciudad") // Agregar ciudad
      }
      // Si es el segundo punto, establecer como destino
      else if (updatedPoints.length === 2) {
        console.log("🏛️ Estableciendo departamento de destino:", department)
        setLineDestinationDepartment(department)
        setLineDestinationCity(interaction.payload.detectedCity || "Sin ciudad") // Agregar ciudad
      }

      // Si tenemos 2 puntos, calcular la ruta
      if (updatedPoints.length === 2) {
        calculateRoute(updatedPoints[0].coordinates, updatedPoints[1].coordinates)
      } else {
        updateTemporaryFeatures(updatedPoints)
        setPopupFormConfig((prev) => ({
          ...prev,
          message: `Punto ${updatedPoints.length}/2 seleccionado. ${updatedPoints.length === 1 ? "Seleccione el punto de destino." : ""}`,
        }))
      }
    } else if (
      // Manejar clics en paradas cuando el formulario de routing está abierto
      selectedTool === "add-line-routing" &&
      popupFormConfig.isVisible &&
      popupFormConfig.mode === "add-line" &&
      interaction.type === "STOP_CLICK_FOR_ROUTING_LINE"
    ) {
      console.log("🚏 Procesando clic en parada para línea de routing...")

      const stopCoordinate = interaction.payload.coordinates
      const routeCoordinates = currentLinePoints.map((p) => p.coordinates)

      // Calcular distancia de la parada a la línea
      const distanceToLine = calculateDistanceToLine(stopCoordinate, routeCoordinates)

      console.log(`🚏 Distancia de parada a línea: ${distanceToLine.toFixed(2)}m`)

      if (distanceToLine > 25) {
        setPopupFormConfig((prev) => ({
          ...prev,
          message: `❌ La parada está a ${distanceToLine.toFixed(1)}m de la línea. Debe estar a menos de 25m para vincularla.`,
        }))
        return
      }

      const newStop = {
        id: interaction.payload.featureData.id_parada || interaction.payload.featureData.id,
        name: interaction.payload.featureData.nombre || interaction.payload.featureData.name,
        coordinates: interaction.payload.coordinates,
        type: "stop",
      }

      // Check if stop is already selected
      const isAlreadySelected = currentLineStops.some((stop) => stop.id === newStop.id)
      if (isAlreadySelected) {
        setPopupFormConfig((prev) => ({
          ...prev,
          message: "Esta parada ya está vinculada a la línea.",
        }))
        return
      }

      const updatedLineStops = [...currentLineStops, newStop]
      setCurrentLineStops(updatedLineStops)

      console.log("🔄 Actualizando paradas vinculadas:", updatedLineStops.length)

      // Disparar evento para actualizar el formulario
      window.dispatchEvent(
        new CustomEvent("update-routing-line-stops", {
          detail: { stops: updatedLineStops },
        }),
      )

      // Actualizar el formulario con las nuevas paradas
      setPopupFormConfig((prev) => ({
        ...prev,
        initialData: {
          ...prev.initialData,
          stops: updatedLineStops,
        },
        message: `✅ Parada vinculada (${distanceToLine.toFixed(1)}m de la línea). ${updatedLineStops.length} parada(s) vinculada(s).`,
        key: Date.now(), // Forzar re-render del formulario
      }))

      // Actualizar features temporales para mostrar las paradas seleccionadas
      const stopFeatures = updatedLineStops.map((stop) => ({
        type: "Point",
        coordinates: stop.coordinates,
        style: "selectedForLine",
      }))

      const routeFeature = {
        type: "LineString",
        coordinates: routeCoordinates,
        style: "valid",
        is_valid: true,
      }

      setTemporaryMapFeatures([routeFeature, ...stopFeatures])
    }
  }

  const calculateRoute = async (startCoord, endCoord) => {
    try {
      setPopupFormConfig((prev) => ({
        ...prev,
        message: "Calculando ruta más corta...",
      }))

      // Enviar evento al mapa para calcular la ruta
      const routeEvent = new CustomEvent("calculate-shortest-route", {
        detail: { startCoord, endCoord },
      })

      window.dispatchEvent(routeEvent)
    } catch (error) {
      console.error("Error calculando ruta:", error)
      setPopupFormConfig((prev) => ({
        ...prev,
        message: "Error al calcular la ruta. Intente nuevamente.",
      }))
    }
  }

  // Escuchar el resultado del cálculo de ruta
  useEffect(() => {
    const handleRouteCalculated = (event) => {
      const { success, route, message } = event.detail

      console.log("🎯 Resultado de cálculo de ruta:", { success, routeLength: route?.length })

      if (success && route) {
        // Actualizar los puntos de la línea con la ruta calculada
        const routePoints = route.map((coord, index) => ({
          id: `route_point_${index}`,
          coordinates: coord,
          type: "route",
        }))

        setCurrentLinePoints(routePoints)
        setCurrentLineStops([]) // Inicializar paradas vacías

        // Crear feature temporal para mostrar la ruta
        const routeFeature = {
          type: "LineString",
          coordinates: route,
          style: "valid",
          is_valid: true,
        }
        setTemporaryMapFeatures([routeFeature])

        console.log("🎯 Configurando formulario de routing...")

        // Mostrar el formulario de línea inmediatamente con el modo correcto
        setTimeout(() => {
          setPopupFormConfig({
            isVisible: true,
            mode: "add-line", // Usar el mismo modo que la línea manual
            coordinates: route[0], // Usar el primer punto como referencia
            initialData: {
              stops: [], // Inicialmente sin paradas
              allPoints: routePoints,
              routeCoordinates: route,
              isRoutingMode: true, // Flag para indicar que viene del routing
              originDepartment: lineOriginDepartment, // Pasar departamento de origen
              destinationDepartment: lineDestinationDepartment, // Pasar departamento de destino
              originCity: lineOriginCity, // Agregar ciudad origen
              destinationCity: lineDestinationCity, // Agregar ciudad destino
            },
            message:
              "✅ Ruta calculada. Complete los datos de la línea y haga clic en paradas cercanas (hasta 10m) para vincularlas.",
            key: Date.now(),
          })

          console.log("✅ Formulario de routing configurado con modo add-line")
          console.log("🏛️ Origen:", lineOriginDepartment, "Destino:", lineDestinationDepartment)
        }, 100)
      } else {
        setPopupFormConfig((prev) => ({
          ...prev,
          message: `❌ ${message || "No se pudo calcular la ruta entre los puntos seleccionados."}`,
        }))

        // Limpiar puntos si falló
        setCurrentLinePoints([])
        setTemporaryMapFeatures([])
      }
    }

    window.addEventListener("route-calculation-result", handleRouteCalculated)

    return () => {
      window.removeEventListener("route-calculation-result", handleRouteCalculated)
    }
  }, [lineOriginDepartment, lineDestinationDepartment, lineOriginCity, lineDestinationCity])

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

  const updateTemporaryFeatures = (linePoints) => {
    if (linePoints.length > 0) {
      const lineCoords = linePoints.map((p) => p.coordinates)

      // Validar que la línea siga las rutas de manera más estricta
      let lineStyle = "valid"
      let isValidLine = true

      if (lineCoords.length > 1) {
        // Enviar evento de validación al mapa y esperar respuesta síncrona
        const validationEvent = new CustomEvent("validate-line-construction", {
          detail: { coordinates: lineCoords, isConstructionMode: true },
        })

        // Variable para capturar el resultado
        let validationResult = { isValid: false }

        // Listener temporal para capturar la respuesta
        const handleValidationResponse = (event) => {
          validationResult = event.detail
        }

        window.addEventListener("line-construction-validation-result", handleValidationResponse)
        window.dispatchEvent(validationEvent)

        // Dar tiempo para que se procese la validación
        setTimeout(() => {
          window.removeEventListener("line-construction-validation-result", handleValidationResponse)

          isValidLine = validationResult.isValid
          lineStyle = isValidLine ? "valid" : "invalid"

          // Si la línea no es válida, mostrar mensaje de advertencia
          if (!isValidLine) {
            setPopupFormConfig((prev) => ({
              ...prev,
              message: `❌ La línea actual NO sigue las rutas disponibles. Ajuste los puntos antes de continuar. ${currentLineStops.length} parada(s) y ${linePoints.length - currentLineStops.length} punto(s) de ruta seleccionados.`,
            }))
          } else {
            setPopupFormConfig((prev) => ({
              ...prev,
              message: `✅ Línea válida. ${currentLineStops.length} parada(s) y ${linePoints.length - currentLineStops.length} punto(s) de ruta seleccionados.`,
            }))
          }

          // Actualizar las features temporales con el estilo correcto
          const tempLineFeature = {
            type: "LineString",
            coordinates: lineCoords,
            style: lineStyle,
            is_valid: isValidLine,
          }

          const tempPointFeatures = linePoints.map((p) => ({
            type: "Point",
            coordinates: p.coordinates,
            style: p.type === "stop" ? "selectedForLine" : "routePoint",
          }))

          setTemporaryMapFeatures([tempLineFeature, ...tempPointFeatures])
        }, 100)
      } else {
        // Para un solo punto, no hay línea que validar
        const tempPointFeatures = linePoints.map((p) => ({
          type: "Point",
          coordinates: p.coordinates,
          style: p.type === "stop" ? "selectedForLine" : "routePoint",
        }))

        setTemporaryMapFeatures(tempPointFeatures)
      }
    } else {
      setTemporaryMapFeatures([])
    }
  }

  const handleStopFormSubmit = async (formData) => {
    console.log("AdminDashboard handleStopFormSubmit called", { processing: processingRef.current })

    // Prevenir procesamiento duplicado
    if (processingRef.current) {
      console.log("Already processing, ignoring duplicate call")
      return
    }

    processingRef.current = true

    try {
      console.log("Processing form submission in AdminDashboard:", popupFormConfig.mode, formData)

      // El StopForm ya hace la llamada HTTP, aquí solo manejamos la respuesta exitosa
      setPopupFormConfig({
        isVisible: false,
        mode: null,
        message: "Parada guardada exitosamente!",
        key: 0,
        initialData: null,
        coordinates: null,
      })
      setSelectedTool(null)
      setTemporaryMapFeatures([])

      // Refrescar los datos del mapa
      window.dispatchEvent(new Event("refresh-map-data"))
    } catch (error) {
      console.error("Error en AdminDashboard handleStopFormSubmit:", error)
      setPopupFormConfig((prev) => ({
        ...prev,
        message: "Error al guardar la parada.",
      }))
    } finally {
      processingRef.current = false
    }
  }

  const handleStopFormCancel = () => {
    setTemporaryMapFeatures([])
    setPopupFormConfig({
      isVisible: false,
      mode: null,
      message: "Operación cancelada.",
      key: 0,
      initialData: null,
      coordinates: null,
    })
    processingRef.current = false
  }

  const handleStopFormDelete = async (stopId) => {
    console.log("Delete requested for stop ID:", stopId)
    setPopupFormConfig({ ...popupFormConfig, isVisible: false, message: "Parada eliminada." })
    setSelectedTool(null)
    setTemporaryMapFeatures([])
    setCurrentLinePoints([])
    setCurrentLineStops([])
    window.dispatchEvent(new Event("refresh-map-data"))
  }

  const handleStopDelete = async (stopId) => {
    try {
      console.log("Eliminando parada con ID:", stopId)
      const response = await axios.delete(`http://localhost:8081/api/paradas/eliminar/${stopId}`, {
        withCredentials: true,
      })

      console.log("Respuesta de eliminación:", response)

      if (response && response.status >= 200 && response.status < 300) {
        setPopupFormConfig((prev) => ({ ...prev, message: "Parada eliminada exitosamente." }))
        window.dispatchEvent(new Event("refresh-map-data"))
      } else {
        throw new Error("Respuesta del servidor no exitosa")
      }
    } catch (error) {
      console.error("Error al eliminar parada:", error)
      setPopupFormConfig((prev) => ({ ...prev, message: "Error al eliminar la parada." }))
    }
  }

  const handleLineDelete = async (lineId) => {
    try {
      // Asegurar que el ID sea un número válido
      const numericId = Number.parseInt(lineId, 10)

      if (isNaN(numericId)) {
        console.error("ID de línea inválido:", lineId)
        setPopupFormConfig((prev) => ({ ...prev, message: "Error: ID de línea inválido." }))
        return
      }

      console.log("🗑️ Eliminando línea con ID:", numericId)

      await axios.delete(`http://localhost:8081/api/lineas/eliminar/${numericId}`, {
        withCredentials: true,
      })
      setPopupFormConfig((prev) => ({ ...prev, message: "Línea eliminada exitosamente." }))
      window.dispatchEvent(new Event("refresh-map-data"))
    } catch (error) {
      console.error("Error al eliminar línea:", error)
      setPopupFormConfig((prev) => ({ ...prev, message: "Error al eliminar la línea." }))
    }
  }

  const handleFinalizeLineSelection = () => {
    console.log("🚀 Finalizando selección de línea...")
    console.log("Paradas seleccionadas:", currentLineStops.length)
    console.log("Puntos totales:", currentLinePoints.length)

    if (currentLinePoints.length < 2) {
      setPopupFormConfig((prev) => ({
        ...prev,
        message: "❌ Debe seleccionar al menos 2 puntos para formar una línea.",
      }))
      return
    }

    // Validación estricta antes de permitir finalizar
    const coordinates = currentLinePoints.map((p) => p.coordinates)

    // Enviar evento de validación final
    const validationEvent = new CustomEvent("validate-line-construction", {
      detail: { coordinates, isConstructionMode: false }, // false = validación final más estricta
    })

    let finalValidation = { isValid: false }

    const handleFinalValidation = (event) => {
      finalValidation = event.detail
    }

    window.addEventListener("line-construction-validation-result", handleFinalValidation)
    window.dispatchEvent(validationEvent)

    setTimeout(() => {
      window.removeEventListener("line-construction-validation-result", handleFinalValidation)

      if (!finalValidation.isValid) {
        setPopupFormConfig((prev) => ({
          ...prev,
          message:
            "❌ NO se puede crear la línea: el recorrido no sigue completamente las rutas disponibles. Todos los puntos y el recorrido completo deben estar sobre las rutas visibles.",
        }))
        return
      }

      console.log("✅ Validación final exitosa, abriendo formulario de línea...")

      // Usar el primer punto como coordenada de referencia para el popup
      const referenceCoordinate = currentLinePoints[0].coordinates

      setIsFinalizingLine(true)
      setPopupFormConfig({
        isVisible: true,
        mode: "add-line",
        coordinates: referenceCoordinate,
        initialData: {
          stops: currentLineStops,
          allPoints: currentLinePoints,
          originDepartment: lineOriginDepartment,
          destinationDepartment: lineDestinationDepartment,
          originCity: lineOriginCity, // Agregar ciudad origen
          destinationCity: lineDestinationCity, // Agregar ciudad destino
        },
        message: "✅ Línea válida. Complete los datos de la nueva línea.",
        key: Date.now(),
      })
    }, 100)
  }

  const handleLineFormSubmit = async (formData) => {
    console.log("Line Form submitted:", formData)
    setPopupFormConfig({
      isVisible: false,
      mode: null,
      message: "Línea guardada exitosamente!",
      key: 0,
      initialData: null,
      coordinates: null,
    })
    setSelectedTool(null)
    setTemporaryMapFeatures([])
    setCurrentLinePoints([])
    setCurrentLineStops([])
    setIsFinalizingLine(false)
    setLineOriginDepartment("") // Limpiar
    setLineDestinationDepartment("") // Limpiar
    setLineOriginCity("") // Limpiar
    setLineDestinationCity("") // Limpiar
    window.dispatchEvent(new Event("refresh-map-data"))
  }

  const handleLineFormCancel = () => {
    console.log("Line Form cancelled")
    setPopupFormConfig({
      isVisible: false,
      mode: null,
      message: "Creación de línea cancelada.",
      key: 0,
      initialData: null,
      coordinates: null,
    })
    setCurrentLinePoints([])
    setCurrentLineStops([])
    setIsFinalizingLine(false)
    setLineOriginDepartment("") // Limpiar
    setLineDestinationDepartment("") // Limpiar
    setLineOriginCity("") // Limpiar
    setLineDestinationCity("") // Limpiar
  }

  return (
    <div className="flex h-full">
      {/* Mapa - ocupa todo el espacio disponible */}
      <div className="flex-1 relative h-full">
        <MapView
          isAdmin={isAdmin}
          activeTool={selectedTool}
          onMapInteractionRequest={handleMapInteraction}
          popupFormConfig={popupFormConfig}
          onStopFormSubmit={handleStopFormSubmit}
          onStopFormCancel={handleStopFormCancel}
          onStopFormDelete={handleStopFormDelete}
          onLineFormSubmit={handleLineFormSubmit}
          onLineFormCancel={handleLineFormCancel}
          temporaryFeatures={temporaryMapFeatures}
        />
      </div>

      {/* Panel de herramientas de admin - Solo visible si es admin */}
      {isAdmin && (
        <AdminToolsPanel
          onToolSelect={handleToolSelect}
          selectedTool={selectedTool}
          instructionMessage={popupFormConfig.message}
          onFinalizeLine={handleFinalizeLineSelection}
          currentLinePointsCount={currentLinePoints.length}
          currentStopsCount={currentLineStops.length}
        />
      )}
    </div>
  )
}
