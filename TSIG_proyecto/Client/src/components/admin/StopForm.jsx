import { useState, useEffect } from "react"

export default function StopForm({ mode, initialData, onSubmit, onCancel, onDelete }) {
  const [formData, setFormData] = useState({
    name: "",
    route_info: "", // e.g., "Ruta 5 Km 32"
    department: "",
    direction: "", // Sentido (e.g., "Norte a Sur")
    enabled: true,
    has_refuge: false,
    observations: "",
    lat: "",
    lng: "",
  })
  const [errors, setErrors] = useState({})

  useEffect(() => {
    if (mode === "edit" && initialData) {
      setFormData({
        name: initialData.nombre || initialData.name || "", // Adapt to your actual property names
        route_info: initialData.ruta_km || initialData.route_info || "",
        department: initialData.departamento || initialData.department || "",
        direction: initialData.sentido || initialData.direction || "",
        enabled:
          typeof initialData.activa === "boolean"
            ? initialData.activa
            : typeof initialData.enabled === "boolean"
              ? initialData.enabled
              : true,
        has_refuge:
          typeof initialData.refugio === "boolean"
            ? initialData.refugio
            : typeof initialData.has_refuge === "boolean"
              ? initialData.has_refuge
              : false,
        observations: initialData.observaciones || initialData.observations || "",
        lat: initialData.lat || (initialData.geometry?.coordinates ? initialData.geometry.coordinates[1] : "") || "",
        lng: initialData.lng || (initialData.geometry?.coordinates ? initialData.geometry.coordinates[0] : "") || "",
      })
    } else if (mode === "add" && initialData) {
      // For pre-filling coordinates on add
      setFormData((prev) => ({
        ...prev,
        name: "", // Reset other fields for add mode
        route_info: "",
        department: "",
        direction: "",
        enabled: true,
        has_refuge: false,
        observations: "",
        lat: initialData.lat || "",
        lng: initialData.lng || "",
      }))
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
    if (!formData.name.trim()) newErrors.name = "El nombre es requerido."
    if (!formData.lat || isNaN(Number.parseFloat(formData.lat))) newErrors.lat = "Latitud inválida."
    if (!formData.lng || isNaN(Number.parseFloat(formData.lng))) newErrors.lng = "Longitud inválida."
    // Add more validations as needed
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (validate()) {
      const dataToSubmit = {
        ...formData,
        lat: Number.parseFloat(formData.lat),
        lng: Number.parseFloat(formData.lng),
      }
      // If editing, include the ID
      if (mode === "edit" && initialData?.id) {
        dataToSubmit.id = initialData.id
      }
      onSubmit(dataToSubmit)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="p-4 space-y-4 max-h-[70vh] overflow-y-auto">
      <h3 className="text-lg font-semibold mb-3 text-center">
        {mode === "add" ? "Añadir Nueva Parada" : "Editar Parada"}
      </h3>

      <div>
        <label htmlFor="name" className="block text-sm font-medium">
          Nombre
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

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="lat" className="block text-sm font-medium">
            Latitud
          </label>
          <input
            type="number"
            step="any"
            name="lat"
            id="lat"
            value={formData.lat}
            onChange={handleChange}
            readOnly={mode === "add"} // ReadOnly if pre-filled by map click
            className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm sm:text-sm ${errors.lat ? "border-red-500" : "border-gray-300 dark:border-gray-600"} bg-white dark:bg-gray-700 ${mode === "add" ? "dark:bg-gray-600 bg-gray-100" : ""}`}
          />
          {errors.lat && <p className="text-xs text-red-500 mt-1">{errors.lat}</p>}
        </div>
        <div>
          <label htmlFor="lng" className="block text-sm font-medium">
            Longitud
          </label>
          <input
            type="number"
            step="any"
            name="lng"
            id="lng"
            value={formData.lng}
            onChange={handleChange}
            readOnly={mode === "add"}
            className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm sm:text-sm ${errors.lng ? "border-red-500" : "border-gray-300 dark:border-gray-600"} bg-white dark:bg-gray-700 ${mode === "add" ? "dark:bg-gray-600 bg-gray-100" : ""}`}
          />
          {errors.lng && <p className="text-xs text-red-500 mt-1">{errors.lng}</p>}
        </div>
      </div>

      <div>
        <label htmlFor="route_info" className="block text-sm font-medium">
          Ruta / Km
        </label>
        <input
          type="text"
          name="route_info"
          id="route_info"
          value={formData.route_info}
          onChange={handleChange}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm sm:text-sm bg-white dark:bg-gray-700"
        />
      </div>

      <div>
        <label htmlFor="department" className="block text-sm font-medium">
          Departamento
        </label>
        <input
          type="text"
          name="department"
          id="department"
          value={formData.department}
          onChange={handleChange}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm sm:text-sm bg-white dark:bg-gray-700"
        />
      </div>

      <div>
        <label htmlFor="direction" className="block text-sm font-medium">
          Sentido
        </label>
        <input
          type="text"
          name="direction"
          id="direction"
          value={formData.direction}
          onChange={handleChange}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm sm:text-sm bg-white dark:bg-gray-700"
        />
      </div>

      <div className="flex items-center space-x-4 pt-2">
        <div className="flex items-center">
          <input
            type="checkbox"
            name="enabled"
            id="enabled"
            checked={formData.enabled}
            onChange={handleChange}
            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 dark:border-gray-600 rounded"
          />
          <label htmlFor="enabled" className="ml-2 block text-sm">
            Habilitada
          </label>
        </div>
        <div className="flex items-center">
          <input
            type="checkbox"
            name="has_refuge"
            id="has_refuge"
            checked={formData.has_refuge}
            onChange={handleChange}
            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 dark:border-gray-600 rounded"
          />
          <label htmlFor="has_refuge" className="ml-2 block text-sm">
            Tiene Refugio
          </label>
        </div>
      </div>

      <div>
        <label htmlFor="observations" className="block text-sm font-medium">
          Observaciones
        </label>
        <textarea
          name="observations"
          id="observations"
          value={formData.observations}
          onChange={handleChange}
          rows="2"
          className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm sm:text-sm bg-white dark:bg-gray-700"
        ></textarea>
      </div>

      <div className="flex justify-end space-x-3 pt-3">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-600 border border-gray-300 dark:border-gray-500 rounded-md shadow-sm hover:bg-gray-50 dark:hover:bg-gray-500"
        >
          Cancelar
        </button>
        {mode === "edit" && initialData?.id && onDelete && (
          <button
            type="button"
            onClick={() => onDelete(initialData.id)}
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 border border-transparent rounded-md shadow-sm"
          >
            Eliminar
          </button>
        )}
        <button
          type="submit"
          className="px-4 py-2 text-sm font-medium text-white bg-slate-700 hover:bg-slate-800 dark:bg-slate-600 dark:hover:bg-slate-700 border border-transparent rounded-md shadow-sm"
        >
          {mode === "add" ? "Guardar Parada" : "Guardar Cambios"}
        </button>
      </div>
    </form>
  )
}
