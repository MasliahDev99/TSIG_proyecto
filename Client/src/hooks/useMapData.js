import { useEffect, useState } from "react";
import { transformStopsData, transformLinesData } from "@/libs/transformers";

/**
 * @file useMapData.js
 * @module hooks/useMapData
 * @description Custom Hook de React para gestionar la carga y transformación de datos geoespaciales (paradas y líneas de ómnibus)
 *              provenientes de un GeoServer. Utiliza un adaptador para la comunicación con el servidor,
 *              funciones de transformación para adecuar los datos, y AbortController para cancelar peticiones pendientes.
 */

/**
 * `useMapData` es un Hook personalizado de React diseñado para encapsular la lógica de obtención
 * y procesamiento de datos de paradas y líneas de ómnibus desde un GeoServer.
 *
 * Implementa `AbortController` para cancelar las solicitudes de red si el componente que usa el hook
 * se desmonta antes de que las solicitudes se completen, previniendo así actualizaciones de estado
 * en componentes no montados y posibles fugas de memoria.
 *
 * @param {object} adapter - Una instancia de un adaptador (ej. gsAdapter) que implementa
 *                           los métodos `getStopsFromGeoServer(signal)` y `getLinesFromGeoServer(signal)`
 *                           para obtener los datos crudos desde GeoServer, aceptando un `AbortSignal`.
 * @returns {object} Un objeto que contiene:
 *  - `stops` (Array): Un arreglo de objetos, donde cada objeto representa una parada de ómnibus procesada.
 *  - `lines` (Array): Un arreglo de objetos, donde cada objeto representa una línea de ómnibus procesada.
 *  - `isLoading` (boolean): `true` mientras los datos se están cargando, `false` al finalizar.
 *  - `error` (Error | null): Objeto de Error si ocurrió un problema, o `null` si no.
 *
 * @example
 * // Dentro de un componente de React:
 * import gsAdapter from './adapters/gsAdapter';
 * import { useMapData } from './hooks/useMapData';
 *
 * function MapComponent() {
 *   const { stops, lines, isLoading, error } = useMapData(gsAdapter);
 *
 *   if (isLoading) return <p>Cargando datos del mapa...</p>;
 *   if (error) return <p>Error al cargar datos: {error.message}</p>;
 *
 *   return (
 *     <div>
 *       // Renderizar mapa con stops y lines 
 *     </div>
 *   );
 * }
 */
export const useMapData = (adapter) => {
    const [stops, setStops] = useState([]);
    const [lines, setLines] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        // Crear una instancia de AbortController para poder cancelar la petición fetch.
        const controller = new AbortController();
        const signal = controller.signal;

        const loadData = async () => {
            setIsLoading(true);
            setError(null);
            try {
                const [geoStops, geoLines] = await Promise.all([
                    adapter.getStopsFromGeoServer(signal), // Pasar la señal al adaptador
                    adapter.getLinesFromGeoServer(signal)  // Pasar la señal al adaptador
                ]);

                const processedStops = transformStopsData(geoStops);
                const processedLines = transformLinesData(geoLines);

                setStops(processedStops);
                setLines(processedLines);

            } catch (err) {
                // Si el error es por abortar la petición, no lo consideramos un error de carga.
                if (err.name === 'AbortError') {
                    console.log('Fetch aborted');
                } else {
                    console.error('[src/hooks/useMapData.js -> loadData] Error al cargar datos:', err);
                    setError(err);
                }
            } finally {
                setIsLoading(false);
            }
        };

        if (adapter) {
            loadData();
        }

        // Función de limpieza de useEffect: se ejecuta cuando el componente se desmonta
        // o antes de que el efecto se ejecute nuevamente si las dependencias cambian.
        return () => {
            // Abortar la petición fetch si el componente se desmonta mientras la petición está en curso.
            controller.abort();
        };
    }, [adapter]); // Dependencia: el efecto se re-ejecuta si el adaptador cambia.

    return { stops, lines, isLoading, error };
};