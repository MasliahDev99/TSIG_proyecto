"use client"

import { useState } from "react"
import { UploadIcon, FileTextIcon, AlertCircleIcon } from "lucide-react"
import axios from "axios"

export default function ImportDialog({ onClose, onImportSuccess }) {
  const [selectedFile, setSelectedFile] = useState(null)
  const [importType, setImportType] = useState("paradas")
  const [isUploading, setIsUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  const handleFileSelect = (e) => {
    const file = e.target.files[0]
    if (file) {
      const validTypes = ["application/json", "text/csv", "application/vnd.ms-excel"]
      if (validTypes.includes(file.type) || file.name.endsWith(".csv")) {
        setSelectedFile(file)
        setError("")
      } else {
        setError("Tipo de archivo no válido. Solo se permiten archivos JSON y CSV.")
        setSelectedFile(null)
      }
    }
  }

  const handleImport = async () => {
    if (!selectedFile) {
      setError("Por favor seleccione un archivo.")
      return
    }

    setIsUploading(true)
    setError("")
    setSuccess("")
    setUploadProgress(0)

    const formData = new FormData()
    formData.append("file", selectedFile)
    formData.append("type", importType)

    try {
      const response = await axios.post("http://localhost:8081/api/admin/importar", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
        withCredentials: true,
        onUploadProgress: (progressEvent) => {
          const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total)
          setUploadProgress(progress)
        },
      })

      setSuccess(`Importación exitosa: ${response.data.message}`)
      if (onImportSuccess) {
        onImportSuccess(response.data)
      }

      // Auto-close after success
      setTimeout(() => {
        onClose()
      }, 2000)
    } catch (error) {
      console.error("Error en la importación:", error)
      setError(error.response?.data?.message || "Error al importar el archivo. Verifique el formato y contenido.")
    } finally {
      setIsUploading(false)
      setUploadProgress(0)
    }
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
        <div className="flex items-center mb-4">
          <UploadIcon className="h-6 w-6 text-blue-600 mr-2" />
          <h3 className="text-lg font-semibold">Importar Datos</h3>
        </div>

        {/* Tipo de importación */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">Tipo de datos</label>
          <select
            value={importType}
            onChange={(e) => setImportType(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            disabled={isUploading}
          >
            <option value="paradas">Paradas</option>
            <option value="lineas">Líneas</option>
            <option value="completo">Datos Completos</option>
          </select>
        </div>

        {/* Selector de archivo */}
        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">Archivo</label>
          <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center">
            <input
              type="file"
              accept=".json,.csv"
              onChange={handleFileSelect}
              className="hidden"
              id="file-upload"
              disabled={isUploading}
            />
            <label htmlFor="file-upload" className="cursor-pointer flex flex-col items-center">
              <FileTextIcon className="h-8 w-8 text-gray-400 mb-2" />
              <span className="text-sm text-gray-600">
                {selectedFile ? selectedFile.name : "Seleccionar archivo JSON o CSV"}
              </span>
            </label>
          </div>
        </div>

        {/* Información del formato */}
        <div className="mb-4 p-3 bg-blue-50 rounded-lg">
          <div className="flex items-start">
            <AlertCircleIcon className="h-5 w-5 text-blue-600 mr-2 flex-shrink-0 mt-0.5" />
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-1">Formato esperado:</p>
              <ul className="text-xs space-y-1">
                <li>• JSON: Array de objetos con las propiedades correspondientes</li>
                <li>• CSV: Primera fila con nombres de columnas</li>
                <li>• Coordenadas en formato WGS84 (lat/lng)</li>
              </ul>
            </div>
          </div>
        </div>

        {/* Barra de progreso */}
        {isUploading && (
          <div className="mb-4">
            <div className="flex justify-between text-sm mb-1">
              <span>Subiendo...</span>
              <span>{uploadProgress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              ></div>
            </div>
          </div>
        )}

        {/* Mensajes de error y éxito */}
        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm text-red-800">{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-sm text-green-800">{success}</p>
          </div>
        )}

        {/* Botones */}
        <div className="flex space-x-3">
          <button
            onClick={onClose}
            className="flex-1 px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
            disabled={isUploading}
          >
            Cancelar
          </button>
          <button
            onClick={handleImport}
            className="flex-1 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
            disabled={!selectedFile || isUploading}
          >
            {isUploading ? "Importando..." : "Importar"}
          </button>
        </div>
      </div>
    </div>
  )
}
