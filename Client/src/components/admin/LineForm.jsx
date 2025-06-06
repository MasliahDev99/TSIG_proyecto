
import { useState, useEffect } from "react"

export default function LineForm({ mode, initialData, onSubmit, onCancel /*, onDelete */ }) {
  const [formData, setFormData] = useState({
    name: "",
    company: "",
    origin: "",
    destination: "",
    enabled: true,
    observations: "",
    // 'stops' will be an array of stop IDs or objects, derived from initialData.stops
  })
  const [selectedStops, setSelectedStops] = useState([])
  const [errors, setErrors] = useState({})

  useEffect(() => {
    if (initialData) {
      if (mode === "edit-line" && initialData) {
        setFormData({
          name: initialData.nombre_linea || initialData.name || "", // Adapt to your actual property names
          company: initialData.empresa || initialData.company || "",
          origin: initialData.origen || initialData.origin || "",
          destination: initialData.destino || initialData.destination || "",
          enabled: typeof initialData.activa === "boolean" ? initialData.activa : true,
          observations: initialData.observaciones || initialData.observations || "",
        })
        // If initialData for edit-line contains geometry or a list of stop IDs, process them
        // For simplicity, we're not handling direct geometry editing here yet.
        // If stops are part of initialData (e.g., an array of stop IDs or objects):
        // setSelectedStops(initialData.stops || []);
      } else if (mode === "add-line" && initialData?.stops) {
        // For add mode, 'initialData.stops' comes from AdminDashboard (currentLinePoints)
        setSelectedStops(initialData.stops.map((stop) => ({ id: stop.id, name: stop.name }))) // Store essential info
        // You might prefill origin/destination based on first/last stop
        if (initialData.stops.length > 0) {
          setFormData((prev) => ({
            ...prev,
            origin: initialData.stops[0].name,
            destination: initialData.stops[initialData.stops.length - 1].name,
          }))
        }
      }
    }
  }, [mode, initialData])

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }))
  }

  const validate = () => {
    const newErrors = {}
    if (!formData.name.trim()) newErrors.name = "El nombre de la línea es requerido."
    if (mode === "add-line" && selectedStops.length < 2) newErrors.stops = "Debe seleccionar al menos 2 paradas."
    // Add more validations
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (validate()) {
      const dataToSubmit = {
        ...formData,
        // Include the sequence of stop IDs for backend processing
        stop_ids: selectedStops.map((stop) => stop.id),
      }
      if (mode === "edit-line" && initialData?.id) {
        dataToSubmit.id = initialData.id // Include line ID if editing
      }
      onSubmit(dataToSubmit)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="p-4 space-y-3 max-h-[70vh] overflow-y-auto">
      <h3 className="text-lg font-semibold mb-2 text-center">
        {mode === "add-line" ? "Añadir Nueva Línea" : "Editar Línea"}
      </h3>

      <div>
        <label htmlFor="name" className="block text-sm font-medium">
          Nombre de Línea
        </label>
        <input
          type="text"
          name="name"
          id="name"
          value={formData.name}
          onChange={handleChange}
          className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm sm:text-sm ${errors.name ? "border-red-500" : "border-gray-300 dark:border-gray-600"} bg-white dark:bg-gray-700`}
        />
        {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
      </div>

      {/* Display selected stops for 'add-line' mode */}
      {mode === "add-line" && (
        <div>
          <label className="block text-sm font-medium">Paradas Seleccionadas ({selectedStops.length})</label>
          {selectedStops.length > 0 ? (
            <ul className="mt-1 list-decimal list-inside text-xs max-h-20 overflow-y-auto bg-gray-50 dark:bg-gray-700 p-2 rounded">
              {selectedStops.map((stop, index) => (
                <li key={stop.id || index}>
                  {stop.name} (ID: {stop.id})
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">Ninguna parada seleccionada.</p>
          )}
          {errors.stops && <p className="text-xs text-red-500 mt-1">{errors.stops}</p>}
        </div>
      )}

      <div>
        <label htmlFor="company" className="block text-sm font-medium">
          Empresa
        </label>
        <input
          type="text"
          name="company"
          id="company"
          value={formData.company}
          onChange={handleChange}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm sm:text-sm bg-white dark:bg-gray-700"
        />
      </div>

      <div>
        <label htmlFor="origin" className="block text-sm font-medium">
          Origen (Descriptivo)
        </label>
        <input
          type="text"
          name="origin"
          id="origin"
          value={formData.origin}
          onChange={handleChange}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm sm:text-sm bg-white dark:bg-gray-700"
          placeholder="Ej: Terminal Tres Cruces"
        />
      </div>
      <div>
        <label htmlFor="destination" className="block text-sm font-medium">
          Destino (Descriptivo)
        </label>
        <input
          type="text"
          name="destination"
          id="destination"
          value={formData.destination}
          onChange={handleChange}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm sm:text-sm bg-white dark:bg-gray-700"
          placeholder="Ej: Plaza Artigas, Pando"
        />
      </div>

      <div className="flex items-center pt-2">
        <input
          type="checkbox"
          name="enabled"
          id="line_enabled"
          checked={formData.enabled}
          onChange={handleChange}
          className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 dark:border-gray-600 rounded"
        />
        <label htmlFor="line_enabled" className="ml-2 block text-sm">
          Habilitada
        </label>
      </div>

      <div>
        <label htmlFor="observations" className="block text-sm font-medium">
          Observaciones
        </label>
        <textarea
          name="observations"
          id="line_observations"
          value={formData.observations}
          onChange={handleChange}
          rows="2"
          className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm sm:text-sm bg-white dark:bg-gray-700"
        ></textarea>
      </div>

      <div className="flex justify-end space-x-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded-md shadow-sm hover:bg-gray-50 dark:hover:bg-gray-500"
        >
          Cancelar
        </button>
        {/* {mode === "edit-line" && initialData?.id && onDelete && (
          <button
            type="button"
            onClick={() => onDelete(initialData.id)}
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 border border-transparent rounded-md shadow-sm"
          >
            Eliminar Línea
          </button>
        )} */}
        <button
          type="submit"
          className="px-4 py-2 text-sm font-medium text-white bg-slate-700 hover:bg-slate-800 dark:bg-slate-600 dark:hover:bg-slate-700 border border-transparent rounded-md shadow-sm"
        >
          {mode === "add-line" ? "Guardar Línea" : "Guardar Cambios"}
        </button>
      </div>
    </form>
  )
}
