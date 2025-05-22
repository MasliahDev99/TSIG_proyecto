import { fetchGeoServerFeatures } from '@/services';



export const gsAdapter = {
    getStopFromGeoServer : async () => {
        try{
            const typeName = "montevideo:paradas"
            const data = await fetchGeoServerFeatures({typeName})
            return data
        }catch(error){
            console.error('Error en el adaptador de geoserver - paradas :', error);
            throw error;
        }
    },
    getLineFromGeoServer: async () => {
        try{
            const typeName = "montevideo:linea"
            const data = await fetchGeoServerFeatures({typeName})
            return data
        }catch(error){
            console.error('Error en el adaptador de geoserver - lineas :', error);
            throw error;
        }
    }
}