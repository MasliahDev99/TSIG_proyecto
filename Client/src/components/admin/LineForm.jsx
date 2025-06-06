"use client"

import { useState, useEffect } from "react"
import axios from "axios"

export default function LineForm({ mode, initialData, onSubmit, onCancel, onDelete }) {
  const [formData, setFormData] = useState({
    descripcion: "",
    empresa: "",
    origen: "",
    destino: "",
    activa: true,
    observaciones: "",
    frecuencia: "",
    horario: "",
    tarifa: "",
  })
  const [selectedStops, setSelectedStops] = useState([])
  const [routeCoordinates, setRouteCoordinates] = useState([])
  const [errors, setErrors] = useState({})
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (initialData) {
      if (mode === "edit-line" && initialData) {
        setFormData({
          descripcion: initialData.nombre_linea || initialData.descripcion || "",
          empresa: initialData.empresa || "",
          origen: initialData.origen || "",
          destino: initialData.destino || "",
          activa: typeof initialData.activa === "boolean" ? initialData.activa : true,
          observaciones: initialData.observaciones || "",
          frecuencia: initialData.frecuencia || "",
          horario: initialData.horario_operacion || initialData.horario || "",
          tarifa: initialData.tarifa || "",
        })
      } else if (mode === "add-line") {
        // Para crear línea nueva
        if (initialData.stops && initialData.stops.length > 0) {
          // Extraer solo los IDs de las paradas
          const stops = initialData.stops.map((stop) => ({ id: stop.id }))
          setSelectedStops(stops)

          // Si hay paradas, usar la primera como origen y la última como destino
          setFormData((prev) => ({
            ...prev,
            origen: initialData.stops[0].name || "",
            destino: initialData.stops[initialData.stops.length - 1].name || "",
          }))
        }

        // Extraer todas las coordenadas para el recorrido (paradas + puntos de ruta)
        if (initialData.allPoints && initialData.allPoints.length > 0) {
          const coordinates = initialData.allPoints.map((point) => point.coordinates)
          setRouteCoordinates(coordinates)
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
    if (!formData.descripcion.trim()) newErrors.descripcion = "La descripción de la línea es requerida."
    if (!formData.empresa.trim()) newErrors.empresa = "La empresa es requerida."
    if (mode === "add-line" && selectedStops.length < 2) newErrors.stops = "Debe seleccionar al menos 2 paradas."
    if (mode === "add-line" && routeCoordinates.length < 2)
      newErrors.route = "El recorrido debe tener al menos 2 puntos."

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return

    setIsLoading(true)

    try {
      // Preparar los datos en el formato requerido por el backend
      const dataToSubmit = {
        descripcion: formData.descripcion,
        empresa: formData.empresa,
        origen: formData.origen,
        destino: formData.destino,
        activa: formData.activa,
        observaciones: formData.observaciones,
        frecuencia: formData.frecuencia,
        horario: formData.horario,
        tarifa: formData.tarifa,
        // Formato GeoJSON para el recorrido
        recorrido: {
          type: "LineString",
          coordinates: routeCoordinates,
        },
        // Array de objetos con los IDs de las paradas
        paradas: selectedStops,
      }

      console.log("Enviando datos de línea al backend:", dataToSubmit)

      let response
      if (mode === "add-line") {
        response = await axios.post("http://localhost:8081/api/lineas/crear", dataToSubmit, {
          headers: { "Content-Type": "application/json" },
          withCredentials: true,
        })
      } else if (mode === "edit-line" && initialData?.id_linea) {
        response = await axios.put(`http://localhost:8081/api/lineas/editar/${initialData.id_linea}`, dataToSubmit, {
          headers: { "Content-Type": "application/json" },
          withCredentials: true,
        })
      }

      if (response && response.data && onSubmit) {
        onSubmit(response.data)
      }
    } catch (error) {
      console.error("Error al guardar la línea:", error)
      setErrors({ submit: "Error al guardar la línea. Intente nuevamente." })
    } finally {
      setIsLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!window.confirm("¿Está seguro de que desea eliminar esta línea?")) return

    setIsLoading(true)
    try {
      await axios.delete(`http://localhost:8081/api/lineas/eliminar/${initialData.id_linea}`, {
        withCredentials: true,
      })
      if (onDelete) {
        onDelete(initialData.id_linea)
      }
    } catch (error) {
      console.error("Error al eliminar la línea:", error)
      setErrors({ submit: "Error al eliminar la línea. Intente nuevamente." })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="p-4 space-y-3 max-h-[70vh] overflow-y-auto">
      <h3 className="text-lg font-semibold mb-2 text-center">
        {mode === "add-line" ? "Añadir Nueva Línea" : "Editar Línea"}
      </h3>

      {errors.submit && <div className="p-3 text-sm text-red-700 bg-red-100 rounded-lg">{errors.submit}</div>}

      <div>
        <label htmlFor="descripcion" className="block text-sm font-medium">
          Descripción de Línea *
        </label>
        <input
          type="text"
          name="descripcion"
          id="descripcion"
          value={formData.descripcion}
          onChange={handleChange}
          className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm sm:text-sm ${
            errors.descripcion ? "border-red-500" : "border-gray-300"
          } bg-white text-black`}
          disabled={isLoading}
          placeholder="Ej: Línea 102"
        />
        {errors.descripcion && <p className="text-xs text-red-500 mt-1">{errors.descripcion}</p>}
      </div>

      {mode === "add-line" && (
        <div>
          <label className="block text-sm font-medium">Paradas Seleccionadas ({selectedStops.length}) *</label>
          {selectedStops.length > 0 ? (
            <ul className="mt-1 list-decimal list-inside text-xs max-h-20 overflow-y-auto bg-gray-50 p-2 rounded">
              {selectedStops.map((stop, index) => (
                <li key={stop.id || index}>ID: {stop.id}</li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-gray-500 mt-1">Ninguna parada seleccionada.</p>
          )}
          {errors.stops && <p className="text-xs text-red-500 mt-1">{errors.stops}</p>}
        </div>
      )}

      {mode === "add-line" && (
        <div>
          <label className="block text-sm font-medium">Puntos de Recorrido ({routeCoordinates.length}) *</label>
          {routeCoordinates.length > 0 ? (
            <div className="mt-1 text-xs max-h-20 overflow-y-auto bg-gray-50 p-2 rounded">
              <p className="text-xs text-gray-600">El recorrido incluye {routeCoordinates.length} puntos en total.</p>
            </div>
          ) : (
            <p className="text-xs text-gray-500 mt-1">Ningún punto de recorrido definido.</p>
          )}
          {errors.route && <p className="text-xs text-red-500 mt-1">{errors.route}</p>}
        </div>
      )}

      <div>
        <label htmlFor="empresa" className="block text-sm font-medium">
          Empresa *
        </label>
        <select
          name="empresa"
          id="empresa"
          value={formData.empresa}
          onChange={handleChange}
          className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm sm:text-sm ${
            errors.empresa ? "border-red-500" : "border-gray-300"
          } bg-white text-black`}
          disabled={isLoading}
        >
          <option value="">Seleccionar empresa</option>
          <option value="CUTCSA">CUTCSA</option>
          <option value="COPSA">COPSA</option>
          <option value="UCOT">UCOT</option>
          <option value="COETC">COETC</option>
          <option value="COME">COME</option>
          <option value="Otra">Otra</option>
        </select>
        {errors.empresa && <p className="text-xs text-red-500 mt-1">{errors.empresa}</p>}
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="origen" className="block text-sm font-medium">
            Origen
          </label>
          <input
            type="text"
            name="origen"
            id="origen"
            value={formData.origen}
            onChange={handleChange}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm sm:text-sm bg-white text-black"
            placeholder="Ej: Terminal Tres Cruces"
            disabled={isLoading}
          />
        </div>
        <div>
          <label htmlFor="destino" className="block text-sm font-medium">
            Destino
          </label>
          <input
            type="text"
            name="destino"
            id="destino"
            value={formData.destino}
            onChange={handleChange}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm sm:text-sm bg-white text-black"
            placeholder="Ej: Plaza Artigas, Pando"
            disabled={isLoading}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="frecuencia" className="block text-sm font-medium">
            Frecuencia (min)
          </label>
          <input
            type="number"
            name="frecuencia"
            id="frecuencia"
            value={formData.frecuencia}
            onChange={handleChange}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm sm:text-sm bg-white text-black"
            placeholder="15"
            disabled={isLoading}
          />
        </div>
        <div>
          <label htmlFor="tarifa" className="block text-sm font-medium">
            Tarifa ($)
          </label>
          <input
            type="number"
            step="0.01"
            name="tarifa"
            id="tarifa"
            value={formData.tarifa}
            onChange={handleChange}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm sm:text-sm bg-white text-black"
            placeholder="45.00"
            disabled={isLoading}
          />
        </div>
      </div>

      <div>
        <label htmlFor="horario" className="block text-sm font-medium">
          Horario de Operación
        </label>
        <input
          type="text"
          name="horario"
          id="horario"
          value={formData.horario}
          onChange={handleChange}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm sm:text-sm bg-white text-black"
          placeholder="06:00 - 22:00"
          disabled={isLoading}
        />
      </div>

      <div className="flex items-center pt-2">
        <input
          type="checkbox"
          name="activa"
          id="line_enabled"
          checked={formData.activa}
          onChange={handleChange}
          className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
          disabled={isLoading}
        />
        <label htmlFor="line_enabled" className="ml-2 block text-sm">
          Habilitada
        </label>
      </div>

      <div>
        <label htmlFor="observaciones" className="block text-sm font-medium">
          Observaciones
        </label>
        <textarea
          name="observaciones"
          id="line_observations"
          value={formData.observaciones}
          onChange={handleChange}
          rows="2"
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm sm:text-sm bg-white text-black"
          disabled={isLoading}
        ></textarea>
      </div>

      <div className="flex justify-end space-x-3 pt-2">
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50"
          disabled={isLoading}
        >
          Cancelar
        </button>
        {mode === "edit-line" && initialData?.id_linea && onDelete && (
          <button
            type="button"
            onClick={handleDelete}
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 border border-transparent rounded-md shadow-sm"
            disabled={isLoading}
          >
            {isLoading ? "Eliminando..." : "Eliminar Línea"}
          </button>
        )}
        <button
          type="submit"
          className="px-4 py-2 text-sm font-medium text-white bg-slate-700 hover:bg-slate-800 border border-transparent rounded-md shadow-sm"
          disabled={isLoading}
        >
          {isLoading ? "Guardando..." : mode === "add-line" ? "Guardar Línea" : "Guardar Cambios"}
        </button>
      </div>
    </form>
  )
}
