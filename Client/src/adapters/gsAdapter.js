import { fetchGeoServerFeatures } from '@/services';

/**
 * @file gsAdapter.js
 * @module adapters/gsAdapter
 * @description Adaptador para interactuar con servicios de GeoServer.
 *              Este módulo simplifica la forma en que la aplicación solicita datos geoespaciales (como paradas o líneas de ómnibus)
 *              al servicio `gsServices.js`. Actúa como una capa de abstracción, haciendo que el resto de la aplicación
 *              no necesite conocer los detalles de cómo se obtienen los datos del GeoServer.
 *              También maneja la propagación de señales de cancelación (AbortSignal) para las peticiones.
 */

/**
 * @typedef {object} AbortSignalOption
 * @property {AbortSignal} [signal] - Un objeto AbortSignal opcional que se puede usar para cancelar la petición.
 *                                    Si se proporciona y la señal es abortada, la petición al GeoServer se cancelará.
 */

export const gsAdapter = {
    /**
     * Obtiene los datos de las paradas de ómnibus desde GeoServer.
     *
     * @async
     * @param {AbortSignalOption} options - Opciones para la petición, incluyendo el AbortSignal.
     * @returns {Promise<object>} Una promesa que resuelve con los datos de las paradas en formato GeoJSON.
     *                            Estos datos vienen directamente de la función `fetchGeoServerFeatures`.
     * @throws {Error} Si ocurre un error durante la obtención de los datos desde GeoServer o si la petición es abortada.
     *                 El error será propagado desde `fetchGeoServerFeatures`.
     * 
     * @example
     * // Para obtener las paradas sin cancelación:
     * // const paradas = await gsAdapter.getStopFromGeoServer({});
     *
     * // Para obtener las paradas con posibilidad de cancelación:
     * // const controller = new AbortController();
     * // const signal = controller.signal;
     * // setTimeout(() => controller.abort(), 5000); // Abortar después de 5 segundos
     * // try {
     * //   const paradas = await gsAdapter.getStopFromGeoServer({ signal });
     * //   console.log(paradas);
     * // } catch (error) {
     * //   if (error.name === 'AbortError') {
     * //     console.log('Petición de paradas abortada');
     * //   } else {
     * //     console.error('Error obteniendo paradas:', error);
     * //   }
     * // }
     */
    getStopsFromGeoServer : async ({ signal }) => {
        try{
            const typeName = "montevideo:paradas" // Nombre de la capa de paradas en GeoServer
            // Llama a la función del servicio, pasándole el nombre de la capa y la señal de cancelación.
            const data = await fetchGeoServerFeatures({typeName, signal})
            return data // Devuelve los datos obtenidos.
        }catch(error){
            // Si hay un error (incluyendo si la petición fue abortada), lo muestra en consola y lo vuelve a lanzar
            // para que quien llamó a esta función también se entere.
            console.error('[src/adapters/gsAdapter.js -> getStopsFromGeoServer] Error:', error);
            throw error;
        }
    },

    /**
     * Obtiene los datos de las líneas de ómnibus desde GeoServer.
     *
     * @async
     * @param {AbortSignalOption} options - Opciones para la petición, incluyendo el AbortSignal.
     * @returns {Promise<object>} Una promesa que resuelve con los datos de las líneas en formato GeoJSON.
     *                            Estos datos vienen directamente de la función `fetchGeoServerFeatures`.
     * @throws {Error} Si ocurre un error durante la obtención de los datos desde GeoServer o si la petición es abortada.
     *                 El error será propagado desde `fetchGeoServerFeatures`.
     * 
     * @example
     * // Similar al ejemplo de getStopFromGeoServer, pero para líneas.
     * // const controller = new AbortController();
     * // const lineas = await gsAdapter.getLineFromGeoServer({ signal: controller.signal });
     */
    getLinesFromGeoServer: async ({ signal }) => {
        try{
            const typeName = "montevideo:linea" // Nombre de la capa de líneas en GeoServer
            // Llama a la función del servicio, pasándole el nombre de la capa y la señal de cancelación.
            const data = await fetchGeoServerFeatures({typeName, signal})
            return data // Devuelve los datos obtenidos.
        }catch(error){
            // Manejo de errores similar al de getStopFromGeoServer.
            console.error('[src/adapters/gsAdapter.js -> getLinesFromGeoServer] Error:', error);
            throw error;
        }
    }
}