
/**
 * @file transformers.js
 * @module libs/transformers
 * @description Este módulo contiene funciones "puras" de transformación de datos.
 *              Su objetivo es convertir los datos geoespaciales crudos (generalmente en formato GeoJSON)
 *              obtenidos de GeoServer a un formato más estructurado y amigable para ser utilizado
 *              dentro de la aplicación React (por ejemplo, por los componentes del mapa o los hooks).
 *              Funciones puras significa que, para la misma entrada, siempre producirán la misma salida
 *              y no tienen efectos secundarios (no modifican variables fuera de su ámbito).
 */

/**
 * Transforma los datos crudos de paradas de ómnibus (formato GeoJSON) a un formato estructurado.
 *
 * @param {object} geoStops - Un objeto GeoJSON que representa una colección de "features" (paradas).
 *                            Se espera que cada feature tenga una sección `properties` con los atributos
 *                            de la parada y una sección `geometry` con las coordenadas.
 * @returns {Array<object>} Un arreglo de objetos, donde cada objeto representa una parada con el siguiente formato:
 *  - `id` (string | number): Identificador único de la parada (ej. `f.properties.stop_id`).
 *  - `name` (string): Nombre o descripción de la parada (ej. `f.properties.stop_name`).
 *  - `lat` (number): Latitud de la parada (ej. `f.geometry.coordinates[1]`).
 *  - `lng` (number): Longitud de la parada (ej. `f.geometry.coordinates[0]`).
 *  - `enabled` (boolean): Indica si la parada está activa o habilitada (ej. `f.properties.activa`).
 *  - `lines` (Array<number>): Un arreglo de números que representan los IDs de las líneas que pasan por esa parada.
 *                               Se extrae de `f.properties.lineas` (que se espera sea un string separado por comas)
 *                               y se convierte a un arreglo de números. Si `f.properties.lineas` no existe o está vacío,
 *                               se devuelve un arreglo vacío.
 * Si `geoStops` o `geoStops.features` es nulo o indefinido, devuelve un arreglo vacío para evitar errores.
 *
 * @example
 * const geoJsonData = {
 *   type: "FeatureCollection",
 *   features: [
 *     {
 *       type: "Feature",
 *       properties: { stop_id: "P1", stop_name: "Parada Central", activa: true, lineas: "101,102" },
 *       geometry: { type: "Point", coordinates: [-56.1645, -34.9011] }
 *     }
 *   ]
 * };
 * const processedStops = transformStopsData(geoJsonData);
 * // processedStops contendría:
 * // [
 * //   { id: "P1", name: "Parada Central", lat: -34.9011, lng: -56.1645, enabled: true, lines: [101, 102] }
 * // ]
 */
export const transformStopsData = (geoStops) => {
    // Verificación de seguridad: si no hay datos o no hay 'features', devuelve un array vacío.
    if (!geoStops || !geoStops.features) return [];

    // Mapea cada 'feature' (parada) del GeoJSON a un nuevo objeto con la estructura deseada.
    return geoStops.features.map((f) => ({
        id: f.properties.stop_id,          // Asigna el ID de la parada.
        name: f.properties.stop_name,      // Asigna el nombre de la parada.
        lat: f.geometry.coordinates[1],    // Asigna la latitud (segundo elemento del array de coordenadas).
        lng: f.geometry.coordinates[0],    // Asigna la longitud (primer elemento del array de coordenadas).
        enabled: f.properties.activa,      // Asigna el estado de activación de la parada.
        // Procesa el string de líneas: si existe, lo divide por comas y convierte cada parte a número.
        // Si no existe f.properties.lineas, devuelve un array vacío.
        lines: f.properties.lineas ? f.properties.lineas.split(",").map(Number): [] 
    }));
}


/**
 * Transforma los datos crudos de líneas de ómnibus (formato GeoJSON) a un formato estructurado.
 *
 * @param {object} geoLines - Un objeto GeoJSON que representa una colección de "features" (líneas).
 *                            Se espera que cada feature tenga una sección `properties` con los atributos
 *                            de la línea y una sección `geometry` (usualmente `MultiLineString` o `LineString`)
 *                            con las coordenadas que definen la ruta.
 * @returns {Array<object>} Un arreglo de objetos, donde cada objeto representa una línea con el siguiente formato:
 *  - `id` (string | number): Identificador único de la línea (ej. `f.properties.id`).
 *  - `description` (string): Nombre o descripción de la línea (ej. `f.properties.descripcion`).
 *  - `company` (string): Nombre de la empresa operadora (ej. `f.properties.empresa`).
 *  - `origin` (string): Origen de la línea (ej. `f.properties.origen`).
 *  - `destination` (string): Destino de la línea (ej. `f.properties.destino`).
 *  - `enabled` (boolean): Indica si la línea está activa o habilitada (ej. `f.properties.activa`).
 *  - `route` (Array<[number, number]>): Un arreglo de pares de coordenadas [longitud, latitud]
 *                                       que definen el trazado de la línea (ej. `f.geometry.coordinates`).
 * Si `geoLines` o `geoLines.features` es nulo o indefinido, devuelve un arreglo vacío.
 *
 * @example
 * const geoJsonLinesData = {
 *   type: "FeatureCollection",
 *   features: [
 *     {
 *       type: "Feature",
 *       properties: { id: "L101", descripcion: "Línea 101", empresa: "CUTCSA", origen: "Centro", destino: "Pocitos", activa: true },
 *       geometry: { type: "LineString", coordinates: [[-56.16, -34.90], [-56.15, -34.91]] }
 *     }
 *   ]
 * };
 * const processedLines = transformLinesData(geoJsonLinesData);
 * // processedLines contendría:
 * // [
 * //   { id: "L101", description: "Línea 101", company: "CUTCSA", origin: "Centro", destination: "Pocitos", enabled: true, route: [[-56.16, -34.90], [-56.15, -34.91]] }
 * // ]
 */
export const transformLinesData = (geoLines) => {
    // Verificación de seguridad.
    if (!geoLines || !geoLines.features) return [];

    // Mapea cada 'feature' (línea) a un nuevo objeto.
    return geoLines.features.map(f => ({
      id: f.properties.id,                      // ID de la línea.
      description: f.properties.descripcion,    // Descripción o nombre de la línea.
      company: f.properties.empresa,            // Empresa operadora.
      origin: f.properties.origen,              // Punto de origen de la línea.
      destination: f.properties.destino,        // Punto de destino de la línea.
      enabled: f.properties.activa,             // Estado de activación.
      route: f.geometry.coordinates,            // Coordenadas que forman la ruta de la línea.
    }));
  };