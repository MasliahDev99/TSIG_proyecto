"use client"

import { useEffect, useState } from "react"
import { X, MapPin, Route, Clock, Zap } from "lucide-react"

export default function ProgressDialog({
  isVisible,
  progress,
  message,
  onCancel,
  title = "Calculando Ruta",
  showDetails = false,
}) {
  const [timeElapsed, setTimeElapsed] = useState(0)
  const [startTime, setStartTime] = useState(null)

  useEffect(() => {
    if (isVisible && !startTime) {
      setStartTime(Date.now())
      setTimeElapsed(0)
    } else if (!isVisible) {
      setStartTime(null)
      setTimeElapsed(0)
    }
  }, [isVisible, startTime])

  useEffect(() => {
    let interval = null
    if (isVisible && startTime) {
      interval = setInterval(() => {
        setTimeElapsed(Math.floor((Date.now() - startTime) / 1000))
      }, 1000)
    }
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [isVisible, startTime])

  if (!isVisible) return null

  const progressPercentage = Math.max(0, Math.min(100, progress || 0))
  const isCompleted = progressPercentage >= 100

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200">
          <div className="flex items-center space-x-2">
            <div className={`p-2 rounded-full ${isCompleted ? "bg-green-100" : "bg-blue-100"}`}>
              {isCompleted ? (
                <Route className={`h-5 w-5 ${isCompleted ? "text-green-600" : "text-blue-600"}`} />
              ) : (
                <MapPin className="h-5 w-5 text-blue-600 animate-pulse" />
              )}
            </div>
            <h3 className="text-lg font-semibold text-gray-900">{title}</h3>
          </div>
          {onCancel && !isCompleted && (
            <button
              onClick={onCancel}
              className="p-1 hover:bg-gray-100 rounded-full transition-colors"
              title="Cancelar"
            >
              <X className="h-5 w-5 text-gray-500" />
            </button>
          )}
        </div>

        {/* Progress Content */}
        <div className="p-6">
          {/* Progress Bar */}
          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-gray-700">{isCompleted ? "Completado" : "Progreso"}</span>
              <span className="text-sm font-medium text-gray-900">{progressPercentage.toFixed(0)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
              <div
                className={`h-full transition-all duration-300 ease-out ${
                  isCompleted ? "bg-green-500" : "bg-blue-500"
                } ${!isCompleted ? "animate-pulse" : ""}`}
                style={{ width: `${progressPercentage}%` }}
              />
            </div>
          </div>

          {/* Status Message */}
          <div className="mb-4">
            <p className="text-sm text-gray-600 flex items-center">
              {!isCompleted && <Zap className="h-4 w-4 mr-2 text-yellow-500 animate-pulse" />}
              {message || "Procesando..."}
            </p>
          </div>

          {/* Details */}
          {showDetails && (
            <div className="bg-gray-50 rounded-lg p-3 space-y-2">
              <div className="flex items-center justify-between text-xs text-gray-600">
                <span className="flex items-center">
                  <Clock className="h-3 w-3 mr-1" />
                  Tiempo transcurrido
                </span>
                <span className="font-mono">
                  {Math.floor(timeElapsed / 60)}:{(timeElapsed % 60).toString().padStart(2, "0")}
                </span>
              </div>

              {progressPercentage > 0 && !isCompleted && (
                <div className="flex items-center justify-between text-xs text-gray-600">
                  <span>Tiempo estimado restante</span>
                  <span className="font-mono">
                    {progressPercentage > 5
                      ? `${Math.ceil((timeElapsed / progressPercentage) * (100 - progressPercentage))}s`
                      : "Calculando..."}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 mt-6">
            {isCompleted ? (
              <button
                onClick={onCancel}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors"
              >
                Continuar
              </button>
            ) : (
              onCancel && (
                <button
                  onClick={onCancel}
                  className="px-4 py-2 bg-gray-500 text-white rounded-md hover:bg-gray-600 transition-colors"
                >
                  Cancelar
                </button>
              )
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
