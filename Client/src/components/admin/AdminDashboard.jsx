
import { MapView} from "@/components"
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
    // This effect handles the setup/reset when a tool is selected or deselected.
    // It's crucial not to clear temporary features if an operation for that tool is already in progress (form is open).

    if (selectedTool === "add-stop") {
      // If the "add-stop" form is NOT already visible for adding a point,
      // then it's safe to clear any previous temporary features.
      if (!(popupFormConfig.isVisible && popupFormConfig.mode === "add")) {
        setTemporaryMapFeatures([])
      }
      // Always update the instruction message. The form visibility is controlled by map click.
      setPopupFormConfig((prev) => ({
        ...prev,
        isVisible: popupFormConfig.isVisible && popupFormConfig.mode === "add" ? true : false, // Preserve visibility if form is already open for add
        message: "Haga clic en el mapa sobre una ruta para ubicar la nueva parada.",
        // Do not reset mode or key here if form is already open for 'add'
      }))
    } else if (selectedTool === "edit-stop") {
      setTemporaryMapFeatures([]) // For "edit-stop", we select existing features, so clear temps.
      setPopupFormConfig((prev) => ({
        ...prev,
        isVisible: false,
        message: "Seleccione una parada existente en el mapa para editarla.",
      }))
    } else if (selectedTool === "add-line") {
      // Only clear line points and temporary line features if not currently finalizing a line
      if (!isFinalizingLine && !(popupFormConfig.isVisible && popupFormConfig.mode === "add-line")) {
        setCurrentLinePoints([])
        setTemporaryMapFeatures([])
      }
      setPopupFormConfig((prev) => ({
        ...prev,
        isVisible: popupFormConfig.isVisible && popupFormConfig.mode === "add-line" ? true : false,
        message: "Seleccione paradas en orden para crear la línea. Haga clic en 'Finalizar Línea' cuando termine.",
      }))
    } else {
      // Tool is deselected (null) or another tool
      // Only clear features and form if no form is currently active.
      // If a form is active, its submit/cancel should handle cleanup.
      if (!popupFormConfig.isVisible) {
        setTemporaryMapFeatures([])
        setCurrentLinePoints([])
        setPopupFormConfig({ isVisible: false, mode: null, message: "", key: 0, initialData: null, coordinates: null })
      }
    }
  }, [selectedTool, isFinalizingLine]) // isFinalizingLine is added to dependencies

  const handleToolSelect = (toolId) => {
    setSelectedTool(toolId === selectedTool ? null : toolId) // Toggle tool or set new one
  }

  const handleMapInteraction = (interaction) => {
    console.log("Map Interaction Received in Dashboard:", interaction)
    // Stop interactions
    if (selectedTool === "add-stop" && interaction.type === "MAP_CLICK_FOR_ADD") {
      // This is where the new temporary point is set. It should persist.
      const newTempPoint = { type: "Point", coordinates: interaction.payload.coordinates }
      setTemporaryMapFeatures([newTempPoint]) // Set ONLY this new point

      // Transform coordinates for initialData if StopForm expects LonLat
      // Assuming interaction.payload.coordinates are in map projection (UTM)
      // This transformation should ideally happen here or be passed as raw map coords
      // and StopForm handles display transformation if needed.
      // For simplicity, let's assume StopForm can take map coordinates or you transform later.
      // const lonLatCoords = toLonLat(interaction.payload.coordinates, 'EPSG:32721'); // Example if needed

      setPopupFormConfig({
        isVisible: true,
        mode: "add",
        coordinates: interaction.payload.coordinates, // Position for the popup
        initialData: {
          // Pass map coordinates; form can display them or use them.
          // If form needs LonLat for display, it should handle it or receive transformed.
          lat: interaction.payload.coordinates[1], // These are map projection coords
          lng: interaction.payload.coordinates[0], // These are map projection coords
        },
        message: "Complete los datos de la nueva parada.",
        key: Date.now(), // Force re-render of StopForm
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
    setTemporaryMapFeatures([]) // Clear the temporary point
    setPopupFormConfig({
      isVisible: false,
      mode: null,
      message: "Guardado exitoso!",
      key: 0,
      initialData: null,
      coordinates: null,
    })
    setSelectedTool(null) // Deselect tool
    // TODO: Add map data refresh logic here (e.g., tell MapView to reload sources)
  }

  const handleStopFormCancel = () => {
    setTemporaryMapFeatures([]) // Clear the temporary point
    setPopupFormConfig({
      isVisible: false,
      mode: null,
      message: "Operación cancelada.",
      key: 0,
      initialData: null,
      coordinates: null,
    })
    // Optionally keep the tool selected if you want the user to try clicking again:
    // setSelectedTool(null);
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
