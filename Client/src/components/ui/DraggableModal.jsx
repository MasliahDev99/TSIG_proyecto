"use client"

import { useState, useRef, useEffect } from "react"
import { GripHorizontalIcon } from "lucide-react"

export default function DraggableModal({ children, isVisible, onClose, title }) {
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 })
  const modalRef = useRef(null)
  const dragHandleRef = useRef(null)

  // Centrar el modal cuando se hace visible
  useEffect(() => {
    if (isVisible && modalRef.current) {
      const modal = modalRef.current
      const rect = modal.getBoundingClientRect()
      const centerX = (window.innerWidth - rect.width) / 2
      const centerY = Math.max(50, 100) // Posición más alta, sin centrar verticalmente
      setPosition({ x: centerX, y: centerY })
    }
  }, [isVisible])

  const handleMouseDown = (e) => {
    if (!dragHandleRef.current?.contains(e.target)) return

    setIsDragging(true)
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y,
    })
    e.preventDefault()
  }

  const handleMouseMove = (e) => {
    if (!isDragging) return

    const newX = e.clientX - dragStart.x
    const newY = e.clientY - dragStart.y

    // Limitar el movimiento dentro de la ventana
    const maxX = window.innerWidth - (modalRef.current?.offsetWidth || 0)
    const maxY = window.innerHeight - (modalRef.current?.offsetHeight || 0)

    setPosition({
      x: Math.max(0, Math.min(newX, maxX)),
      y: Math.max(0, Math.min(newY, maxY)),
    })
  }

  const handleMouseUp = () => {
    setIsDragging(false)
  }

  useEffect(() => {
    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove)
      document.addEventListener("mouseup", handleMouseUp)
      document.body.style.cursor = "grabbing"
      document.body.style.userSelect = "none"
    } else {
      document.removeEventListener("mousemove", handleMouseMove)
      document.removeEventListener("mouseup", handleMouseUp)
      document.body.style.cursor = ""
      document.body.style.userSelect = ""
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove)
      document.removeEventListener("mouseup", handleMouseUp)
      document.body.style.cursor = ""
      document.body.style.userSelect = ""
    }
  }, [isDragging, dragStart, position])

  if (!isVisible) return null

  return (
    <div
      ref={modalRef}
      className="fixed bg-white rounded-lg shadow-2xl border border-gray-300 min-w-96 max-w-2xl z-50"
      style={{
        left: `${position.x}px`,
        top: `${position.y}px`,
        transform: isDragging ? "scale(1.02)" : "scale(1)",
        transition: isDragging ? "none" : "transform 0.1s ease",
        boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
      }}
      onMouseDown={handleMouseDown}
    >
      {/* Drag Handle */}
      <div
        ref={dragHandleRef}
        className={`flex items-center justify-between p-3 bg-gray-50 rounded-t-lg border-b border-gray-200 ${
          isDragging ? "cursor-grabbing" : "cursor-grab"
        }`}
      >
        <div className="flex items-center space-x-2">
          <GripHorizontalIcon className="h-4 w-4 text-gray-400" />
          <h3 className="text-sm font-medium text-gray-700">{title}</h3>
        </div>
        <button
          onClick={onClose}
          className="text-gray-400 hover:text-gray-600 text-lg font-bold leading-none hover:bg-gray-200 rounded px-2 py-1 transition-colors"
        >
          ×
        </button>
      </div>

      {/* Content */}
      <div className="max-h-[80vh] overflow-y-auto">{children}</div>
    </div>
  )
}
