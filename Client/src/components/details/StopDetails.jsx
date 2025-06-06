
const StopDetails = ({ stop, onClose }) => {
  // aca va venir datos de la api
  const mockSchedules = [
    { lineId: 1, times: ["08:00", "10:30", "13:00", "16:30", "19:00"] },
    { lineId: 2, times: ["07:30", "11:00", "14:30", "18:00", "21:30"] },
  ]

  return (
    <div className="mt-4 p-4 bg-gray-100 rounded-md">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-lg font-semibold text-gray-800">{stop.name}</h3>
        <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>

      <div className="space-y-2 text-sm">
        <p>
          <span className="font-medium">Estado:</span> {stop.enabled ? "Habilitada" : "Deshabilitada"}
        </p>
        <p>
          <span className="font-medium">Refugio:</span> {stop.hasRefuge ? "Sí" : "No"}
        </p>
        <p>
          <span className="font-medium">Coordenadas:</span> {stop.lat.toFixed(6)}, {stop.lng.toFixed(6)}
        </p>
      </div>

      <div className="mt-4">
        <h4 className="font-medium mb-2">Horarios:</h4>
        {mockSchedules
          .filter((schedule) => stop.lines.includes(schedule.lineId))
          .map((schedule) => (
            <div key={schedule.lineId} className="mb-2">
              <p className="text-sm font-medium">Línea {schedule.lineId}:</p>
              <div className="flex flex-wrap gap-1 mt-1">
                {schedule.times.map((time, index) => (
                  <span key={index} className="px-2 py-1 bg-white text-xs rounded shadow-sm">
                    {time}
                  </span>
                ))}
              </div>
            </div>
          ))}
      </div>
    </div>
  )
}

export default StopDetails
