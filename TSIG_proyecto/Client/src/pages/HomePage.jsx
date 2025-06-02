

import { useState, useEffect } from "react"
import useAuthStore from "@/store/AuthStore" // Corrected path assuming store is in src/store
import {Navbar,MapView,AdminLogin,FilterSidebar,AdminDashboard} from "@/components"


export default function HomePage() {
  const [currentView, setCurrentView] = useState("map") // 'map', 'login', 'admin'


  
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const userRole = useAuthStore((state) => state.role)
  const userLogin = useAuthStore((state) => state.login)
  const userLogout = useAuthStore((state) => state.logout)


  // Effect to handle initial view or redirection based on persisted auth state
  useEffect(() => {
    if (isAuthenticated && userRole === "ADMIN" && currentView === "login") {
      // If authenticated as admin and somehow on login view, redirect to admin dashboard
      setCurrentView("admin")
    } else if (!isAuthenticated && currentView === "admin") {
      // If not authenticated but trying to access admin view, redirect to map (or login)
      setCurrentView("map") // Or "login" if you prefer direct login prompt
    }
    // If currentView is 'map' and user is admin, they can still view the public map.
    // Navigation to 'admin' view is explicit via Navbar.
  }, [isAuthenticated, userRole, currentView])

  const navigateTo = (view, section = null, id = null) => {
    if (view === "logout") {
      userLogout()
      setCurrentView("map") // Go to map view after logout
      return
    }
    // If trying to access admin view but not authenticated, redirect to login
    if (view === "admin" && !isAuthenticated) {
      setCurrentView("login")
      return
    }
    setCurrentView(view)
    // if (section) setAdminSection(section);
    // if (id) setEditingId(id);
  }

  const handleLoginSuccess = (userData) => {
    // Assuming your login service returns user data and role, or you define role here
    // For example, if your backend login returns user details:
    // zustandLogin(userData.user, userData.role || "ADMIN");
    // For now, we'll assume the role is ADMIN upon successful login via AdminLogin
    userLogin(userData || { name: "Admin" }, "ADMIN") // Pass user object and role
    navigateTo("admin")
  }

  return (
    <div className="flex flex-col h-screen bg-gray-100">
      <Navbar currentView={currentView} navigateTo={navigateTo} isAuthenticated={isAuthenticated} />

      <div className="flex flex-1 overflow-hidden">
        {/* Public Map View with Filters */}
        {currentView === "map" && (
          <>
            <FilterSidebar />
            <main className="flex-1 relative h-full">
              <MapView isAdmin={false} />
            </main>
          </>
        )}

        {/* Admin Login View */}
        {currentView === "login" && !isAuthenticated && (
          <div className="flex-1 flex items-center justify-center p-4">
            <AdminLogin onLoginSuccess={handleLoginSuccess} />
          </div>
        )}

        {/* Admin Dashboard View - only if authenticated as ADMIN */}
        {currentView === "admin" && isAuthenticated && userRole === "ADMIN" && <AdminDashboard />}
      </div>
    </div>
  )
}
