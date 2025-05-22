import axios from "axios";




const apiUrl = 'https://localhost:8081/api'; // luego estara dentro de un .env



/**
 *  Configuracion de axios para la API
 *  @type {import('axios').AxiosInstance}
 */


const API = axios.create({
    baseURL: apiUrl,
    headers: { "content-type": "application/json" },
    withCredentials: true,
});

/**
 * Interceptor para manejar respuestas de error
 * @description Redirige al login cuando detecta un error 401 (no autorizado)
 */
API.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            console.log("🔒 Sesión expirada, redirigiendo al login...");
            window.location.href = "/login"; // Redirigir al usuario si la sesión expiró
        }
        return Promise.reject(error);
    }
);
export default API;