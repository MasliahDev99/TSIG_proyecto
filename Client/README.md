## Paso a paso 

### Cómo cambiar la ruta de conexión de GeoServer (GEOSERVER_URL)?

1. **Ir al archivo de configuración de servicios de GeoServer:**
   - Ruta: `src/services/gsServices.js`
   - Busca la línea donde se define la constante:
     ```js
     const GEOSERVER_URL = 'http://localhost:8080/geoserver/tsig2025/wms';
     ```
   - Cambia la URL por la que corresponda a tu servidor GeoServer.

2. **¿Dónde se utiliza esta URL?**
   - La constante `GEOSERVER_URL` se utiliza en la función `fetchGeoServerFeatures` dentro del mismo archivo.
   - Esta función es llamada por el adaptador `gsAdapter` en `src/adapters/gsAdapter.js`.

3. **¿Dónde se usa el adaptador gsAdapter?**
   - El adaptador `gsAdapter` es importado y utilizado en el componente `MapView`:
     - Ruta: `src/components/mapview/MapView.jsx`
     - Allí se llama a los métodos `gsAdapter.getStopFromGeoServer()` y `gsAdapter.getLineFromGeoServer()` para obtener datos de GeoServer.

4. **Resumen de la cadena de uso:**
   - `MapView.jsx` → usa → `gsAdapter.js` → llama a → `fetchGeoServerFeatures` en `gsServices.js` → usa → `GEOSERVER_URL`

5. **Reinicia tu servidor de desarrollo** para que los cambios tengan efecto.

---

**Archivos involucrados:**
- `src/services/gsServices.js` (donde cambias la URL)
- `src/adapters/gsAdapter.js` (donde se usa el servicio)
- `src/components/mapview/MapView.jsx` (donde se usa el adaptador)
