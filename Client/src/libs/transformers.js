/**
 * @file transformers.js
 * @module libs/transformers
 * @description Funciones de transformación de datos robustas para manejar correctamente
 * los datos de GeoServer y crear las estructuras necesarias para OpenLayers.
 */

/**
 * Transforma los datos crudos de paradas de ómnibus (formato GeoJSON) a un formato estructurado.
 */
export const transformStopsData = (geoStops) => {
  console.log('🔄 Transformando paradas:', geoStops?.features?.length || 0, 'features');
  
  // Verificación de seguridad
  if (!geoStops || !geoStops.features) {
      console.warn('⚠️ No hay datos de paradas para transformar');
      return [];
  }

  // Log de muestra de datos raw
  if (geoStops.features.length > 0) {
    console.log('📋 Muestra de parada raw:', geoStops.features[0]);
  }

  // Mapea cada 'feature' (parada) del GeoJSON a un nuevo objeto con la estructura deseada.
  const transformedStops = geoStops.features.map((f, index) => {
      console.log(`🔄 Transformando parada ${index}:`, {
        properties: f.properties,
        geometry: f.geometry,
        geometryType: f.geometry?.type,
        coordinates: f.geometry?.coordinates
      });

      // Extraer coordenadas según el tipo de geometría
      let coordinates = null;
      let lat = null;
      let lng = null;

      if (f.geometry) {
        if (f.geometry.type === 'Point' && f.geometry.coordinates) {
          coordinates = f.geometry.coordinates;
          lng = f.geometry.coordinates[0];
          lat = f.geometry.coordinates[1];
        } else {
          console.warn(`⚠️ Geometría inesperada para parada ${index}:`, f.geometry);
        }
      }

      const transformed = {
          id: f.properties?.nombre || f.properties?.id || f.properties?.stop_id || `parada_${index}`,
          name: f.properties?.nombre || f.properties?.stop_name || `Parada ${index}`,
          lat: lat,
          lng: lng,
          enabled: f.properties?.estado !== false && f.properties?.enabled !== false, // Por defecto true
          type: 'stop', // Importante: tipo para useVectorLayer
          coordinates: coordinates, // Coordenadas para useVectorLayer
          properties: f.properties || {}, // Propiedades adicionales
          // Datos adicionales específicos del proyecto
          ruta: f.properties?.ruta,
          departamento: f.properties?.departamento,
          sentido: f.properties?.sentido,
          refugio: f.properties?.refugio || f.properties?.hasRefuge || false,
          observaciones: f.properties?.observaciones || ''
      };

      console.log(`✅ Parada ${index} transformada:`, transformed);
      return transformed;
  });

  console.log('✅ Paradas transformadas:', transformedStops.length);
  console.log('📍 Primera parada transformada:', transformedStops[0]);
  
  return transformedStops;
};

/**
* Transforma los datos crudos de líneas de ómnibus (formato GeoJSON) a un formato estructurado.
*/
export const transformLinesData = (geoLines) => {
  console.log('🔄 Transformando líneas:', geoLines?.features?.length || 0, 'features');
  
  // Verificación de seguridad
  if (!geoLines || !geoLines.features) {
      console.warn('⚠️ No hay datos de líneas para transformar');
      return [];
  }

  // Log de muestra de datos raw
  if (geoLines.features.length > 0) {
    console.log('📋 Muestra de línea raw:', geoLines.features[0]);
  }

  const transformedLines = geoLines.features.map((f, index) => {
      console.log(`🔄 Transformando línea ${index}:`, {
        properties: f.properties,
        geometry: f.geometry,
        geometryType: f.geometry?.type,
        coordinatesLength: f.geometry?.coordinates?.length
      });

      // Extraer coordenadas según el tipo de geometría
      let coordinates = null;
      
      if (f.geometry) {
        if (f.geometry.type === 'LineString') {
          coordinates = f.geometry.coordinates;
          console.log(`🚌 LineString encontrado con ${coordinates?.length} puntos`);
        } else if (f.geometry.type === 'MultiLineString') {
          // Para MultiLineString, usar la primera línea
          coordinates = f.geometry.coordinates[0];
          console.log(`🚌 MultiLineString encontrado, usando primera línea con ${coordinates?.length} puntos`);
        } else if (f.geometry.type === 'Polygon') {
          // Para Polygon, usar el primer anillo exterior
          coordinates = f.geometry.coordinates[0];
          console.log(`🚌 Polygon encontrado, usando primer anillo con ${coordinates?.length} puntos`);
        } else {
          console.warn(`⚠️ Geometría inesperada para línea ${index}:`, f.geometry);
          coordinates = f.geometry.coordinates;
        }
      }

      const transformed = {
          id: f.properties?.descripcion || f.properties?.id || f.properties?.line_id || `linea_${index}`,
          description: f.properties?.descripcion || f.properties?.description || `Línea ${index}`,
          company: f.properties?.empresa || f.properties?.company || 'No especificada',
          origin: f.properties?.origen || f.properties?.origin || 'No especificado',
          destination: f.properties?.destino || f.properties?.destination || 'No especificado',
          enabled: f.properties?.estado !== false && f.properties?.enabled !== false, // Por defecto true
          type: 'line', // Importante: tipo para useVectorLayer
          coordinates: coordinates, // Para useVectorLayer
          properties: f.properties || {}, // Propiedades adicionales
          geometry: f.geometry, // Geometría completa
          // Datos adicionales
          horario: f.properties?.horario || f.properties?.schedule,
          empresa_id: f.properties?.empresa_id || f.properties?.company_id,
          observaciones: f.properties?.observaciones || f.properties?.notes || ''
      };

      console.log(`✅ Línea ${index} transformada:`, {
        id: transformed.id,
        description: transformed.description,
        type: transformed.type,
        coordinatesCount: transformed.coordinates?.length,
        enabled: transformed.enabled
      });
      
      return transformed;
  });

  console.log('✅ Líneas transformadas:', transformedLines.length);
  console.log('🚌 Primera línea transformada:', transformedLines[0]);
  
  return transformedLines;
};