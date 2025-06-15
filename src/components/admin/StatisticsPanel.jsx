"use client"

import { useState, useEffect } from "react"
import { BarChart3Icon, TrendingUpIcon, MapPinIcon, RouteIcon } from "lucide-react"
import axios from "axios"

export default function StatisticsPanel({ onClose }) {
  const [stats, setStats] = useState({
    totalStops: 0,
    totalLines: 0,
    activeStops: 0,
    activeLines: 0,
    stopsWithRefuge: 0,
    departmentStats: [],
    companyStats: [],
  })
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    const fetchStatistics = async () => {
      try {
        const response = await axios.get("http://localhost:8081/api/admin/estadisticas", {
          withCredentials: true,
        })
        setStats(response.data)
      } catch (error) {
        console.error("Error al cargar estadísticas:", error)
      } finally {
        setIsLoading(false)
      }
    }

    fetchStatistics()
  }, [])

  if (isLoading) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[80vh] overflow-y-auto">
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[80vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-semibold flex items-center">
            <BarChart3Icon className="mr-2 h-6 w-6" />
            Estadísticas del Sistema
          </h3>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-700">
            ✕
          </button>
        </div>

        {/* Estadísticas principales */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-blue-50 p-4 rounded-lg">
            <div className="flex items-center">
              <MapPinIcon className="h-8 w-8 text-blue-600 mr-3" />
              <div>
                <h4 className="font-medium text-blue-800">Total Paradas</h4>
                <p className="text-2xl font-bold text-blue-600">{stats.totalStops}</p>
              </div>
            </div>
          </div>

          <div className="bg-green-50 p-4 rounded-lg">
            <div className="flex items-center">
              <RouteIcon className="h-8 w-8 text-green-600 mr-3" />
              <div>
                <h4 className="font-medium text-green-800">Total Líneas</h4>
                <p className="text-2xl font-bold text-green-600">{stats.totalLines}</p>
              </div>
            </div>
          </div>

          <div className="bg-yellow-50 p-4 rounded-lg">
            <div className="flex items-center">
              <TrendingUpIcon className="h-8 w-8 text-yellow-600 mr-3" />
              <div>
                <h4 className="font-medium text-yellow-800">Paradas Activas</h4>
                <p className="text-2xl font-bold text-yellow-600">{stats.activeStops}</p>
              </div>
            </div>
          </div>

          <div className="bg-purple-50 p-4 rounded-lg">
            <div className="flex items-center">
              <TrendingUpIcon className="h-8 w-8 text-purple-600 mr-3" />
              <div>
                <h4 className="font-medium text-purple-800">Líneas Activas</h4>
                <p className="text-2xl font-bold text-purple-600">{stats.activeLines}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Estadísticas adicionales */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Estadísticas por departamento */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-semibold mb-3">Paradas por Departamento</h4>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {stats.departmentStats.map((dept, index) => (
                <div key={index} className="flex justify-between items-center">
                  <span className="text-sm">{dept.departamento || "Sin especificar"}</span>
                  <span className="font-medium">{dept.count}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Estadísticas por empresa */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-semibold mb-3">Líneas por Empresa</h4>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {stats.companyStats.map((company, index) => (
                <div key={index} className="flex justify-between items-center">
                  <span className="text-sm">{company.empresa || "Sin especificar"}</span>
                  <span className="font-medium">{company.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Información adicional */}
        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <h4 className="font-semibold mb-2 text-blue-800">Información Adicional</h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="font-medium">Paradas con Refugio:</span>
              <span className="ml-2">{stats.stopsWithRefuge}</span>
            </div>
            <div>
              <span className="font-medium">Porcentaje Activo:</span>
              <span className="ml-2">
                {stats.totalStops > 0 ? Math.round((stats.activeStops / stats.totalStops) * 100) : 0}%
              </span>
            </div>
          </div>
        </div>

        <div className="flex justify-end mt-6">
          <button onClick={onClose} className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600">
            Cerrar
          </button>
        </div>
      </div>
    </div>
  )
}
