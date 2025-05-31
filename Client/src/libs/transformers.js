/**
 * @file transformers.js
 * @module libs/transformers
 * @description Funciones de transformación de datos corregidas para manejar correctamente
 * los datos de GeoServer y crear las estructuras necesarias para OpenLayers.
 */

/**
 * Transforma los datos crudos de paradas de ómnibus (formato GeoJSON) a un formato estructurado.
 */
export const transformStopsData = (geoStops) => {
  console.log('Transformando paradas:', geoStops?.features?.length || 0, 'features');
  
  // Verificación de seguridad
  if (!geoStops || !geoStops.features) {
      console.warn('⚠️ No hay datos de paradas para transformar');
      return [];
  }

  // Mapea cada 'feature' (parada) del GeoJSON a un nuevo objeto con la estructura deseada.
  const transformedStops = geoStops.features.map((f, index) => {
      console.log(`Properties de parada ${index}:`, f.properties);
      console.log(`Geometry de parada ${index}:`, f.geometry);

      return {
          id: f.properties.nombre || f.properties.id || index, // Usar nombre como ID si no hay stop_id
          name: f.properties.nombre || f.properties.stop_name || `Parada ${index}`,
          lat: f.geometry.coordinates[1],
          lng: f.geometry.coordinates[0],
          enabled: f.properties.estado !== false, // Por defecto true si no se especifica
          type: 'stop', // Importante: tipo para useVectorLayer
          coordinates: f.geometry.coordinates, // Coordenadas para useVectorLayer
          properties: f.properties, // Propiedades adicionales
          // Datos adicionales específicos del proyecto
          ruta: f.properties.ruta,
          departamento: f.properties.departamento,
          sentido: f.properties.sentido,
          refugio: f.properties.refugio || false,
          observaciones: f.properties.observaciones || ''
      };
  });

  console.log('✅ Paradas transformadas:', transformedStops.length);
  console.log('Muestra de parada transformada:', transformedStops[0]);
  
  return transformedStops;
};

/**
* Transforma los datos crudos de líneas de ómnibus (formato GeoJSON) a un formato estructurado.
*/
export const transformLinesData = (geoLines) => {
  console.log('Transformando líneas:', geoLines?.features?.length || 0, 'features');
  
  // Verificación de seguridad
  if (!geoLines || !geoLines.features) {
      console.warn('⚠️ No hay datos de líneas para transformar');
      return [];
  }

  const transformedLines = geoLines.features.map((f, index) => {
      console.log(`Properties de línea ${index}:`, f.properties);
      console.log(`Geometry de línea ${index}:`, f.geometry);

      return {
          id: f.properties.descripcion || f.properties.id || index,
          description: f.properties.descripcion || `Línea ${index}`,
          company: f.properties.empresa || 'No especificada',
          origin: f.properties.origen || 'No especificado',
          destination: f.properties.destino || 'No especificado',
          enabled: f.properties.estado !== false, // Por defecto true
          type: 'line', // Importante: tipo para useVectorLayer
          coordinates: f.geometry.coordinates, // Para useVectorLayer
          properties: f.properties, // Propiedades adicionales
          geometry: f.geometry, // Geometría completa
          // Datos adicionales
          horario: f.properties.horario,
          empresa_id: f.properties.empresa_id,
          observaciones: f.properties.observaciones || ''
      };
  });

  console.log('✅ Líneas transformadas:', transformedLines.length);
  console.log('Muestra de línea transformada:', transformedLines[0]);
  
  return transformedLines;
};