import API from './api'

export async function fetchStops() {
    try {
        const response = await API.get('map/stops') // ❌ Faltaba await
        return response.data
    } catch(e) {
        console.log("Error en el fetchStops:", e)
        throw e;
    }
}

export async function fetchLines() {
    try {
        const response = await API.get('map/lines') // ❌ Faltaba await y era 'Lines' (mayúscula)
        return response.data
    } catch(e) {
        console.log("Error en el fetchLines:", e)
        throw e;
    }
}