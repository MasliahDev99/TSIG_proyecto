const SearchFilters = ({ filters, onFilterChange }) => {
  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    onFilterChange({ [name]: type === "checkbox" ? checked : value })
  }

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold text-gray-700">Filtros de búsqueda</h2>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">Origen</label>
        <input
          type="text"
          name="origin"
          value={filters.origin}
          onChange={handleChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent"
          placeholder="Ej: Montevideo"
        />
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">Destino</label>
        <input
          type="text"
          name="destination"
          value={filters.destination}
          onChange={handleChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent"
          placeholder="Ej: Maldonado"
        />
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">Hora inicio</label>
          <input
            type="time"
            name="timeStart"
            value={filters.timeStart}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent"
          />
        </div>

        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">Hora fin</label>
          <input
            type="time"
            name="timeEnd"
            value={filters.timeEnd}
            onChange={handleChange}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent"
          />
        </div>
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">Ruta/Km</label>
        <input
          type="text"
          name="route"
          value={filters.route}
          onChange={handleChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent"
          placeholder="Ej: Ruta 5 km 30"
        />
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">Empresa</label>
        <input
          type="text"
          name="company"
          value={filters.company}
          onChange={handleChange}
          className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-gray-400 focus:border-transparent"
          placeholder="Ej: COPSA"
        />
      </div>

      <div className="flex items-center">
        <input
          type="checkbox"
          id="showDisabled"
          name="showDisabled"
          checked={filters.showDisabled}
          onChange={handleChange}
          className="h-4 w-4 text-gray-600 focus:ring-gray-400 border-gray-300 rounded"
        />
        <label htmlFor="showDisabled" className="ml-2 block text-sm text-gray-700">
          Mostrar deshabilitados
        </label>
      </div>


      <button
        onClick={() =>
          onFilterChange({
            origin: "",
            destination: "",
            timeStart: "",
            timeEnd: "",
            route: "",
            company: "",
            showDisabled: false,
          })
        }
        className="w-full py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gray-600 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
      >
        Limpiar filtros
      </button>
    </div>
  )
}

export default SearchFilters
