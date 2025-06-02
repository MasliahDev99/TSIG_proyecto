
import {MapView} from "@/components"
import { useState, useEffect } from "react"
import { PlusCircleIcon, EditIcon, MessageSquareTextIcon, CheckCircleIcon, RouteIcon } from "lucide-react"

const AdminToolsPanel = ({
  onToolSelect,
  selectedTool,
  instructionMessage,
  onFinalizeLine,
  currentLinePointsCount,
}) => {
  const tools = [
    { id: "add-stop", label: "Añadir Parada", icon: <PlusCircleIcon className="mr-2 h-5 w-5" /> },
    { id: "edit-stop", label: "Editar Parada", icon: <EditIcon className="mr-2 h-5 w-5" /> },
    { id: "add-line", label: "Añadir Línea", icon: <RouteIcon className="mr-2 h-5 w-5" /> },
    // { id: "edit-line", label: "Editar Línea", icon: <EditIcon className="mr-2 h-5 w-5" /> }, // Placeholder for future
  ]

  return (
    <div className="w-80 bg-white dark:bg-gray-800 p-6 space-y-4 shadow-lg overflow-y-auto">
      <h3 className="text-lg font-semibold text-gray-800 dark:text-white">Herramientas de Admin</h3>
      <hr className="border-gray-200 dark:border-gray-700 mb-4" />
      {instructionMessage && (
        <div className="p-3 mb-4 text-sm text-blue-700 bg-blue-100 rounded-lg dark:bg-blue-200 dark:text-blue-800 flex items-start">
          <MessageSquareTextIcon className="h-5 w-5 mr-2 flex-shrink-0" />
          <span>{instructionMessage}</span>
        </div>
      )}
      <div className="space-y-2">
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
          <button
            onClick={onFinalizeLine}
            className="w-full flex items-center justify-center mt-4 px-3 py-2 text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
          >
            <CheckCircleIcon className="mr-2 h-5 w-5" />
            Finalizar Línea ({currentLinePointsCount} {currentLinePointsCount === 1 ? "parada" : "paradas"})
          </button>
        )}
      </div>
    </div>
  )
}

