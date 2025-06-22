"use client"

import { useRef, useCallback, useState } from "react"

/**
 * Hook para manejar el cálculo de rutas usando Web Workers
 */
export const useRouteCalculator = () => {
  const workerRef = useRef(null)
  const [isCalculating, setIsCalculating] = useState(false)
  const [progress, setProgress] = useState(0)
  const [progressMessage, setProgressMessage] = useState("")
  const currentRequestId = useRef(0)

  // Inicializar worker
  const initWorker = useCallback(() => {
    if (!workerRef.current) {
      try {
        workerRef.current = new Worker(new URL("../workers/routeCalculator.js", import.meta.url), { type: "module" })

        workerRef.current.onmessage = (e) => {
          const { type, data, id } = e.data

          switch (type) {
            case "progress":
              setProgress(data.progress || 0)
              setProgressMessage(data.message || "Procesando...")
              break

            case "result":
              setIsCalculating(false)
              setProgress(100)
              // El resultado se maneja en el callback específico
              break

            case "error":
              setIsCalculating(false)
              setProgress(0)
              console.error("Error en worker:", data)
              break

            case "cancelled":
              setIsCalculating(false)
              setProgress(0)
              setProgressMessage("Cancelado")
              break

            default:
              console.log("Mensaje desconocido del worker:", type, data)
          }
        }

        workerRef.current.onerror = (error) => {
          console.error("Error en worker:", error)
          setIsCalculating(false)
          setProgress(0)
        }

        console.log("✅ Worker de cálculo de rutas inicializado")
      } catch (error) {
        console.error("❌ Error al inicializar worker:", error)
      }
    }
  }, [])

  // Calcular ruta
  const calculateRoute = useCallback(
    async (startCoord, endCoord, features) => {
      return new Promise((resolve, reject) => {
        try {
          initWorker()

          if (!workerRef.current) {
            reject(new Error("No se pudo inicializar el worker"))
            return
          }

          const requestId = ++currentRequestId.current
          setIsCalculating(true)
          setProgress(0)
          setProgressMessage("Iniciando cálculo...")

          // Configurar listener para este request específico
          const handleMessage = (e) => {
            const { type, data, id } = e.data

            // Solo procesar mensajes de este request
            if (id && id !== requestId) return

            if (type === "result") {
              workerRef.current.removeEventListener("message", handleMessage)
              resolve(data)
            } else if (type === "error") {
              workerRef.current.removeEventListener("message", handleMessage)
              reject(new Error(data.message || "Error en el cálculo"))
            } else if (type === "cancelled") {
              workerRef.current.removeEventListener("message", handleMessage)
              reject(new Error("Cálculo cancelado"))
            }
          }

          workerRef.current.addEventListener("message", handleMessage)

          // Enviar datos al worker
          workerRef.current.postMessage({
            type: "CALCULATE_ROUTE",
            id: requestId,
            data: {
              startCoord,
              endCoord,
              features,
            },
          })
        } catch (error) {
          setIsCalculating(false)
          setProgress(0)
          reject(error)
        }
      })
    },
    [initWorker],
  )

  // Cancelar cálculo
  const cancelCalculation = useCallback(() => {
    if (workerRef.current && isCalculating) {
      workerRef.current.postMessage({
        type: "CANCEL",
        id: currentRequestId.current,
      })
      setIsCalculating(false)
      setProgress(0)
      setProgressMessage("Cancelando...")
    }
  }, [isCalculating])

  // Limpiar worker
  const cleanup = useCallback(() => {
    if (workerRef.current) {
      workerRef.current.terminate()
      workerRef.current = null
      console.log("🧹 Worker de cálculo de rutas terminado")
    }
    setIsCalculating(false)
    setProgress(0)
    setProgressMessage("")
  }, [])

  return {
    calculateRoute,
    cancelCalculation,
    cleanup,
    isCalculating,
    progress,
    progressMessage,
  }
}
