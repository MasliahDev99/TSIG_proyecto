import { fetchGeoServerFeatures } from '@/services';

/**
 * @file gsAdapter.js
 * @module adapters/gsAdapter
 * @description Adaptador para interactuar con servicios de GeoServer.
 */

export const gsAdapter = {
    /**
     * Obtiene los datos de las paradas de ómnibus desde GeoServer.
     */
    getStopsFromGeoServer : async ({ signal }) => {
        try{
            const typeName = "tsig2025:paradas" // Nombre correcto de la capa en GeoServer
            const data = await fetchGeoServerFeatures({typeName, signal})
            console.log('Datos de paradas recibidos:', data)
            return data
        }catch(error){
            console.error('[src/adapters/gsAdapter.js -> getStopsFromGeoServer] Error:', error);
            throw error;
        }
    },

    /**
     * Obtiene los datos de las líneas de ómnibus desde GeoServer.
     */
    getLinesFromGeoServer: async ({ signal }) => {
        try{
            const typeName = "tsig2025:lineas" // Nombre correcto de la capa en GeoServer
            const data = await fetchGeoServerFeatures({typeName, signal})
            console.log('Datos de líneas recibidos:', data)
            return data
        }catch(error){
            console.error('[src/adapters/gsAdapter.js -> getLinesFromGeoServer] Error:', error);
            throw error;
        }
    }
}