import axios from "axios";


const GEOSERVER_URL = 'http://localhost:8080/geoserver/tsig2025/wms';


export async function fetchGeoServerFeatures({
    typeName, bbox, srsName='EPSG:4326'
}){
    const params = {
        service: "WFS",
        version: "1.1.0",
        request: "GetFeature",
        typeName: typeName,
        outputFormat: "application/json",
        srsName
    }

    if(bbox) params.bbox = bbox

    try {
        const response = await axios.get(GEOSERVER_URL, {params});
        return response.data;
    }catch(e){
        console.log("Error en el fetchGeoServerFeatures")
        throw e;
    }
}