import { useEffect, useState } from "react";
import { transformStopsData, transformLinesData } from "@/libs/transformers";

export const useMapData = (adapter) => {
  const [stops, setStops] = useState([]);
  const [lines, setLines] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const controller = new AbortController();
    const signal = controller.signal;

    const loadData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const [geoStops, geoLines] = await Promise.all([
          adapter.getStopsFromGeoServer(signal),
          adapter.getLinesFromGeoServer(signal)
        ]);

        const featuresStops = Array.isArray(geoStops?.features) ? geoStops.features : [];
        const featuresLines = Array.isArray(geoLines?.features) ? geoLines.features : [];

        const processedStops = transformStopsData(featuresStops);
        const processedLines = transformLinesData(featuresLines);

        setStops(processedStops);
        setLines(processedLines);
      } catch (err) {
        if (err.name === "AbortError" || err.name === "CanceledError") {
          console.log("Fetch aborted");
        } else {
          console.error("[src/hooks/useMapData.js -> loadData] Error al cargar datos:", err);
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
      controller.abort();
    };
  }, [adapter]);

  return { stops, lines, isLoading, error };
};
