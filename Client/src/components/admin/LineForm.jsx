"use client"

import { useState, useEffect } from "react"
import axios from "axios"

export default function LineForm({ mode, initialData, onSubmit, onCancel, onDelete }) {
  const [formData, setFormData] = useState({
    descripcion: "",
    empresa: "",
    DeptoOrigen: "", // Cambiar de depto_origen
    DeptoDestino: "", // Cambiar de depto_destino
    CiudadOrigen: "", // Cambiar de ciudad_origen
    CiudadDestino: "", // Cambiar de ciudad_destino
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
  const [isLinkingMode, setIsLinkingMode] = useState(false)

  useEffect(() => {
    if (initialData) {
      if (mode === "edit-line" && initialData) {
        setFormData({
          descripcion: initialData.nombre_linea || initialData.descripcion || "",
          empresa: initialData.empresa || "",
          DeptoOrigen: initialData.DeptoOrigen || initialData.originDepartment || "",
          DeptoDestino: initialData.DeptoDestino || initialData.destinationDepartment || "",
          CiudadOrigen: initialData.CiudadOrigen || initialData.originCity || "",
          CiudadDestino: initialData.CiudadDestino || initialData.destinationCity || "",
          activa: typeof initialData.activa === "boolean" ? initialData.activa : true,
          observaciones: initialData.observaciones || "",
          frecuencia: initialData.frecuencia || "",
          horario: initialData.horario_operacion || initialData.horario || "",
          tarifa: initialData.tarifa || "",
        })

        // Cargar el recorrido existente para edición
        if (initialData.geometry && initialData.geometry.coordinates) {
          const coordinates = initialData.geometry.coordinates
          setRouteCoordinates(coordinates)
        }

        // Cargar las paradas asociadas (esto requeriría una consulta al backend)
        // Por ahora, inicializar como array vacío
        setSelectedStops([])
      } else if (mode === "add-line" || mode === "add-line-routing") {
        // Para crear línea nueva (manual o con routing)
        if (initialData.stops && initialData.stops.length > 0) {
          // Extraer solo los IDs de las paradas
          const stops = initialData.stops.map((stop) => ({ id: stop.id }))
          setSelectedStops(stops)
        }

        // Usar los departamentos y ciudades detectados automáticamente
        const origenText = initialData.originDepartment || ""
        const destinoText = initialData.destinationDepartment || ""
        const origenCityText = initialData.originCity || "Sin ciudad"
        const destinoCityText = initialData.destinationCity || "Sin ciudad"

        console.log("🏛️ Configurando origen y destino en LineForm:")
        console.log("- Origen:", origenText, "Ciudad:", origenCityText)
        console.log("- Destino:", destinoText, "Ciudad:", destinoCityText)
        console.log("- Modo:", mode)
        console.log("- Es routing mode:", initialData.isRoutingMode)

        setFormData((prev) => ({
          ...prev,
          DeptoOrigen: origenText,
          DeptoDestino: destinoText,
          CiudadOrigen: origenCityText,
          CiudadDestino: destinoCityText,
        }))

        // Para routing automático, usar las coordenadas de la ruta calculada
        if (mode === "add-line-routing" || initialData.isRoutingMode) {
          if (initialData.routeCoordinates) {
            console.log("🛣️ Configurando ruta automática:", initialData.routeCoordinates.length, "puntos")
            setRouteCoordinates(initialData.routeCoordinates)
          }
        } else if (initialData.allPoints && initialData.allPoints.length > 0) {
          // Para línea manual, extraer coordenadas de todos los puntos
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
    if ((mode === "add-line" || mode === "add-line-routing") && selectedStops.length < 1)
      newErrors.stops = "Debe vincular al menos 1 parada."
    if ((mode === "add-line" || mode === "add-line-routing") && routeCoordinates.length < 2)
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
        deptoOrigen: formData.DeptoOrigen || null, // Cambiar de DeptoOrigen a deptoOrigen
        deptoDestino: formData.DeptoDestino || null, // Cambiar de DeptoDestino a deptoDestino
        ciudadOrigen: formData.CiudadOrigen || "Sin ciudad", // Cambiar de CiudadOrigen a ciudadOrigen
        ciudadDestino: formData.CiudadDestino || "Sin ciudad", // Cambiar de CiudadDestino a ciudadDestino
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

      console.log("📤 [LineForm] Datos completos enviados al backend:", dataToSubmit)
      console.log("📤 [LineForm] deptoOrigen:", dataToSubmit.deptoOrigen)
      console.log("📤 [LineForm] deptoDestino:", dataToSubmit.deptoDestino)
      console.log("📤 [LineForm] ciudadOrigen:", dataToSubmit.ciudadOrigen)
      console.log("📤 [LineForm] ciudadDestino:", dataToSubmit.ciudadDestino)

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

  // Escuchar actualizaciones del recorrido desde el mapa
  useEffect(() => {
    const handleRouteUpdate = (event) => {
      const { coordinates } = event.detail
      setRouteCoordinates(coordinates)
    }

    const handleStopsUpdate = (event) => {
      const { stops } = event.detail
      setSelectedStops(stops)
    }

    window.addEventListener("update-line-route", handleRouteUpdate)
    window.addEventListener("update-line-stops", handleStopsUpdate)

    return () => {
      window.removeEventListener("update-line-route", handleRouteUpdate)
      window.removeEventListener("update-line-stops", handleStopsUpdate)
    }
  }, [])

  // Cleanup al desmontar
  useEffect(() => {
    return () => {
      window.dispatchEvent(new CustomEvent("end-edit-line-route"))
    }
  }, [])

  // Escuchar actualizaciones del recorrido desde el mapa
  useEffect(() => {
    const handleRouteUpdate = (event) => {
      const { coordinates, lineId } = event.detail

      // Solo actualizar si es la línea que estamos editando
      if (mode === "edit-line" && initialData?.id_linea && lineId === initialData.id_linea) {
        console.log("📍 Actualizando coordenadas del recorrido:", coordinates.length, "puntos")
        setRouteCoordinates(coordinates)
      } else if (mode === "add-line") {
        // Para líneas nuevas, actualizar siempre
        setRouteCoordinates(coordinates)
      }
    }

    const handleStopsUpdate = (event) => {
      const { stops } = event.detail
      setSelectedStops(stops)
    }

    window.addEventListener("update-line-route", handleRouteUpdate)
    window.addEventListener("update-line-stops", handleStopsUpdate)

    return () => {
      window.removeEventListener("update-line-route", handleRouteUpdate)
      window.removeEventListener("update-line-stops", handleStopsUpdate)
    }
  }, [mode, initialData, setRouteCoordinates, setSelectedStops])

  // Agregar este useEffect para debug
  useEffect(() => {
    console.log("🔍 LineForm - routeCoordinates actualizadas:", routeCoordinates.length, "puntos")
    if (routeCoordinates.length > 0) {
      console.log("📍 Primeras 3 coordenadas:", routeCoordinates.slice(0, 3))
    }
  }, [routeCoordinates])

  // Escuchar actualizaciones de paradas vinculadas para routing
  useEffect(() => {
    const handleStopsUpdate = (event) => {
      const { stops } = event.detail
      if (mode === "add-line-routing") {
        console.log("🔗 Actualizando paradas vinculadas:", stops.length)
        setSelectedStops(stops.map((stop) => ({ id: stop.id })))
      }
    }

    window.addEventListener("update-routing-line-stops", handleStopsUpdate)

    return () => {
      window.removeEventListener("update-routing-line-stops", handleStopsUpdate)
    }
  }, [mode])

  // Escuchar eventos de vinculación de paradas
  useEffect(() => {
    const handleLinkStop = (event) => {
      const { stopId, stopData, distance } = event.detail

      console.log("🔗 Vinculando parada:", stopId, "distancia:", distance.toFixed(2), "m")

      // Verificar si la parada ya está vinculada
      const isAlreadyLinked = selectedStops.some((stop) => stop.id === stopId)

      if (isAlreadyLinked) {
        console.log("⚠️ La parada ya está vinculada")
        return
      }

      // Agregar parada a la lista
      const newStop = { id: stopId }
      const updatedStops = [...selectedStops, newStop]
      setSelectedStops(updatedStops)

      console.log("✅ Parada vinculada exitosamente. Total:", updatedStops.length)
    }

    window.addEventListener("link-stop-to-line", handleLinkStop)

    return () => {
      window.removeEventListener("link-stop-to-line", handleLinkStop)
    }
  }, [selectedStops])

  return (
    <form onSubmit={handleSubmit} className="p-4 space-y-3 max-h-[70vh] overflow-y-auto">
      <h3 className="text-lg font-semibold mb-2 text-center">
        {mode === "add-line"
          ? "Añadir Nueva Línea (Manual)"
          : mode === "add-line-routing"
            ? "Añadir Nueva Línea (Automática)"
            : "Editar Línea"}
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

      {mode === "add-line-routing" && (
        <div>
          <label className="block text-sm font-medium">Ruta Calculada ({routeCoordinates.length} puntos)</label>
          <div className="mt-1 text-xs bg-blue-50 p-3 rounded border border-blue-200">
            <p className="text-blue-800 mb-2">✅ Ruta calculada automáticamente</p>
            <p className="text-blue-700 text-xs">
              La ruta sigue el camino más corto entre los puntos seleccionados. Haga clic en paradas del mapa para
              vincularlas a esta línea.
            </p>
          </div>
        </div>
      )}

      {mode === "add-line-routing" && (
        <div>
          <label className="block text-sm font-medium">Paradas Vinculadas ({selectedStops.length})</label>
          {selectedStops.length > 0 ? (
            <ul className="mt-1 list-decimal list-inside text-xs max-h-20 overflow-y-auto bg-gray-50 p-2 rounded">
              {selectedStops.map((stop, index) => (
                <li key={stop.id || index}>ID: {stop.id}</li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-gray-500 mt-1">
              Ninguna parada vinculada. Haga clic en paradas del mapa para vincularlas.
            </p>
          )}
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
          <label htmlFor="DeptoOrigen" className="block text-sm font-medium">
            Departamento Origen
          </label>
          <input
            type="text"
            name="DeptoOrigen"
            id="DeptoOrigen"
            value={formData.DeptoOrigen}
            onChange={handleChange}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm sm:text-sm bg-white text-black"
            placeholder="Ej: Montevideo"
            disabled={isLoading}
          />
        </div>
        <div>
          <label htmlFor="DeptoDestino" className="block text-sm font-medium">
            Departamento Destino
          </label>
          <input
            type="text"
            name="DeptoDestino"
            id="DeptoDestino"
            value={formData.DeptoDestino}
            onChange={handleChange}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm sm:text-sm bg-white text-black"
            placeholder="Ej: Canelones"
            disabled={isLoading}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label htmlFor="CiudadOrigen" className="block text-sm font-medium">
            Ciudad Origen
          </label>
          <input
            type="text"
            name="CiudadOrigen"
            id="CiudadOrigen"
            value={formData.CiudadOrigen}
            onChange={handleChange}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm sm:text-sm bg-white text-black"
            placeholder="Ej: Montevideo"
            disabled={isLoading}
          />
        </div>
        <div>
          <label htmlFor="CiudadDestino" className="block text-sm font-medium">
            Ciudad Destino
          </label>
          <input
            type="text"
            name="CiudadDestino"
            id="CiudadDestino"
            value={formData.CiudadDestino}
            onChange={handleChange}
            className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm sm:text-sm bg-white text-black"
            placeholder="Ej: Las Piedras"
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

      {mode === "edit-line" && (
        <div>
          <label className="block text-sm font-medium mb-2">Recorrido Actual</label>
          <div className="mt-1 text-xs bg-gray-50 p-3 rounded border">
            <p className="text-gray-600 mb-2">Puntos en el recorrido: {routeCoordinates.length}</p>

            {/* Estado de edición */}
            <div className="mb-3 p-2 bg-blue-50 rounded border border-blue-200">
              <p className="text-blue-800 text-xs font-medium mb-1">💡 Instrucciones de edición:</p>
              <ul className="text-blue-700 text-xs space-y-1">
                <li>• Arrastre los puntos dorados para mover el recorrido</li>
                <li>• Haga clic en el mapa para agregar nuevos puntos</li>
                <li>• Los cambios se guardan automáticamente</li>
              </ul>
            </div>

            <div className="flex gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => {
                  console.log("🚀 Iniciando edición de recorrido")
                  console.log("📍 initialData completo:", initialData)
                  console.log("📍 initialData.geometry:", initialData.geometry)
                  console.log("📍 routeCoordinates estado actual:", routeCoordinates)

                  let coordinates = []

                  // Extraer coordenadas del objeto geometry
                  if (initialData.geometry) {
                    if (typeof initialData.geometry.getCoordinates === "function") {
                      // Si es un objeto geometry de OpenLayers
                      coordinates = initialData.geometry.getCoordinates()
                      console.log("✅ Coordenadas extraídas del objeto geometry:", coordinates.length)
                    } else if (initialData.geometry.coordinates) {
                      // Si es un objeto GeoJSON
                      coordinates = initialData.geometry.coordinates
                      console.log("✅ Coordenadas extraídas del GeoJSON:", coordinates.length)
                    } else if (initialData.geometry.flatCoordinates) {
                      // Si es un objeto con flatCoordinates (formato plano)
                      const flat = initialData.geometry.flatCoordinates
                      const stride = initialData.geometry.stride || 2

                      // Convertir array plano a array de pares [x,y]
                      coordinates = []
                      for (let i = 0; i < flat.length; i += stride) {
                        if (i + 1 < flat.length) {
                          coordinates.push([flat[i], flat[i + 1]])
                        }
                      }
                      console.log("✅ Coordenadas extraídas de flatCoordinates:", coordinates.length)
                    }
                  }

                  // Si no hay coordenadas o están vacías, usar las actuales
                  if (!coordinates || coordinates.length === 0) {
                    if (routeCoordinates.length > 0) {
                      coordinates = routeCoordinates
                      console.log("⚠️ Usando coordenadas actuales:", coordinates.length)
                    } else {
                      console.log("❌ No se encontraron coordenadas para editar")
                      return
                    }
                  }

                  // Activar modo de edición de recorrido
                  window.dispatchEvent(
                    new CustomEvent("start-edit-line-route", {
                      detail: {
                        lineId: initialData.id_linea,
                        coordinates: coordinates,
                      },
                    }),
                  )
                }}
                className="px-3 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
                disabled={isLoading}
              >
                🛠️ Editar Recorrido
              </button>

              <button
                type="button"
                onClick={() => {
                  // Finalizar edición de recorrido
                  window.dispatchEvent(new CustomEvent("end-edit-line-route"))
                }}
                className="px-3 py-1 text-xs bg-gray-500 text-white rounded hover:bg-gray-600 disabled:opacity-50"
                disabled={isLoading}
              >
                ✅ Finalizar Edición
              </button>

              <button
                type="button"
                onClick={() => {
                  if (window.confirm("¿Está seguro de que desea restablecer el recorrido original?")) {
                    // Restablecer coordenadas originales
                    if (initialData.geometry && initialData.geometry.coordinates) {
                      const originalCoords = initialData.geometry.coordinates
                      setRouteCoordinates(originalCoords)

                      // Actualizar en el mapa también
                      window.dispatchEvent(
                        new CustomEvent("update-line-route", {
                          detail: {
                            lineId: initialData.id_linea,
                            coordinates: originalCoords,
                          },
                        }),
                      )
                    }
                  }
                }}
                className="px-3 py-1 text-xs bg-orange-500 text-white rounded hover:bg-orange-600 disabled:opacity-50"
                disabled={isLoading}
              >
                🔄 Restablecer
              </button>
            </div>

            <div className="mt-3 pt-2 border-t border-gray-200">
              <p className="text-xs text-gray-500">
                <strong>Coordenadas actuales:</strong> {routeCoordinates.length} puntos
              </p>
              {routeCoordinates.length > 0 && (
                <div className="mt-1 max-h-20 overflow-y-auto bg-white p-1 rounded border text-xs">
                  {routeCoordinates.slice(0, 3).map((coord, index) => (
                    <div key={index} className="text-gray-600">
                      {index + 1}: [{coord[0].toFixed(2)}, {coord[1].toFixed(2)}]
                    </div>
                  ))}
                  {routeCoordinates.length > 3 && (
                    <div className="text-gray-500">... y {routeCoordinates.length - 3} puntos más</div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {mode === "edit-line" && (
        <div>
          <label className="block text-sm font-medium mb-2">Vincular Paradas</label>
          <div className="mt-1 text-xs bg-gray-50 p-3 rounded border">
            <p className="text-gray-600 mb-2">Paradas actualmente vinculadas: {selectedStops.length}</p>

            <div className="mb-3 p-2 bg-green-50 rounded border border-green-200">
              <p className="text-green-800 text-xs font-medium mb-1">💡 Instrucciones para vincular paradas:</p>
              <ul className="text-green-700 text-xs space-y-1">
                <li>• Active el modo "Vincular Paradas" haciendo clic en el botón</li>
                <li>• Haga clic en paradas del mapa que estén a menos de 25m de la línea</li>
                <li>• Las paradas se vincularán automáticamente</li>
                <li>• Desactive el modo cuando termine</li>
              </ul>
            </div>

            <div className="flex gap-2 flex-wrap">
              {!isLinkingMode ? (
                <button
                  type="button"
                  onClick={() => {
                    console.log("🔗 Activando modo vincular paradas")
                    console.log("📍 initialData completo:", initialData)
                    console.log("📍 routeCoordinates estado actual:", routeCoordinates)

                    // Obtener las coordenadas correctas de la línea
                    let lineCoordinates = []

                    if (routeCoordinates && routeCoordinates.length > 0) {
                      // Usar las coordenadas del estado actual
                      lineCoordinates = routeCoordinates
                      console.log("✅ Usando coordenadas del estado:", lineCoordinates.length, "puntos")
                    } else if (initialData && initialData.geometry) {
                      // Extraer coordenadas del objeto geometry
                      if (typeof initialData.geometry.getCoordinates === "function") {
                        // Si es un objeto geometry de OpenLayers
                        lineCoordinates = initialData.geometry.getCoordinates()
                        console.log("✅ Coordenadas extraídas del objeto geometry:", lineCoordinates.length)
                      } else if (initialData.geometry.coordinates) {
                        // Si es un objeto GeoJSON
                        lineCoordinates = initialData.geometry.coordinates
                        console.log("✅ Coordenadas extraídas del GeoJSON:", lineCoordinates.length)
                      } else if (initialData.geometry.flatCoordinates) {
                        // Si es un objeto con flatCoordinates (formato plano)
                        const flat = initialData.geometry.flatCoordinates
                        const stride = initialData.geometry.stride || 2

                        // Convertir array plano a array de pares [x,y]
                        lineCoordinates = []
                        for (let i = 0; i < flat.length; i += stride) {
                          if (i + 1 < flat.length) {
                            lineCoordinates.push([flat[i], flat[i + 1]])
                          }
                        }
                        console.log("✅ Coordenadas extraídas de flatCoordinates:", lineCoordinates.length)
                      }
                    }

                    if (!lineCoordinates || lineCoordinates.length < 2) {
                      console.log("❌ No se encontraron coordenadas válidas para la línea")
                      alert("❌ No se pueden vincular paradas: no hay coordenadas de línea disponibles.")
                      return
                    }

                    console.log("🔗 Enviando coordenadas al modo vinculación:", lineCoordinates.length, "puntos")
                    console.log("📍 Primeras 3 coordenadas:", lineCoordinates.slice(0, 3))

                    setIsLinkingMode(true)
                    window.dispatchEvent(
                      new CustomEvent("start-link-stops-mode", {
                        detail: {
                          lineId: initialData.id_linea,
                          routeCoordinates: lineCoordinates,
                        },
                      }),
                    )
                  }}
                  className="px-3 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
                  disabled={isLoading}
                >
                  🔗 Activar Vincular Paradas
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => {
                    console.log("🔗 Desactivando modo vincular paradas")
                    setIsLinkingMode(false)
                    window.dispatchEvent(new CustomEvent("end-link-stops-mode"))
                  }}
                  className="px-3 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50"
                  disabled={isLoading}
                >
                  ✅ Finalizar Vinculación
                </button>
              )}

              {isLinkingMode && (
                <div className="w-full mt-2 p-2 bg-green-50 border border-green-200 rounded">
                  <p className="text-green-800 text-xs font-medium">
                    🔗 Modo vinculación activo - Haga clic en paradas del mapa para vincularlas
                  </p>
                </div>
              )}
            </div>

            {selectedStops.length > 0 && (
              <div className="mt-3 pt-2 border-t border-gray-200">
                <p className="text-xs text-gray-500 mb-2">
                  <strong>Paradas vinculadas:</strong>
                </p>
                <div className="max-h-20 overflow-y-auto bg-white p-2 rounded border text-xs">
                  {selectedStops.map((stop, index) => (
                    <div
                      key={stop.id || index}
                      className="flex justify-between items-center py-1 border-b border-gray-100 last:border-b-0"
                    >
                      <span className="text-gray-700">ID: {stop.id}</span>
                      <button
                        type="button"
                        onClick={() => {
                          console.log("🗑️ Desvinculando parada:", stop.id)
                          // Remover parada de la lista
                          const updatedStops = selectedStops.filter((_, i) => i !== index)
                          setSelectedStops(updatedStops)

                          // Disparar evento para notificar la desvinculación
                          window.dispatchEvent(
                            new CustomEvent("unlink-stop-from-line", {
                              detail: {
                                lineId: initialData.id_linea,
                                stopId: stop.id,
                              },
                            }),
                          )
                        }}
                        className="text-red-500 hover:text-red-700 text-xs px-1 py-0.5 rounded hover:bg-red-50"
                        disabled={isLoading}
                        title="Desvincular parada"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
                <div className="mt-2 text-xs text-gray-500">💡 Haga clic en ✕ para desvincular una parada</div>
              </div>
            )}
          </div>
        </div>
      )}

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
