import API from "./api"; // Importamos la instancia preconfigurada de Axios
import { GEOSERVER_URL } from "@/config"; // Asegúrate que esta constante esté definida y sea correcta

/**
 * @file gsServices.js
 * @module services/gsServices
 * @description Módulo para interactuar con los servicios WFS (Web Feature Service) de GeoServer.
 *              Proporciona funciones para obtener datos geoespaciales como features (paradas, líneas, etc.).
 *              La función principal `fetchGeoServerFeatures` ahora acepta un `AbortSignal` que se pasa
 *              a la petición `axios` (a través de la instancia `API`). Esto permite que la petición HTTP
 *              pueda ser cancelada, por ejemplo, si el componente que la inició se desmonta antes de que complete.
 */

/**
 * Realiza una petición GET a un endpoint WFS de GeoServer para obtener todas las "features" (elementos geográficos)
 * de una capa específica.
 *
 * @async
 * @function fetchGeoServerFeatures
 * @param {object} params - Parámetros para la petición GetFeature.
 * @param {string} params.typeName - El nombre de la capa en GeoServer (ej. "gis:paradas_omnibus").
 * @param {string} [params.bbox] - Opcional. Un "bounding box" (caja delimitadora) para filtrar features por área.
 *                                 Formato: "minX,minY,maxX,maxY,srsName" (ej. "-56.2,-34.9,-56.1,-34.8,EPSG:4326").
 * @param {string} [params.srsName='EPSG:4326'] - Sistema de referencia espacial para la respuesta y, si se usa bbox sin srs, para el bbox.
 * @param {AbortSignal} [params.signal] - Opcional. Un `AbortSignal` de un `AbortController`.
 *                                        Si se proporciona y la señal es abortada (ej. `controller.abort()` es llamado),
 *                                        la petición `axios.get` será cancelada. Esto es útil para prevenir
 *                                        actualizaciones de estado en componentes desmontados o para cancelar peticiones largas.
 * @returns {Promise<object>} Una promesa que resuelve a un objeto GeoJSON con las features de la capa.
 * @throws {Error} Lanza un error si la petición a GeoServer falla (capturado por Axios) o si es abortada.
 *                 Si es un `AbortError`, el `error.name` será `'AbortError'` o `'CanceledError'` dependiendo de la versión de Axios.
 *
 * @example
 * // const controller = new AbortController();
 * // const signal = controller.signal;
 * // setTimeout(() => controller.abort(), 5000); // Abortar después de 5 segundos (ejemplo)
 * // try {
 * //   const stopsData = await fetchGeoServerFeatures({ typeName: "gis:paradas_omnibus", signal });
 * //   console.log("Paradas:", stopsData);
 * // } catch (error) {
 * //   if (error.name === 'AbortError' || error.name === 'CanceledError') {
 * //     console.log('Solicitud de paradas abortada');
 * //   } else {
 * //     console.error("Error al obtener paradas:", error);
 * //   }
 * // }
 */
export async function fetchGeoServerFeatures({ typeName, bbox, srsName = 'EPSG:4326', signal }) {
    const wfsParams = {
        service: "WFS",
        version: "1.1.0", // O la versión que estés usando, ej. 2.0.0
        request: "GetFeature",
        typeName: typeName,
        outputFormat: "application/json",
        srsName // srsName para la salida
    };

    if (bbox) {
        wfsParams.bbox = bbox; // Formato: minX,minY,maxX,maxY[,crs]
    }

    // GEOSERVER_URL debe ser la URL base de tu GeoServer, ej: http://localhost:8080/geoserver
    // El path completo para WFS se construye añadiendo el workspace y 'wfs'
    // Ejemplo: `${GEOSERVER_URL}/[WORKSPACE]/wfs` si GEOSERVER_URL es solo el host y puerto.
    // O si GEOSERVER_URL ya incluye el workspace: `${GEOSERVER_URL}/wfs`
    // La URL que tenías antes (GEOSERVER_URL = 'http://localhost:8080/geoserver/tsig2025/wms') parece ser para WMS, no WFS.
    // Para WFS, usualmente es algo como: 'http://localhost:8080/geoserver/tsig2025/ows?' o 'http://localhost:8080/geoserver/tsig2025/wfs?'
    // Voy a asumir que GEOSERVER_URL es la base y el workspace está en typeName o se añade.
    // Si typeName es 'namespace:layer', GeoServer lo maneja. Si no, necesitas el path completo al endpoint WFS.
    // Por simplicidad, usaré la estructura de URL que tenías, pero asegúrate que sea la correcta para WFS GetFeature.
    // La URL correcta para WFS GetFeature es más parecida a: `${GEOSERVER_URL_BASE_GEOSERVER}/[WORKSPACE]/ows?` o `${GEOSERVER_URL_BASE_GEOSERVER}/wfs?`
    // Dado que usas `API.get(GEOSERVER_URL, {params: wfsParams...})`, GEOSERVER_URL debe ser el endpoint base al que se añaden los params.
    // Ejemplo: const geoserverWfsEndpoint = `${GEOSERVER_URL}/[tu_workspace]/wfs`; // o solo `${GEOSERVER_URL}/wfs` si el workspace está en typeName
    // Para este ejemplo, mantendré tu GEOSERVER_URL pero ten en cuenta que podría necesitar ajuste para WFS.
    // La URL final será algo como: http://localhost:8080/geoserver/tsig2025/wms?service=WFS&version=1.1.0&request=GetFeature...
    // Esto es un poco confuso porque el path dice /wms pero los params dicen service=WFS. Idealmente el path sería /wfs o /ows.

    try {
        // Usamos la instancia API.get().
        // La URL base del GeoServer (GEOSERVER_URL) se pasa como primer argumento.
        // Axios construirá la URL final añadiendo los wfsParams como query string.
        // El 'signal' se pasa en el objeto de configuración de la petición.
        const response = await API.get(GEOSERVER_URL, { params: wfsParams, signal });
        return response.data; // Retornamos los datos (GeoJSON) de la respuesta.
    } catch (error) {
        // Si ocurre un error, Axios lo empaqueta. Si es un AbortError (o CanceledError),
        // el error.name lo indicará. Lo relanzamos para que sea manejado por el llamador.
        console.error(
            `[src/services/gsServices.js -> fetchGeoServerFeatures] Error para capa ${typeName}:`,
            error.name === 'AbortError' || error.name === 'CanceledError' ? '(petición abortada)' : error.message
        );
        throw error;
    }
}