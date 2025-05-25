
import { useState } from "react"
import useAuthStore from "@/store/authStore"

const AdminLogin = ({ navigateTo }) => {
  const [error, setError] = useState("")
  const login = useAuthStore((state) => state.login)

  const [formData, setFormData] = useState({
    email: "",
    contraseña: "",
  })

  const handleSubmit = (e) => {
    e.preventDefault()
    setError("")

    // Simulación de autenticación
    if (formData.email === "admin@admin.com" && formData.contraseña === "admin") {
      // Usar el store de Zustand para autenticar
      const mockUser = {
        id: 1,
        email: "admin",
        role: "Admin",
      }
      login(mockUser, "ADMIN")
      navigateTo("admin")
    } else {
      setError("Credenciales inválidas")
    }
  }

  return (
    <div className="min-h-full flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">Acceso Administrador</h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Ingrese sus credenciales para acceder al panel de administración
          </p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="email" className="sr-only">
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                value={formData.email}
                onChange={(e) => setFormData(e.target.value)}
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-gray-500 focus:border-gray-500 focus:z-10 sm:text-sm mb-2"
                placeholder="Usuario"
              />
            </div>
            <div>
              <label htmlFor="Contraseña" className="sr-only">
                Contraseña
              </label>
              <input
                id="contraseña"
                name="contraseña"
                type="password"
                required
                value={formData.contraseña}
                onChange={(e) => setFormData(e.target.value)}
                className="appearance-none rounded-none relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-gray-500 focus:border-gray-500 focus:z-10 sm:text-sm"
                placeholder="Contraseña"
              />
            </div>
          </div>

          {error && <div className="text-sm text-red-600 text-center">{error}</div>}

          <div>
            <button
              type="submit"
              className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-gray-600 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
            >
              Iniciar sesión
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default AdminLogin
