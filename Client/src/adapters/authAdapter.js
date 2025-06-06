import {login, logout} from '@/services'

/**
 * Adaptador para servicios de autenticación.
 * @namespace authAdapter
 */



/**
 * Objeto adaptador para servicios de autenticación.
 * @type {Object}
 * @property {Function} login - Funcion para iniciar sesion.
 * @property {Function} logout - Funcion para cerrar sesion.
 */

/**
 * Adaptador para servicios de autenticación de usuarios admin.
 * 
 * Este adaptador centraliza las llamadas a los servicios de autenticación para usuarios admin en la plataforma.
 * Utiliza funciones del backend para iniciar sesión y cerrar sesión.
 * 
 * Métodos:
 * - login(userData): Inicia sesión con las credenciales del usuario.
 * - logout(): Cierra la sesión del usuario actual.
 * 
 * Ejemplo de uso:
 * 
 * import { authAdapter } from "@/adapters";
 * 
 * 
 * // Login
 * await authAdapter.login({ email, contraseña });
 * 
 * // Logout
 * await authAdapter.logout();
 */
export const authAdapter = {
    login: async (userData) => {
        try{
            const response = await login(userData)
            return response.data
        }catch(error){
            console.error('Error en la autenticacion:', error);
            throw error;
        }
    },
    logout: async () => {
        try{
            const response = await logout()
            return response.data
        }catch(error){
            console.error('Error en la autenticacion:', error);
            throw error;
        }
    }
}