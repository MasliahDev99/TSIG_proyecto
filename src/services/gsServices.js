import API from "./api";
import { GEOSERVER_URL } from "@/config/constants";

/**
 * Obtiene datos geoespaciales de GeoServer usando WFS.
 */
export async function fetchGeoServerFeatures({ typeName, bbox, srsName = 'EPSG:4326', signal }) {
    const wfsParams = {
        service: "WFS",
        version: "1.1.0",
        request: "GetFeature",
        typeName,
        outputFormat: "application/json",
        srsName
    };

    if (bbox) {
        wfsParams.bbox = bbox;
    }

    try {
        const response = await API.get(GEOSERVER_URL, {
            params: wfsParams,
            signal,
        });
        return response.data;
    } catch (error) {
        console.error(
            `[src/services/gsServices.js -> fetchGeoServerFeatures] Error para capa ${typeName}:`,
            error.name === 'AbortError' || error.name === 'CanceledError' ? '(petición abortada)' : error.message
        );
        throw error;
    }
}
