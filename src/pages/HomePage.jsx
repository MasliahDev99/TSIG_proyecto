"use client"

import { useState, useEffect } from "react"
import useAuthStore from "@/store/AuthStore"
import { Navbar, AdminLogin, FilterSidebar, AdminDashboard } from "@/components"

export default function HomePage() {
  const [currentView, setCurrentView] = useState("map") // 'map', 'login', 'admin'

  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const userRole = useAuthStore((state) => state.role)
  const userLogin = useAuthStore((state) => state.login)
  const userLogout = useAuthStore((state) => state.logout)
  const isInitialized = useAuthStore((state) => state.isInitialized)
  const initializeAuth = useAuthStore((state) => state.initializeAuth)

  // Inicializar el estado de autenticación al cargar la página
  useEffect(() => {
    if (!isInitialized) {
      initializeAuth()
    }
  }, [isInitialized, initializeAuth])

  // Effect to handle initial view or redirection based on persisted auth state
  useEffect(() => {
    // Solo ejecutar después de que el estado se haya inicializado
    if (!isInitialized) return

    console.log("Auth state check:", { isAuthenticated, userRole, currentView })

    // Si el usuario está autenticado como admin, asegurar que vea el mapa por defecto
    if (isAuthenticated && userRole === "ADMIN" && currentView === "login") {
      console.log("Redirecting authenticated admin to map view")
      setCurrentView("map")
    }
  }, [isAuthenticated, userRole, currentView, isInitialized])

  const navigateTo = (view, section = null, id = null) => {
    console.log("Navigating to:", view)

    if (view === "logout") {
      userLogout()
      setCurrentView("map") // Go to map view after logout
      return
    }
    // Si el usuario está autenticado como admin, puede navegar libremente
    // Si no está autenticado y trata de acceder a admin, redirigir a login
    if (view === "admin" && !isAuthenticated) {
      setCurrentView("login")
      return
    }
    setCurrentView(view)
  }

  const handleLoginSuccess = (userData) => {
    console.log("Login success with data:", userData)
    userLogin(userData || { name: "Admin" }, "ADMIN")
    // Después del login exitoso, ir al mapa con herramientas de admin
    setCurrentView("map")
  }

  // Mostrar loading mientras se inicializa el estado
  if (!isInitialized) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
      </div>
    )
  }

  // Determinar si mostrar herramientas de admin
  const showAdminTools = isAuthenticated && userRole === "ADMIN"

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      <Navbar currentView={currentView} navigateTo={navigateTo} isAuthenticated={isAuthenticated} />

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar izquierdo - Solo filtros si no es admin o no está autenticado */}
        {currentView === "map" && !showAdminTools && <FilterSidebar />}

        {/* Contenido central */}
        <main className="flex-1 relative h-full">
          {currentView === "map" && <AdminDashboard isAdmin={showAdminTools} />}

          {currentView === "login" && !isAuthenticated && (
            <div className="flex items-center justify-center h-full p-4">
              <AdminLogin onLoginSuccess={handleLoginSuccess} />
            </div>
          )}
        </main>

        {/* Panel de herramientas de admin - Siempre visible del lado derecho si está autenticado como admin */}
        {/* Este panel ahora está integrado en AdminDashboard */}
      </div>
    </div>
  )
}
