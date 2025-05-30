import { create } from "zustand"
import { persist } from "zustand/middleware"

/**
 *  Store de Zustand para manejar el estado de autenticacion.
 *  Persiste los datos en el localstorage usando zustand/middleware.
 *
 *  @typedef {Object} AuthStore
 *  @property {Object} user: Objeto con los datos del usuario
 *  @property {string} role: Rol del usuario
 *  @property {boolean} isAuthenticated: Flag que indica si el usuario esta autenticado
 *  @property {function} login: Funcion que se encarga de logear al usuario
 *  @property {function} logout: Funcion que se encarga de deslogear al usuario
 *  @property {function} hasRole: Funcion que se encarga de verificar si el usuario tiene un rol especifico
 *
 *  @type {import('zustand').UseBoundStore<AuthStore>}
 */
const useAuthStore = create(
  persist(
    (set, get) => ({
      user: null,
      role: null,
      isAuthenticated: false,

      login: (user, role) => {
        set({ user, role, isAuthenticated: true })
      },
      logout: () => {
        set({ user: null, role: null, isAuthenticated: false })
      },
      hasRole: (requiredRole) => {
        /**
         *  @param {string} requiredRole: Rol requerido
         *  @property {string} currentRole: Rol actual
         *  @returns {boolean}  : Devuelve true si el usuario tiene el rol requerido.
         *  @example: hasRole("ADMIN") => true
         *  @example: hasRole("VENDEDOR") => false
         */
        const currentRole = get().role
        return currentRole === requiredRole
      },
    }),
    {
      name: "auth-storage", // importante para el uso de localstorage
      getStorage: () => localStorage,
      partialize: (state) => ({
        user: state.user,
        role: state.role,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
)
export default useAuthStore

