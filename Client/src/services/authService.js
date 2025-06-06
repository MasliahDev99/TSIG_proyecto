import API from "./api";

/**
 * Servicios para manejar la autenticación de usuarios Admin.
 * @namespace authService
 */

/**
 * Inicio de sesión con un usuario existente.
 * @function
 * @async
 * @param {Object} userData - Credenciales del usuario.
 * @returns {Promise<Object>} Respuesta del servidor.
 */
export const login = async (userData) => {
    try {
        const response = await API.post("/admin/login", userData); // corregido
        console.log("La respuesta del login es: ", response.data);
        return response.data;
    } catch (error) {
        console.log("❌ Error en login:", error);
        throw error;
    }
};

/**
 * Cierre de sesión de un usuario.
 * @function
 * @async
 * @returns {Promise<void>}
 */
export const logout = async () => {
    try {
        // logout solo borra localStorage en este caso, no hay endpoint en backend
        localStorage.removeItem("admin");
        return { success: true };
    } catch (error) {
        console.log("❌ Error en logout:", error);
        throw error;
    }
};