export default function AdminDashboard() {
  const [selectedTool, setSelectedTool] = useState(null)
  const [popupFormConfig, setPopupFormConfig] = useState({
    isVisible: false,
    mode: null, // 'add' or 'edit'
    coordinates: null,
    initialData: null,
    message: "", // Instructional message
    key: 0, // To force re-render of StopForm in popup
  })
  const [temporaryMapFeatures, setTemporaryMapFeatures] = useState([]) // For visual feedback
  const [currentLinePoints, setCurrentLinePoints] = useState([]) // For 'add-line' tool
  const [isFinalizingLine, setIsFinalizingLine] = useState(false)

  useEffect(() => {
    if (selectedTool === "add-stop") {
      setPopupFormConfig((prev) => ({
        ...prev,
        isVisible: false, // Hide form until map click
        message: "Haga clic en el mapa sobre una ruta para ubicar la nueva parada.",
      }))
      setTemporaryMapFeatures([]) // Clear previous temp features
    } else if (selectedTool === "edit-stop") {
      setPopupFormConfig((prev) => ({
        ...prev,
        isVisible: false, // Hide form until map click
        message: "Seleccione una parada existente en el mapa para editarla.",
      }))
      setTemporaryMapFeatures([])
    } else if (selectedTool === "add-line") {
      setPopupFormConfig((prev) => ({
        ...prev,
        isVisible: false,
        message: "Seleccione paradas en orden para crear la línea. Haga clic en 'Finalizar Línea' cuando termine.",
      }))
      setCurrentLinePoints([])
      setTemporaryMapFeatures([])
      setIsFinalizingLine(false)
    } else {
      setPopupFormConfig((prev) => ({ ...prev, isVisible: false, message: "" }))
      setTemporaryMapFeatures([])
      setCurrentLinePoints([])
      setIsFinalizingLine(false)
    }
  }, [selectedTool])

  const handleToolSelect = (toolId) => {
    setSelectedTool(toolId === selectedTool ? null : toolId) // Toggle tool or set new one
  }

  const handleMapInteraction = (interaction) => {
    console.log("Map Interaction Received in Dashboard:", interaction)
    // Stop interactions
    if (selectedTool === "add-stop" && interaction.type === "MAP_CLICK_FOR_ADD") {
      setTemporaryMapFeatures([{ type: "Point", coordinates: interaction.payload.coordinates }])
      setPopupFormConfig({
        isVisible: true,
        mode: "add",
        coordinates: interaction.payload.coordinates,
        initialData: {
          // Assuming coordinates from map are already in the correct projection for display/use
          // If they are UTM and form needs LonLat, transform here.
          lat: interaction.payload.coordinates[1], // Placeholder, adjust based on actual transformed coords
          lng: interaction.payload.coordinates[0], // Placeholder
        },
        message: "Complete los datos de la nueva parada.",
        key: Date.now(),
      })
    } else if (selectedTool === "edit-stop" && interaction.type === "FEATURE_CLICK_FOR_EDIT") {
      setPopupFormConfig({
        isVisible: true,
        mode: "edit",
        coordinates: interaction.payload.coordinates, // Coordinates of the clicked feature
        initialData: interaction.payload.featureData,
        message: "Editando parada existente.",
        key: Date.now(),
      })
      setTemporaryMapFeatures([]) // Clear temp features as we are editing an existing one
    }
    // Line interactions
    else if (selectedTool === "add-line" && interaction.type === "STOP_CLICK_FOR_LINE") {
      const newPoint = {
        id: interaction.payload.featureData.id_parada || interaction.payload.featureData.id, // Adjust based on your stop ID property
        name: interaction.payload.featureData.nombre || interaction.payload.featureData.name,
        coordinates: interaction.payload.coordinates, // These are map coordinates (e.g., UTM)
      }
      const updatedLinePoints = [...currentLinePoints, newPoint]
      setCurrentLinePoints(updatedLinePoints)

      // Update temporary features to draw the line in progress
      if (updatedLinePoints.length > 0) {
        const lineCoords = updatedLinePoints.map((p) => p.coordinates)
        const tempLineFeature = { type: "LineString", coordinates: lineCoords }
        // Also show points
        const tempPointFeatures = updatedLinePoints.map((p) => ({
          type: "Point",
          coordinates: p.coordinates,
          style: "selectedForLine",
        }))
        setTemporaryMapFeatures([tempLineFeature, ...tempPointFeatures])
      }
      setPopupFormConfig((prev) => ({
        ...prev,
        message: `${updatedLinePoints.length} parada(s) seleccionada(s). Continúe o finalice.`,
      }))
    } else if (selectedTool === "edit-line" && interaction.type === "LINE_CLICK_FOR_EDIT") {
      setPopupFormConfig({
        isVisible: true,
        mode: "edit-line", // Specific mode for line form
        coordinates: interaction.payload.coordinates, // Click coordinate on the line
        initialData: interaction.payload.featureData,
        message: "Editando línea existente.",
        key: Date.now(),
      })
      setTemporaryMapFeatures([])
    }
  }

  const handleStopFormSubmit = async (formData) => {
    console.log("Form submitted in Dashboard:", popupFormConfig.mode, formData)
    // Here you would call your API service to save the data
    // Example:
    // if (popupFormConfig.mode === 'add') {
    //   await stopService.create(formData);
    // } else if (popupFormConfig.mode === 'edit') {
    //   await stopService.update(popupFormConfig.initialData.id, formData);
    // }
    // After successful save:
    // - Refresh map data (e.g., by re-fetching or updating the VectorSource)
    // - Close the popup
    setPopupFormConfig({ ...popupFormConfig, isVisible: false, message: "Guardado exitoso!" })
    setSelectedTool(null) // Deselect tool
    setTemporaryMapFeatures([])
    setCurrentLinePoints([])
    // TODO: Add map data refresh logic here
  }

  const handleStopFormCancel = () => {
    setPopupFormConfig({ ...popupFormConfig, isVisible: false, message: "Operación cancelada." })
    // setSelectedTool(null); // Optionally deselect tool on cancel
    setTemporaryMapFeatures([])
    // If was adding line, don't clear currentLinePoints, user might want to adjust form and re-open
  }

  const handleStopFormDelete = async (stopId) => {
    console.log("Delete requested for stop ID:", stopId)
    // await stopService.delete(stopId);
    setPopupFormConfig({ ...popupFormConfig, isVisible: false, message: "Parada eliminada." })
    setSelectedTool(null)
    setTemporaryMapFeatures([])
    setCurrentLinePoints([])
    // TODO: Add map data refresh logic here
  }

  const handleFinalizeLineSelection = () => {
    if (currentLinePoints.length < 2) {
      setPopupFormConfig((prev) => ({ ...prev, message: "Debe seleccionar al menos 2 paradas para formar una línea." }))
      return
    }
    setIsFinalizingLine(true)
    setPopupFormConfig({
      isVisible: true,
      mode: "add-line", // Specific mode for line form
      coordinates: currentLinePoints[0].coordinates, // Position popup near the first point
      initialData: {
        // Pass the selected points to the LineForm
        // The LineForm will need to know how to handle these points (e.g., extract IDs or coordinates)
        stops: currentLinePoints, // Array of {id, name, coordinates}
      },
      message: "Complete los datos de la nueva línea.",
      key: Date.now(),
    })
  }

  const handleLineFormSubmit = async (formData) => {
    console.log("Line Form submitted:", formData)
    // API call to save line
    setPopupFormConfig({ ...popupFormConfig, isVisible: false, message: "Línea guardada exitosamente!" })
    setSelectedTool(null)
    setTemporaryMapFeatures([])
    setCurrentLinePoints([])
    setIsFinalizingLine(false)
    // TODO: Refresh line data on map
  }

  const handleLineFormCancel = () => {
    setPopupFormConfig({ ...popupFormConfig, isVisible: false, message: "Creación de línea cancelada." })
    // Don't deselect tool, user might want to adjust points
    setIsFinalizingLine(false) // Allow selecting more points or re-finalizing
  }

  return (
    <div className="flex flex-1 h-full">
      <AdminToolsPanel
        onToolSelect={handleToolSelect}
        selectedTool={selectedTool}
        instructionMessage={popupFormConfig.message}
        onFinalizeLine={handleFinalizeLineSelection}
        currentLinePointsCount={currentLinePoints.length}
      />
      <main className="flex-1 relative h-full">
        <MapView
          isAdmin={true}
          activeTool={selectedTool}
          onMapInteractionRequest={handleMapInteraction}
          popupFormConfig={popupFormConfig} // Pass the whole config
          onStopFormSubmit={handleStopFormSubmit}
          onStopFormCancel={handleStopFormCancel}
          onStopFormDelete={handleStopFormDelete}
          onLineFormSubmit={handleLineFormSubmit} // New prop for line form
          onLineFormCancel={handleLineFormCancel} // New prop for line form
          temporaryFeatures={temporaryMapFeatures} // Pass temp features to MapView
        />
      </main>
    </div>
  )
}
