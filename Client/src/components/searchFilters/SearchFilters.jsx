"use client"

import { useState, useEffect, useRef } from "react"
import Select from "react-select"
import { SearchIcon, XIcon } from "lucide-react"
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
}

export default function FilterSidebar() {
  const [filters, setFilters] = useState(initialFilters)
  const [departamentoOptions, setDepartamentoOptions] = useState([])
  const [ciudadOptions, setCiudadOptions] = useState([])
  const [rutaOptions, setRutaOptions] = useState([])
  const [kmOptions, setKmOptions] = useState([])
  const [lineas, setLineas] = useState([])

  const mojonesRef = useRef([])

  useEffect(() => {
    const handleLoadOptions = (e) => {
      const { departamentos, ciudades, rutas, mojones } = e.detail
      setDepartamentoOptions(departamentos)
      setCiudadOptions(ciudades)
      setRutaOptions(rutas.map(r => ({ label: `Ruta ${r}`, value: r })))
      mojonesRef.current = mojones
    }

    window.addEventListener("load-options", handleLoadOptions)
    return () => window.removeEventListener("load-options", handleLoadOptions)
  }, [])

  useEffect(() => {
    const mojones = mojonesRef.current
    if (filters.rutaSeleccionada) {
      const kmsRuta = mojones.filter(m => Number(m.ruta) === Number(filters.rutaSeleccionada.value))
      const kmList = kmsRuta.map(m => ({
        label: `Km ${m.km}${m.sufijo ? ` - ${m.sufijo}` : ""}`,
        value: m.km,
        ruta: m.ruta,
        sufijo: m.sufijo,
      }))

      setKmOptions(kmList.sort((a, b) => a.value - b.value))
    } else {
        const kmList = mojones.map(m => ({
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
        const response = await fetch("http://localhost:8080/geoserver/tsig2025/ows?service=WFS&version=1.0.0&request=GetFeature&typeName=tsig2025:linea&outputFormat=application/json&srsName=EPSG:4326")
        const geojson = await response.json()
        const propsList = geojson.features.map(f => ({ ...f.properties, geometry: f.geometry }))
        setLineas(propsList)
        window.dispatchEvent(new CustomEvent("filtrar-lineas", { detail: propsList }))
      } catch (err) {
        console.error("Error cargando líneas desde GeoServer", err)
      }
    }
    fetchLineas()
  }, [])

  const handleSelectChange = (field, selected) => {
    setFilters(prev => ({ ...prev, [field]: selected }))
  }

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFilters(prev => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }))
  }

  const handleClearFilters = () => {
    setFilters(initialFilters)
    window.dispatchEvent(new CustomEvent("filtrar-lineas", { detail: lineas }))
    window.dispatchEvent(new CustomEvent("limpiar-filtros"))
  }

  const handleApplyFilters = () => {
    const {
      origin, destination,
      ciudadOrigen, ciudadDestino,
      rutaSeleccionada, kmSeleccionado,
      company, showDisabled
    } = filters

      // 🚫 Validar: si hay ruta pero no km
  if (rutaSeleccionada && !kmSeleccionado) {
    alert("Debe seleccionar un kilómetro cuando elige una ruta.")
    return
  }

    const lineasFiltradas = lineas.filter((linea) => {
      const matchDeptoOrigen = origin ? linea.depto_origen?.toLowerCase() === origin.value.toLowerCase() : true
      const matchDeptoDestino = destination ? linea.depto_destino?.toLowerCase() === destination.value.toLowerCase() : true
      const matchCiudadOrigen = ciudadOrigen ? linea.ciudad_origen?.toLowerCase() === ciudadOrigen.value.toLowerCase() : true
      const matchCiudadDestino = ciudadDestino ? linea.ciudad_destino?.toLowerCase() === ciudadDestino.value.toLowerCase() : true
      const matchEmpresa = company ? linea.empresa?.toLowerCase().includes(company.value.toLowerCase()) : true
      const matchActiva = showDisabled ? true : linea.activa !== false

      let matchRuta = true
      let matchKm = true

      try {
        const tipo = linea.geometry.type
        let coords = linea.geometry.coordinates

        const lineaFeature = turf.feature({
          type: tipo,
          coordinates: coords
        })

        if (rutaSeleccionada && window.rutasGeojson) {
          const ruta = window.rutasGeojson.find(r => Number(r.properties.numero) === Number(rutaSeleccionada.value))
          if (ruta) {
            let rutaGeom = ruta.geometry
            if (rutaGeom.type === "MultiLineString" && rutaGeom.coordinates.length === 1) {
              rutaGeom = {
                type: "LineString",
                coordinates: rutaGeom.coordinates[0]
              }
            }
            let rutaCoords = rutaGeom.coordinates
            if (rutaGeom.type === "LineString") {
              rutaCoords = rutaCoords.map(c => transform(c, "EPSG:32721", "EPSG:4326"))
            } else if (rutaGeom.type === "MultiLineString") {
              rutaCoords = rutaCoords.map(line => line.map(c => transform(c, "EPSG:32721", "EPSG:4326")))
            }
            const rutaFeature = turf.feature({
              type: rutaGeom.type,
              coordinates: rutaCoords
            })

            const puntosLinea = turf.explode(lineaFeature).features
            let minDist = Infinity
            for (const pLinea of puntosLinea) {
              const dist = turf.pointToLineDistance(pLinea, rutaFeature, { units: "meters" })
              if (dist < minDist) minDist = dist
            }
            console.log(`📏 Distancia línea a ruta ${rutaSeleccionada.value}:`, minDist.toFixed(2), "m")
            matchRuta = minDist <= 100
          }
        }

        if (kmSeleccionado && window.mojonesGeojson) {
          const mojon = window.mojonesGeojson.find(m =>
            Number(m.properties.ruta) === Number(rutaSeleccionada?.value) &&
            Math.round(m.properties.km) === Math.round(kmSeleccionado.value) &&
            (m.properties.sufijo || null) === (kmSeleccionado.sufijo || null)
          )


          if (mojon) {
            const mojonCoord = mojon.geometry.coordinates
            const mojonCoord4326 = transform(mojonCoord, "EPSG:32721", "EPSG:4326")
            const mojonPoint = turf.point(mojonCoord4326)

            const puntosLinea = turf.explode(lineaFeature).features
            const distancias = puntosLinea.map(p =>
              turf.distance(p, mojonPoint, { units: "meters" })
            )
            const minDist = Math.min(...distancias)
            console.log(`📍 Distancia mojón Ruta ${mojon.properties.ruta} Km ${mojon.properties.km} a la línea:`, minDist.toFixed(2), "m")
            matchKm = minDist <= 300

            // Cuando hay mojon seleccionado, ignorar distancia a la ruta
            matchRuta = true
          } else {
            console.warn("❌ Mojón no encontrado para ruta y km:", rutaSeleccionada?.value, kmSeleccionado.value)
            matchKm = false
          }
        }

      } catch (e) {
        console.warn("⚠️ Error en geometría:", e)
      }

      return matchDeptoOrigen && matchDeptoDestino && matchCiudadOrigen &&
        matchCiudadDestino && matchEmpresa && matchActiva &&
        matchRuta && matchKm
    })

    console.log("✅ Líneas filtradas:", lineasFiltradas.length)
    window.dispatchEvent(new CustomEvent("filtrar-lineas", { detail: lineasFiltradas }))
  }

  return (
    <aside className="w-80 bg-white dark:bg-gray-800 p-6 space-y-6 overflow-y-auto shadow-lg">
      <h2 className="text-xl font-semibold text-gray-800 dark:text-white">Filtros de búsqueda</h2>

      <Select options={departamentoOptions} value={filters.origin} onChange={(s) => handleSelectChange("origin", s)} placeholder="Departamento Origen" isSearchable />
      <Select options={departamentoOptions} value={filters.destination} onChange={(s) => handleSelectChange("destination", s)} placeholder="Departamento Destino" isSearchable />
      <Select options={ciudadOptions} value={filters.ciudadOrigen} onChange={(s) => handleSelectChange("ciudadOrigen", s)} placeholder="Localidad Origen" isSearchable />
      <Select options={ciudadOptions} value={filters.ciudadDestino} onChange={(s) => handleSelectChange("ciudadDestino", s)} placeholder="Localidad Destino" isSearchable />

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

      <div className="flex items-center space-x-2">
        <input type="checkbox" id="showDisabled" name="showDisabled" checked={filters.showDisabled} onChange={handleChange} className="h-4 w-4" />
        <label htmlFor="showDisabled" className="text-sm">Mostrar deshabilitados</label>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <button onClick={handleApplyFilters} className="px-4 py-2 bg-slate-700 text-white rounded-md">Aplicar</button>
        <button onClick={handleClearFilters} className="px-4 py-2 bg-gray-300 text-black rounded-md">Limpiar</button>
      </div>
    </aside>
  )
}
