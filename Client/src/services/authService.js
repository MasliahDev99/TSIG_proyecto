

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
 * @throws {Error} Si ocurre un error en la petición.
 * @example
 * await login({ email: "admin@admin.com", contraseña: "admin" });
 */
export const login = async (userData) => {
    try{
        const response = await API.post("/auth/login", userData);
        console.log("La respuesta del login es: ", response.data)
        return response.data;
    }catch(error){
        console.log(error);
        throw error;
    }
}



/**
 * Cierre de sesión de un usuario.
 * @function
 * @async
 * @returns {Promise<Object>} Respuesta del servidor.
 * @throws {Error} Si ocurre un error en la petición.
 * @example
 * await logout();
 */
export const logout = async () => {
    try{
        const response = await API.get("/auth/logout");
        return response.data;
    }catch(error){
        console.log(error);
        throw error;
    }
}

