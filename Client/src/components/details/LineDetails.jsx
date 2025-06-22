const LineDetails = ({ line, onClose }) => {
  return (
    <div className="mt-4 p-4 bg-gray-100 rounded-md">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-lg font-semibold text-gray-800">{line.description}</h3>
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
          <span className="font-medium">ID:</span> {line.id}
        </p>
        <p>
          <span className="font-medium">Empresa:</span> {line.company}
        </p>
        <p>
          <span className="font-medium">Origen:</span> {line.origin}
        </p>
        <p>
          <span className="font-medium">Destino:</span> {line.destination}
        </p>
        <p>
          <span className="font-medium">Estado:</span> {line.enabled ? "Habilitada" : "Deshabilitada"}
        </p>
      </div>

      <div className="mt-4">
        <h4 className="font-medium mb-2">Horarios:</h4>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <p className="text-xs font-medium">Salidas desde {line.origin}:</p>
            <div className="flex flex-wrap gap-1 mt-1">
              {["06:00", "08:30", "11:00", "14:30", "17:00", "19:30"].map((time, index) => (
                <span key={index} className="px-2 py-1 bg-white text-xs rounded shadow-sm">
                  {time}
                </span>
              ))}
            </div>
          </div>
          <div>
            <p className="text-xs font-medium">Salidas desde {line.destination}:</p>
            <div className="flex flex-wrap gap-1 mt-1">
              {["07:00", "09:30", "12:00", "15:30", "18:00", "20:30"].map((time, index) => (
                <span key={index} className="px-2 py-1 bg-white text-xs rounded shadow-sm">
                  {time}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default LineDetails
