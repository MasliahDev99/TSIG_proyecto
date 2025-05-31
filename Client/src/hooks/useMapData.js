import { useEffect, useState, useRef } from "react";
import { transformStopsData, transformLinesData } from "@/libs/transformers";

/**
 * Hook personalizado para cargar y procesar datos del mapa desde GeoServer
 */
export const useMapData = (adapter) => {
    const [stops, setStops] = useState([]);
    const [lines, setLines] = useState([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    
    // Usar ref para evitar múltiples cargas en desarrollo
    const loadedRef = useRef(false);

    useEffect(() => {
        // Evitar múltiples cargas en modo desarrollo
        if (loadedRef.current) {
            console.log("📋 useMapData: Datos ya cargados, saltando...");
            return;
        }

        const controller = new AbortController();
        const signal = controller.signal;

        const loadData = async () => {
            console.log("🔄 useMapData: Iniciando carga de datos...");
            setIsLoading(true);
            setError(null);
            
            try {
                const [geoStops, geoLines] = await Promise.all([
                    adapter.getStopsFromGeoServer({ signal }),
                    adapter.getLinesFromGeoServer({ signal })
                ]);

                // Verificar que no se canceló la petición
                if (signal.aborted) {
                    console.log("🛑 useMapData: Petición cancelada");
                    return;
                }

                console.log("📍 useMapData: Datos de paradas recibidos:", {
                    type: geoStops?.type,
                    features: geoStops?.features?.length || 0,
                    sample: geoStops?.features?.[0]
                });
                
                console.log("🚌 useMapData: Datos de líneas recibidos:", {
                    type: geoLines?.type,
                    features: geoLines?.features?.length || 0,
                    sample: geoLines?.features?.[0]
                });

                // Transformar los datos
                const processedStops = transformStopsData(geoStops);
                const processedLines = transformLinesData(geoLines);

                console.log("✅ useMapData: Transformación completa:", {
                    stops: processedStops.length,
                    lines: processedLines.length,
                    stopSample: processedStops[0],
                    lineSample: processedLines[0]
                });

                setStops(processedStops);
                setLines(processedLines);
                
                // Marcar como cargado
                loadedRef.current = true;

            } catch (err) {
                if (err.name === 'AbortError' || err.name === 'CanceledError') {
                    console.log('🛑 useMapData: Petición abortada');
                    return;
                } else {
                    console.error('❌ useMapData: Error al cargar datos:', err);
                    setError(err);
                }
            } finally {
                setIsLoading(false);
            }
        };

        if (adapter) {
            loadData();
        }

        return () => {
            if (!loadedRef.current) {
                controller.abort();
            }
        };
    }, [adapter]);

    return { stops, lines, isLoading, error };
};