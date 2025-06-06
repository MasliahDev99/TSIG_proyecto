import { useState } from "react"
import { SearchIcon, XIcon, ClockIcon } from "lucide-react"

const initialFilters = {
  origin: "",
  destination: "",
  timeStart: "",
  timeEnd: "",
  route: "",
  company: "",
  showDisabled: false,
}

export default function FilterSidebar() {
  const [filters, setFilters] = useState(initialFilters)

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setFilters((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }))
  }

  const handleClearFilters = () => {
    setFilters(initialFilters)
    // Add logic to apply/clear filters on the map if needed
    console.log("Filters cleared")
  }

  const handleApplyFilters = () => {
    // Add logic to apply filters on the map
    console.log("Applying filters:", filters)
  }

  return (
    <aside className="w-80 bg-white dark:bg-gray-800 p-6 space-y-6 overflow-y-auto shadow-lg">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-white">Filtros de búsqueda</h2>
        <button
          onClick={handleClearFilters}
          aria-label="Limpiar filtros"
          className="p-1 rounded-md hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300"
        >
          <XIcon className="h-5 w-5" />
        </button>
      </div>
      <hr className="border-gray-200 dark:border-gray-700" />

      <div className="space-y-4">
        <div>
          <label htmlFor="origin" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Origen
          </label>
          <input
            type="text"
            id="origin"
            name="origin"
            value={filters.origin}
            onChange={handleChange}
            placeholder="Ej: Montevideo"
            className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
          />
        </div>

        <div>
          <label htmlFor="destination" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Destino
          </label>
          <input
            type="text"
            id="destination"
            name="destination"
            value={filters.destination}
            onChange={handleChange}
            placeholder="Ej: Maldonado"
            className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="timeStart" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Hora inicio
            </label>
            <div className="relative mt-1">
              <input
                type="time"
                id="timeStart"
                name="timeStart"
                value={filters.timeStart}
                onChange={handleChange}
                className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              />
              <ClockIcon className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
            </div>
          </div>
          <div>
            <label htmlFor="timeEnd" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
              Hora fin
            </label>
            <div className="relative mt-1">
              <input
                type="time"
                id="timeEnd"
                name="timeEnd"
                value={filters.timeEnd}
                onChange={handleChange}
                className="block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
              />
              <ClockIcon className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
            </div>
          </div>
        </div>

        <div>
          <label htmlFor="route" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Ruta/Km
          </label>
          <input
            type="text"
            id="route"
            name="route"
            value={filters.route}
            onChange={handleChange}
            placeholder="Ej: Ruta 5 km 30"
            className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
          />
        </div>

        <div>
          <label htmlFor="company" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Empresa
          </label>
          <input
            type="text"
            id="company"
            name="company"
            value={filters.company}
            onChange={handleChange}
            placeholder="Ej: COPSA"
            className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
          />
        </div>

        <div className="flex items-center space-x-2 pt-2">
          <input
            type="checkbox"
            id="showDisabled"
            name="showDisabled"
            checked={filters.showDisabled}
            onChange={handleChange}
            className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 dark:border-gray-600 rounded bg-gray-100 dark:bg-gray-700 dark:focus:ring-offset-gray-800"
          />
          <label htmlFor="showDisabled" className="text-sm font-medium text-gray-700 dark:text-gray-300 cursor-pointer">
            Mostrar deshabilitados
          </label>
        </div>
      </div>

      <button
        onClick={handleApplyFilters}
        className="w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-slate-700 hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-slate-500 dark:bg-slate-600 dark:hover:bg-slate-700"
      >
        <SearchIcon className="mr-2 h-4 w-4" />
        Aplicar filtros
      </button>
      <button
        onClick={handleClearFilters}
        className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm text-sm font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
      >
        <XIcon className="mr-2 h-4 w-4" />
        Limpiar filtros
      </button>
    </aside>
  )
}
