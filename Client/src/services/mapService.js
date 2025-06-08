import API from './api'


export function fetchStops() {
    try {
        const response = API.get('map/stops')
        return response.data

    }catch(e){
        console.log("Error en el fetchStops")
        throw e;
    }
}


export function fetchLines() {
    try {
        const response = API.get('map/Lines')
        return response.data

    }catch(e){
        console.log("Error en el fetchLine")
        throw e;
    }
}
