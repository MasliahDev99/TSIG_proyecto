"use client"

import { useState, useEffect, useRef } from "react"
import axios from "axios"

export default function StopForm({ mode, initialData, onSubmit, onCancel, onDelete }) {
  const [formData, setFormData] = useState({
    name: "",
    route_info: "",
    department: "",
    direction: "",
    enabled: true,
    has_refuge: false,
    observations: "",
    lat: "",
    lng: "",
    ciudad: "", // Agregar campo ciudad
  })
  const [errors, setErrors] = useState({})
  const [isLoading, setIsLoading] = useState(false)
  const submitTimeoutRef = useRef(null)
  const hasSubmittedRef = useRef(false)

  useEffect(() => {
    if (mode === "edit" && initialData) {
      console.log("🔍 [StopForm] Datos iniciales para edición:", initialData)
      setFormData({
        name: initialData.nombre || "",
        route_info: initialData.ruta_km || initialData.ruta || "",
        department: initialData.departamento || "",
        direction: initialData.sentido || "",
        enabled: initialData.habilitada ?? initialData.activa ?? initialData.estado ?? true,
        has_refuge: initialData.refugio ?? false,
        observations: initialData.observaciones || "",
        lat: initialData.lat ? String(initialData.lat) : "",
        lng: initialData.lng ? String(initialData.lng) : "",
        ciudad: initialData.ciudad || "", // Manejar el campo ciudad en edición
      })
    } else if (mode === "add" && initialData) {
      // Para agregar, usar las coordenadas UTM directamente sin transformar
      let latUTM = ""
      let lngUTM = ""

      if (initialData.lat && initialData.lng) {
        latUTM = String(initialData.lat)
        lngUTM = String(initialData.lng)
      }

      setFormData({
        name: "",
        route_info: "",
        department: initialData.detectedDepartment || "", // Usar departamento detectado automáticamente
        direction: "",
        enabled: true, // Siempre habilitada por defecto al crear
        has_refuge: false,
        observations: "",
        lat: latUTM,
        lng: lngUTM,
        ciudad: initialData.detectedCity || "", // Manejar el campo ciudad desde initialData.detectedCity
      })
    }

    // Reset submission flag when form data changes
    hasSubmittedRef.current = false
  }, [mode, initialData])

  useEffect(() => {
    const handleUpdateCoordinates = (event) => {
      const { lat, lng, detectedDepartment, detectedCity } = event.detail
      setFormData((prev) => ({
        ...prev,
        lat,
        lng,
        // Actualizar departamento y ciudad si se proporcionan
        ...(detectedDepartment !== undefined && { department: detectedDepartment || "" }),
        ...(detectedCity !== undefined && { ciudad: detectedCity || "Sin ciudad" }),
      }))
    }

    const handleEndEdit = () => {
      cleanupEditMode()
    }

    window.addEventListener("update-stop-coordinates", handleUpdateCoordinates)
    window.addEventListener("end-edit-stop-location", handleEndEdit)

    return () => {
      window.removeEventListener("update-stop-coordinates", handleUpdateCoordinates)
      window.removeEventListener("end-edit-stop-location", handleEndEdit)
      if (submitTimeoutRef.current) {
        clearTimeout(submitTimeoutRef.current)
      }
      // Cleanup when component unmounts
      cleanupEditMode()
    }
  }, [])

  const cleanupEditMode = () => {
    if (window.mapInstanceRef?.current) {
      const map = window.mapInstanceRef.current

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
    if (!formData.lat || isNaN(Number.parseFloat(formData.lat))) newErrors.lat = "Coordenada Y (latitud UTM) inválida."
    if (!formData.lng || isNaN(Number.parseFloat(formData.lng))) newErrors.lng = "Coordenada X (longitud UTM) inválida."

    const lat = Number.parseFloat(formData.lat)
    const lng = Number.parseFloat(formData.lng)

    // Validación para coordenadas UTM zona 21S (Uruguay)
    if (lat < 2800000 || lat > 8250000)
      newErrors.lat = "La coordenada Y (latitud UTM) debe estar entre 6.100.000 y 6.250.000."
    if (lng < 100000 || lng > 900000)
      newErrors.lng = "La coordenada X (longitud UTM) debe estar entre 500.000 y 700.000."

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    e.stopPropagation()

    // Obtener el ID de la parada de manera más flexible
    const stopId = initialData?.id_parada || initialData?.id

    console.log("🚀 [StopForm] handleSubmit called", {
      mode,
      isLoading,
      hasSubmitted: hasSubmittedRef.current,
      initialData: initialData,
      stopId: stopId,
    })

    // Múltiples verificaciones para prevenir envíos duplicados
    if (isLoading || hasSubmittedRef.current) {
      console.log("⛔ Submission blocked - already processing")
      return
    }

    if (!validate()) return

    // Marcar como enviado inmediatamente
    hasSubmittedRef.current = true
    setIsLoading(true)

    // Cleanup edit mode before submitting
    cleanupEditMode()

    // Debounce adicional
    if (submitTimeoutRef.current) {
      clearTimeout(submitTimeoutRef.current)
    }

    submitTimeoutRef.current = setTimeout(async () => {
      try {
        // Usar las coordenadas UTM directamente sin transformar
        const latUTM = Number.parseFloat(formData.lat)
        const lngUTM = Number.parseFloat(formData.lng)

        // Mapear los campos del frontend a los nombres esperados por el backend
        const dataToSubmit = {
          nombre: formData.name,
          ruta: formData.route_info,
          departamento: formData.department,
          sentido: formData.direction,
          habilitada: formData.enabled,
          refugio: formData.has_refuge,
          observaciones: formData.observations,
          latitud: latUTM, // Coordenada Y en UTM
          longitud: lngUTM, // Coordenada X en UTM
          ciudad: formData.ciudad || "Sin ciudad",
        }

        console.log("📤 [StopForm] Campo habilitada:", formData.enabled, typeof formData.enabled)
        console.log("📤 [StopForm] Datos completos enviados al backend:", dataToSubmit)
        console.log("📤 [StopForm] departamento:", dataToSubmit.departamento)
        console.log("📤 [StopForm] ciudad:", dataToSubmit.ciudad)

        let response
        if (mode === "add") {
          console.log("➕ Making POST request to create stop")
          response = await axios.post("http://localhost:8081/api/paradas/crear", dataToSubmit, {
            headers: { "Content-Type": "application/json" },
            withCredentials: true,
          })
        } else if (mode === "edit" && stopId) {
          console.log(`✏️ Making PUT request to edit stop with ID: ${stopId}`)
          console.log(`🔗 URL: http://localhost:8081/api/paradas/editar/${stopId}`)

          response = await axios.put(`http://localhost:8081/api/paradas/editar/${stopId}`, dataToSubmit, {
            headers: { "Content-Type": "application/json" },
            withCredentials: true,
          })
        } else {
          throw new Error(
            `Modo de edición sin ID de parada válido. stopId: ${stopId}, initialData: ${JSON.stringify(initialData)}`,
          )
        }

        console.log("✅ [StopForm] Backend response:", response)

        // Verificar que la respuesta sea exitosa
        if (response && response.status >= 200 && response.status < 300) {
          if (onSubmit) {
            onSubmit(response.data || { success: true })
          }
        } else {
          throw new Error("Respuesta del servidor no exitosa")
        }
      } catch (error) {
        console.error("❌ [StopForm] Error al guardar la parada:", error)
        console.error("🔍 Error details:", {
          message: error.message,
          response: error.response?.data,
          status: error.response?.status,
          url: error.config?.url,
          method: error.config?.method,
        })

        // Mostrar error más específico
        let errorMessage = "Error al guardar la parada. Intente nuevamente."
        if (error.response?.data) {
          errorMessage =
            typeof error.response.data === "string" ? error.response.data : error.response.data.message || errorMessage
        }

        setErrors({ submit: errorMessage })
        hasSubmittedRef.current = false // Reset on error
      } finally {
        setIsLoading(false)
      }
    }, 100) // 100ms debounce
  }

  const handleUpdateCoordsClick = () => {
    // Verificar si la parada es modificable
    if (mode === "edit" && initialData?.no_modificable === true) {
      alert("❌ La ubicación de la parada no puede modificarse ya que es destino o partida de por lo menos una línea.")
      return
    }

    const stopId = initialData?.id_parada || initialData?.id
    const event = new CustomEvent("start-edit-stop-location", {
      detail: {
        lat: formData.lat,
        lng: formData.lng,
        id: stopId,
      },
    })
    window.dispatchEvent(event)
  }

  const handleCancel = () => {
    // Cleanup edit mode when canceling
    cleanupEditMode()

    // Reset form state
    hasSubmittedRef.current = false
    setIsLoading(false)
    setErrors({})

    // Call parent cancel handler
    if (onCancel) {
      onCancel()
    }
  }

  const handleDelete = async () => {
    // Verificar si la parada es modificable
    if (initialData?.no_modificable === true) {
      alert("❌ No se puede eliminar, es la partida o destino de por lo menos una línea.")
      return
    }

    if (!window.confirm("¿Está seguro de que desea eliminar esta parada?")) return

    setIsLoading(true)
    try {
      // Obtener el ID de manera más flexible
      const stopId = initialData?.id_parada || initialData?.id

      if (!stopId) {
        throw new Error("ID de parada no disponible para eliminar")
      }

      console.log("🗑️ [StopForm] Eliminando parada con ID:", stopId)

      // Realizar la solicitud DELETE al backend
      const response = await axios.delete(`http://localhost:8081/api/paradas/eliminar/${stopId}`, {
        withCredentials: true,
      })

      console.log("✅ [StopForm] Respuesta de eliminación:", response)

      // Cleanup edit mode before deleting
      cleanupEditMode()

      // Verificar que la respuesta sea exitosa
      if (response && response.status >= 200 && response.status < 300) {
        if (onDelete) {
          onDelete(stopId)
        }
      } else {
        throw new Error("Error al eliminar la parada: respuesta no exitosa")
      }
    } catch (error) {
      console.error("❌ [StopForm] Error al eliminar la parada:", error)
      setErrors({ submit: "Error al eliminar la parada. Intente nuevamente." })
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="p-4 space-y-4 max-h-[70vh] overflow-y-auto">
      <h3 className="text-lg font-semibold mb-3 text-center">
        {mode === "add" ? "Añadir Nueva Parada" : "Editar Parada"}
      </h3>

      {errors.submit && <div className="p-3 text-sm text-red-700 bg-red-100 rounded-lg">{errors.submit}</div>}

      <div>
        <label htmlFor="name" className="block text-sm font-medium">
          Nombre *
        </label>
        <input
          type="text"
          name="name"
          id="name"
          value={formData.name}
          onChange={handleChange}
          className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm sm:text-sm ${
            errors.name ? "border-red-500" : "border-gray-300"
          } bg-white text-black`}
          disabled={isLoading}
        />
        {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label htmlFor="lat" className="block text-sm font-medium">
            Coordenada Y (UTM) *
          </label>
          <input
            type="number"
            step="any"
            name="lat"
            id="lat"
            value={formData.lat}
            onChange={handleChange}
            readOnly={mode === "edit"}
            className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm sm:text-sm ${
              errors.lat ? "border-red-500" : "border-gray-300"
            } ${mode === "edit" ? "bg-gray-100" : "bg-white"} text-black`}
            disabled={isLoading}
            placeholder="ej: 6140000"
          />
          {errors.lat && <p className="text-xs text-red-500 mt-1">{errors.lat}</p>}
        </div>
        <div>
          <label htmlFor="lng" className="block text-sm font-medium">
            Coordenada X (UTM) *
          </label>
          <input
            type="number"
            step="any"
            name="lng"
            id="lng"
            value={formData.lng}
            onChange={handleChange}
            readOnly={mode === "edit"}
            className={`mt-1 block w-full px-3 py-2 border rounded-md shadow-sm sm:text-sm ${
              errors.lng ? "border-red-500" : "border-gray-300"
            } ${mode === "edit" ? "bg-gray-100" : "bg-white"} text-black`}
            disabled={isLoading}
            placeholder="ej: 580000"
          />
          {errors.lng && <p className="text-xs text-red-500 mt-1">{errors.lng}</p>}
        </div>
      </div>

      {mode === "edit" && (
        <button
          type="button"
          onClick={handleUpdateCoordsClick}
          className="text-sm text-blue-500 hover:underline"
          disabled={isLoading || initialData?.no_modificable === true}
        >
          Cambiar ubicación en el mapa
        </button>
      )}

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
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm sm:text-sm bg-white text-black"
          disabled={isLoading}
        />
      </div>

      <div>
        <label htmlFor="direction" className="block text-sm font-medium">
          Sentido
        </label>
        <select
          name="direction"
          id="direction"
          value={formData.direction}
          onChange={handleChange}
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm sm:text-sm bg-white text-black"
          disabled={isLoading}
        >
          <option value="">Seleccionar sentido</option>
          <option value="Norte">Norte</option>
          <option value="Sur">Sur</option>
          <option value="Este">Este</option>
          <option value="Oeste">Oeste</option>
          <option value="Ida">Ida</option>
          <option value="Vuelta">Vuelta</option>
          <option value="Ambos">Ambos</option>
        </select>
      </div>

      <div>
        <label htmlFor="ciudad" className="block text-sm font-medium">
          Ciudad
        </label>
        <input
          type="text"
          name="ciudad"
          id="ciudad"
          value={formData.ciudad}
          readOnly
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm sm:text-sm bg-gray-100 text-black"
          disabled={isLoading}
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
          readOnly
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm sm:text-sm bg-gray-100 text-black"
          disabled={isLoading}
        />
      </div>

      <div className="flex items-center space-x-4 pt-2">
        {/* Solo mostrar el checkbox de habilitada en modo edición */}
        {mode === "edit" && (
          <div className="flex items-center">
            <input
              type="checkbox"
              name="enabled"
              id="enabled"
              checked={formData.enabled}
              onChange={handleChange}
              className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              disabled={isLoading || initialData?.no_modificable === true}
            />
            <label htmlFor="enabled" className="ml-2 block text-sm">
              Habilitada
              {initialData?.no_modificable === true && (
                <span className="text-xs text-orange-600 ml-1">(No modificable)</span>
              )}
            </label>
          </div>
        )}

        {/* Mostrar información del estado en modo creación */}
        {mode === "add" && (
          <div className="flex items-center">
            <span className="text-sm text-gray-600">
              Estado: <span className="font-medium text-green-600">Habilitada (por defecto)</span>
            </span>
          </div>
        )}

        <div className="flex items-center">
          <input
            type="checkbox"
            name="has_refuge"
            id="has_refuge"
            checked={formData.has_refuge}
            onChange={handleChange}
            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
            disabled={isLoading}
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
          rows="3"
          className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm sm:text-sm bg-white text-black"
          disabled={isLoading}
        ></textarea>
      </div>

      {mode === "edit" && initialData?.no_modificable === true && (
        <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
          <div className="flex items-center">
            <svg className="h-5 w-5 text-yellow-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
              <path
                fillRule="evenodd"
                d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
            <span className="text-sm font-medium text-yellow-800">
              Esta parada es destino o partida de por lo menos una línea
            </span>
          </div>
          <p className="text-xs text-yellow-700 mt-1">
            No se puede cambiar la ubicación, el estado ni eliminar esta parada ya que es destino o partida de líneas.
          </p>
        </div>
      )}

      <div className="flex justify-end space-x-3 pt-3">
        <button
          type="button"
          onClick={handleCancel}
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md shadow-sm hover:bg-gray-50"
          disabled={isLoading}
        >
          Cancelar
        </button>
        {mode === "edit" && (initialData?.id_parada || initialData?.id) && onDelete && (
          <button
            type="button"
            onClick={handleDelete}
            className="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 border border-transparent rounded-md shadow-sm"
            disabled={isLoading}
          >
            {isLoading ? "Eliminando..." : "Eliminar"}
          </button>
        )}
        <button
          type="submit"
          className="px-4 py-2 text-sm font-medium text-white bg-slate-700 hover:bg-slate-800 border border-transparent rounded-md shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
          disabled={isLoading || hasSubmittedRef.current}
        >
          {isLoading ? "Guardando..." : mode === "add" ? "Guardar Parada" : "Guardar Cambios"}
        </button>
      </div>
    </form>
  )
}
