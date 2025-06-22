"use client"

import { useState, useEffect, useRef } from "react"
import Select from "react-select"
import { MapPinIcon, LocateIcon, Navigation } from "lucide-react"
import * as turf from "@turf/turf"
import { transform } from "ol/proj"

const initialFilters = {
  origin: null,
  destination: null,
  ciudadOrigen: null,
  ciudadDestino: null,
  timeStart: "",
  timeEnd: "",
  rutaSeleccionada: null,
  kmSeleccionado: null,
  company: "",
  showDisabled: false,
  polygonFilter: false,
  locationFilter: false, // Nuevo filtro de ubicación
  maxDistance: 500, // Distancia máxima en metros
}

export default function FilterSidebar() {
  const [filters, setFilters] = useState(initialFilters)
  const [departamentoOptions, setDepartamentoOptions] = useState([])
  const [ciudadOptions, setCiudadOptions] = useState([])
  const [rutaOptions, setRutaOptions] = useState([])
  const [kmOptions, setKmOptions] = useState([])
  const [lineas, setLineas] = useState([])

  const mojonesRef = useRef([])

  const [isDrawingPolygon, setIsDrawingPolygon] = useState(false)
  const [drawnPolygon, setDrawnPolygon] = useState(null)

  const [userLocation, setUserLocation] = useState(null)
  const [isLocating, setIsLocating] = useState(false)
  const [locationError, setLocationError] = useState(null)
  const [maxDistance, setMaxDistance] = useState(500) // metros por defecto
  const [useLocationFilter, setUseLocationFilter] = useState(false)

  useEffect(() => {
    const handleLoadOptions = (e) => {
      const { departamentos, ciudades, rutas, mojones } = e.detail
      setDepartamentoOptions(departamentos)
      setCiudadOptions(ciudades)
      setRutaOptions(rutas.map((r) => ({ label: `Ruta ${r}`, value: r })))
      mojonesRef.current = mojones
    }

    window.addEventListener("load-options", handleLoadOptions)
    return () => window.removeEventListener("load-options", handleLoadOptions)
  }, [])

  useEffect(() => {
    const mojones = mojonesRef.current
    if (filters.rutaSeleccionada) {
      const kmsRuta = mojones.filter((m) => Number(m.ruta) === Number(filters.rutaSeleccionada.value))
      const kmList = kmsRuta.map((m) => ({
        label: `Km ${m.km}${m.sufijo ? ` - ${m.sufijo}` : ""}`,
        value: m.km,
        ruta: m.ruta,
        sufijo: m.sufijo,
      }))

      setKmOptions(kmList.sort((a, b) => a.value - b.value))
    } else {
      const kmList = mojones.map((m) => ({
        label: `Ruta ${m.ruta} - Km ${m.km}${m.sufijo ? ` - ${m.sufijo}` : ""}`,
        value: m.km,
        ruta: m.ruta,
        sufijo: m.sufijo,
      }))
      setKmOptions(kmList)
    }
  }, [filters.rutaSeleccionada])

  useEffect(() => {
    const fetchLineas = async () => {
      try {
        const response = await fetch(
          "http://localhost:8080/geoserver/tsig2025/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=tsig2025:linea&outputFormat=application/json&srsName=EPSG:4326",
        )
        const geojson = await response.json()
        const propsList = geojson.features.map((f) => ({ ...f.properties, geometry: f.geometry }))
        setLineas(propsList)
        window.dispatchEvent(new CustomEvent("filtrar-lineas", { detail: propsList }))
      } catch (err) {
        console.error("Error cargando líneas desde GeoServer", err)
      }
    }
    fetchLineas()
  }, [])

  // Escuchar cuando se complete el dibujo del polígono
  useEffect(() => {
    const handlePolygonDrawn = (event) => {
      const { coordinates } = event.detail
      setDrawnPolygon(coordinates)
      setIsDrawingPolygon(false)
      console.log("Polígono dibujado:", coordinates)
    }

    const handlePolygonCleared = () => {
      setDrawnPolygon(null)
      setFilters((prev) => ({ ...prev, polygonFilter: false }))
    }

    window.addEventListener("polygon-drawn", handlePolygonDrawn)
    window.addEventListener("polygon-cleared", handlePolygonCleared)

    return () => {
      window.removeEventListener("polygon-drawn", handlePolygonDrawn)
      window.removeEventListener("polygon-cleared", handlePolygonCleared)
    }
  }, [])

  // Función para obtener la ubicación del usuario
  const getCurrentLocation = () => {
    if (!navigator.geolocation) {
      setLocationError("La geolocalización no está soportada en este navegador")
      return
    }

    setIsLocating(true)
    setLocationError(null)

    navigator.geolocation.getCurrentPosition(
      (position) => {
        const { latitude, longitude } = position.coords
        console.log("📍 Ubicación obtenida:", latitude, longitude)

        // Transformar coordenadas WGS84 a UTM para trabajar con el mapa
        const utmCoords = transform([longitude, latitude], "EPSG:4326", "EPSG:32721")

        setUserLocation({
          lat: latitude,
          lng: longitude,
          utmX: utmCoords[0],
          utmY: utmCoords[1],
        })
        setUseLocationFilter(true)
        setFilters((prev) => ({ ...prev, locationFilter: true }))
        setIsLocating(false)

        // Centrar el mapa en la ubicación del usuario
        window.dispatchEvent(
          new CustomEvent("center-map-on-location", {
            detail: { coordinates: utmCoords },
          }),
        )
      },
      (error) => {
        console.error("Error obteniendo ubicación:", error)
        let errorMessage = "Error obteniendo la ubicación"

        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = "Permiso de ubicación denegado"
            break
          case error.POSITION_UNAVAILABLE:
            errorMessage = "Ubicación no disponible"
            break
          case error.TIMEOUT:
            errorMessage = "Tiempo de espera agotado"
            break
        }

        setLocationError(errorMessage)
        setIsLocating(false)
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 300000, // 5 minutos
      },
    )
  }

  const handleSelectChange = (field, selected) => {
    setFilters((prev) => ({ ...prev, [field]: selected }))
  }

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFilters((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }))
  }

  // Nueva función para manejar el dibujo de polígono
  const handleTogglePolygonDraw = () => {
    if (isDrawingPolygon) {
      // Cancelar dibujo
      setIsDrawingPolygon(false)
      setFilters((prev) => ({ ...prev, polygonFilter: false }))
      window.dispatchEvent(new CustomEvent("stop-polygon-draw"))
    } else {
      // Iniciar dibujo
      setIsDrawingPolygon(true)
      setFilters((prev) => ({ ...prev, polygonFilter: true }))
      window.dispatchEvent(new CustomEvent("start-polygon-draw"))
    }
  }

  const handleClearFilters = () => {
    setFilters(initialFilters)
    setIsDrawingPolygon(false)
    setDrawnPolygon(null)
    setUserLocation(null)
    setUseLocationFilter(false)
    setLocationError(null)
    setMaxDistance(500)
    // Limpiar polígono del mapa
    window.dispatchEvent(new CustomEvent("clear-polygon-filter"))
    window.dispatchEvent(new CustomEvent("filtrar-lineas", { detail: lineas }))
    window.dispatchEvent(new CustomEvent("limpiar-filtros"))
  }

  const handleApplyFilters = () => {
    const {
      origin,
      destination,
      ciudadOrigen,
      ciudadDestino,
      rutaSeleccionada,
      kmSeleccionado,
      company,
      showDisabled,
      polygonFilter,
      locationFilter,
    } = filters

    // 🚫 Validar: si hay ruta pero no km
    if (rutaSeleccionada && !kmSeleccionado) {
      alert("Debe seleccionar un kilómetro cuando elige una ruta.")
      return
    }

    // 🚫 Validar: si se activó filtro de ubicación pero no hay ubicación
    if (locationFilter && !userLocation) {
      alert("Debe obtener su ubicación primero para usar el filtro de distancia.")
      return
    }

    const lineasFiltradas = lineas.filter((linea) => {
      const matchDeptoOrigen = origin ? linea.depto_origen?.toLowerCase() === origin.value.toLowerCase() : true
      const matchDeptoDestino = destination
        ? linea.depto_destino?.toLowerCase() === destination.value.toLowerCase()
        : true
      const matchCiudadOrigen = ciudadOrigen
        ? linea.ciudad_origen?.toLowerCase() === ciudadOrigen.value.toLowerCase()
        : true
      const matchCiudadDestino = ciudadDestino
        ? linea.ciudad_destino?.toLowerCase() === ciudadDestino.value.toLowerCase()
        : true
      const matchEmpresa = company ? linea.empresa?.toLowerCase().includes(company.value.toLowerCase()) : true
      const matchActiva = showDisabled ? true : linea.activa !== false

      let matchRuta = true
      let matchKm = true
      let matchPolygon = true
      let matchLocation = true

      try {
        const tipo = linea.geometry.type
        const coords = linea.geometry.coordinates

        const lineaFeature = turf.feature({
          type: tipo,
          coordinates: coords,
        })

        if (rutaSeleccionada && window.rutasGeojson) {
          const ruta = window.rutasGeojson.find((r) => Number(r.properties.numero) === Number(rutaSeleccionada.value))
          if (ruta) {
            let rutaGeom = ruta.geometry
            if (rutaGeom.type === "MultiLineString" && rutaGeom.coordinates.length === 1) {
              rutaGeom = {
                type: "LineString",
                coordinates: rutaGeom.coordinates[0],
              }
            }
            let rutaCoords = rutaGeom.coordinates
            if (rutaGeom.type === "LineString") {
              rutaCoords = rutaCoords.map((c) => transform(c, "EPSG:32721", "EPSG:4326"))
            } else if (rutaGeom.type === "MultiLineString") {
              rutaCoords = rutaCoords.map((line) => line.map((c) => transform(c, "EPSG:32721", "EPSG:4326")))
            }
            const rutaFeature = turf.feature({
              type: rutaGeom.type,
              coordinates: rutaCoords,
            })

            const puntosLinea = turf.explode(lineaFeature).features
            let minDist = Number.POSITIVE_INFINITY
            for (const pLinea of puntosLinea) {
              const dist = turf.pointToLineDistance(pLinea, rutaFeature, { units: "meters" })
              if (dist < minDist) minDist = dist
            }
            console.log(`📏 Distancia línea a ruta ${rutaSeleccionada.value}:`, minDist.toFixed(2), "m")
            matchRuta = minDist <= 100
          }
        }

        if (kmSeleccionado && window.mojonesGeojson) {
          const mojon = window.mojonesGeojson.find(
            (m) =>
              Number(m.properties.ruta) === Number(rutaSeleccionada?.value) &&
              Math.round(m.properties.km) === Math.round(kmSeleccionado.value) &&
              (m.properties.sufijo || null) === (kmSeleccionado.sufijo || null),
          )

          if (mojon) {
            const mojonCoord = mojon.geometry.coordinates
            const mojonCoord4326 = transform(mojonCoord, "EPSG:32721", "EPSG:4326")
            const mojonPoint = turf.point(mojonCoord4326)

            const puntosLinea = turf.explode(lineaFeature).features
            const distancias = puntosLinea.map((p) => turf.distance(p, mojonPoint, { units: "meters" }))
            const minDist = Math.min(...distancias)
            console.log(
              `📍 Distancia mojón Ruta ${mojon.properties.ruta} Km ${mojon.properties.km} a la línea:`,
              minDist.toFixed(2),
              "m",
            )
            matchKm = minDist <= 300

            // Cuando hay mojon seleccionado, ignorar distancia a la ruta
            matchRuta = true
          } else {
            console.warn("❌ Mojón no encontrado para ruta y km:", rutaSeleccionada?.value, kmSeleccionado.value)
            matchKm = false
          }
        }

        // Filtro de polígono
        if (polygonFilter && drawnPolygon) {
          try {
            // Crear polígono de Turf
            const polygon = turf.polygon([drawnPolygon])

            // Verificar si la línea intersecta con el polígono
            const intersects = turf.booleanIntersects(lineaFeature, polygon)
            matchPolygon = intersects

            console.log(`📐 Línea ${linea.id_linea} intersecta polígono:`, intersects)
          } catch (polygonError) {
            console.warn("⚠️ Error verificando intersección con polígono:", polygonError)
            matchPolygon = true // En caso de error, no filtrar
          }
        }

        // Filtro de ubicación del usuario
        if (locationFilter && userLocation) {
          try {
            // Crear punto de la ubicación del usuario
            const userPoint = turf.point([userLocation.lng, userLocation.lat])

            // Calcular la distancia mínima de la línea al punto del usuario
            const distanceToLine = turf.pointToLineDistance(userPoint, lineaFeature, { units: "meters" })

            console.log(`📍 Línea ${linea.id_linea} distancia a usuario:`, distanceToLine.toFixed(2), "m")

            // Verificar si está dentro de la distancia máxima
            matchLocation = distanceToLine <= maxDistance
          } catch (locationError) {
            console.warn("⚠️ Error verificando distancia a ubicación:", locationError)
            matchLocation = true // En caso de error, no filtrar
          }
        }
      } catch (e) {
        console.warn("⚠️ Error en geometría:", e)
      }

      return (
        matchDeptoOrigen &&
        matchDeptoDestino &&
        matchCiudadOrigen &&
        matchCiudadDestino &&
        matchEmpresa &&
        matchActiva &&
        matchRuta &&
        matchKm &&
        matchPolygon &&
        matchLocation
      )
    })

    console.log("✅ Líneas filtradas:", lineasFiltradas.length)
    window.dispatchEvent(new CustomEvent("filtrar-lineas", { detail: lineasFiltradas }))
  }

  return (
    <aside className="w-80 bg-white dark:bg-gray-800 p-6 space-y-6 overflow-y-auto shadow-lg">
      <h2 className="text-xl font-semibold text-gray-800 dark:text-white">Filtros de búsqueda</h2>

      <Select
        options={departamentoOptions}
        value={filters.origin}
        onChange={(s) => handleSelectChange("origin", s)}
        placeholder="Departamento Origen"
        isSearchable
      />
      <Select
        options={departamentoOptions}
        value={filters.destination}
        onChange={(s) => handleSelectChange("destination", s)}
        placeholder="Departamento Destino"
        isSearchable
      />
      <Select
        options={ciudadOptions}
        value={filters.ciudadOrigen}
        onChange={(s) => handleSelectChange("ciudadOrigen", s)}
        placeholder="Localidad Origen"
        isSearchable
      />
      <Select
        options={ciudadOptions}
        value={filters.ciudadDestino}
        onChange={(s) => handleSelectChange("ciudadDestino", s)}
        placeholder="Localidad Destino"
        isSearchable
      />

      <Select
        options={rutaOptions}
        value={filters.rutaSeleccionada}
        onChange={(s) => handleSelectChange("rutaSeleccionada", s)}
        placeholder="Ruta"
        isSearchable
      />

      <Select
        options={kmOptions}
        value={filters.kmSeleccionado}
        onChange={(s) => handleSelectChange("kmSeleccionado", s)}
        placeholder="Kilómetro"
        isSearchable
        isDisabled={!filters.rutaSeleccionada}
        getOptionLabel={(option) =>
          filters.rutaSeleccionada
            ? `Km ${option.value}${option.sufijo ? ` - ${option.sufijo}` : ""}`
            : `Ruta ${option.ruta} - Km ${option.value}${option.sufijo ? ` - ${option.sufijo}` : ""}`
        }
        getOptionValue={(option) => option.value}
      />

      <Select
        options={[
          { label: "CUTCSA", value: "cutcsa" },
          { label: "COPSA", value: "copsa" },
          { label: "UCOT", value: "ucot" },
          { label: "COETC", value: "coetc" },
          { label: "COME", value: "come" },
          { label: "Otra", value: "otra" },
        ]}
        value={filters.company}
        onChange={(s) => handleSelectChange("company", s)}
        placeholder="Empresa"
        isSearchable
      />

      {/* Nuevo botón para filtro de polígono */}
      <div className="space-y-3">
        <button
          onClick={handleTogglePolygonDraw}
          className={`w-full flex items-center justify-center px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            isDrawingPolygon
              ? "bg-red-600 text-white hover:bg-red-700"
              : drawnPolygon
                ? "bg-green-600 text-white hover:bg-green-700"
                : "bg-blue-600 text-white hover:bg-blue-700"
          }`}
        >
          <MapPinIcon className="h-4 w-4 mr-2" />
          {isDrawingPolygon ? "Cancelar Dibujo" : drawnPolygon ? "Polígono Activo" : "Dibujar Área"}
        </button>

        {drawnPolygon && (
          <div className="text-xs text-gray-600 bg-green-50 p-2 rounded">
            ✅ Polígono dibujado. Las líneas se filtrarán por el área seleccionada.
          </div>
        )}

        {isDrawingPolygon && (
          <div className="text-xs text-blue-600 bg-blue-50 p-2 rounded">
            🖱️ Haga clic en el mapa para dibujar los vértices del polígono. Doble clic para finalizar.
          </div>
        )}
      </div>

      {/* Filtro de ubicación del usuario */}
      <div className="space-y-3">
        <button
          onClick={getCurrentLocation}
          disabled={isLocating}
          className={`w-full flex items-center justify-center px-4 py-2 rounded-md text-sm font-medium transition-colors ${
            isLocating
              ? "bg-gray-400 text-white cursor-not-allowed"
              : userLocation
                ? "bg-green-600 text-white hover:bg-green-700"
                : "bg-blue-600 text-white hover:bg-blue-700"
          }`}
        >
          {isLocating ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Obteniendo ubicación...
            </>
          ) : userLocation ? (
            <>
              <Navigation className="h-4 w-4 mr-2" />
              Ubicación obtenida
            </>
          ) : (
            <>
              <LocateIcon className="h-4 w-4 mr-2" />
              Obtener mi ubicación
            </>
          )}
        </button>

        {locationError && <div className="text-xs text-red-600 bg-red-50 p-2 rounded">❌ {locationError}</div>}

        {userLocation && (
          <div className="space-y-2">
            <div className="text-xs text-green-600 bg-green-50 p-2 rounded">
              ✅ Ubicación: {userLocation.lat.toFixed(6)}, {userLocation.lng.toFixed(6)}
            </div>

            <div className="space-y-2">
              <label htmlFor="maxDistance" className="block text-sm font-medium text-gray-700">
                Distancia máxima (metros)
              </label>
              <input
                type="number"
                id="maxDistance"
                min="50"
                max="5000"
                step="50"
                value={maxDistance}
                onChange={(e) => setMaxDistance(Number(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="500"
              />
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="useLocationFilter"
                checked={useLocationFilter}
                onChange={(e) => {
                  setUseLocationFilter(e.target.checked)
                  setFilters((prev) => ({ ...prev, locationFilter: e.target.checked }))
                }}
                className="h-4 w-4"
              />
              <label htmlFor="useLocationFilter" className="text-sm">
                Filtrar por distancia a mi ubicación
              </label>
            </div>
          </div>
        )}
      </div>

      <div className="flex items-center space-x-2">
        <input
          type="checkbox"
          id="showDisabled"
          name="showDisabled"
          checked={filters.showDisabled}
          onChange={handleChange}
          className="h-4 w-4"
        />
        <label htmlFor="showDisabled" className="text-sm">
          Mostrar deshabilitados
        </label>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <button onClick={handleApplyFilters} className="px-4 py-2 bg-slate-700 text-white rounded-md">
          Aplicar
        </button>
        <button onClick={handleClearFilters} className="px-4 py-2 bg-gray-300 text-black rounded-md">
          Limpiar
        </button>
      </div>
    </aside>
  )
}
