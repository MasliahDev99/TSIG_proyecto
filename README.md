
# Taller de Sistemas de Información Geográficos  
## Tecnólogo en Informática – Proyecto 2025

### Introducción

Este proyecto busca optimizar la gestión de paradas en Rutas Nacionales mediante el registro de paradas oficiales y líneas de transporte. La herramienta provee un mapa interactivo para usuarios de transporte público, permitiendo realizar filtros y búsquedas de líneas o paradas según diferentes criterios.

### Características principales

- **Mapa interactivo:** Visualización de paradas y líneas de transporte en rutas nacionales.
- **Filtros avanzados:** Búsqueda por origen, destino, empresa, horarios, estado (habilitada/deshabilitada), y proximidad a la ubicación del usuario.
- **Gestión de datos:** Registro y edición de paradas, líneas, empresas, horarios, frecuencias, recorridos y observaciones.
- **Perfiles de usuario:**  
  - **Usuario anónimo:** Puede visualizar el mapa, consultar y filtrar información.  
  - **Usuario administrador:** Acceso a edición y configuración de datos, incluyendo agregar, modificar o eliminar paradas y líneas.

### Requerimientos funcionales

- **Administrador:**  
  - Login seguro.  
  - Registro y edición de paradas (nombre, ruta, departamento, sentido, estado, refugio, observaciones).  
  - Registro y edición de líneas (ID, descripción, horario, empresa, origen, destino, observaciones).  
  - Edición de recorridos y asociación de paradas-líneas.  
  - Eliminación de paradas o líneas, con gestión de asociaciones.

- **Usuario anónimo:**  
  - Visualización de mapa con paradas y líneas cercanas.  
  - Búsqueda avanzada por diferentes criterios.  
  - Consulta de detalles de líneas y horarios en paradas.

### Requerimientos opcionales (implementado al menos uno)

- Control de solapamiento de recorridos y validación de ubicación de paradas sobre rutas.
- Sugerencia de línea/parada más cercana para llegar a un destino desde la ubicación del usuario.

### Instalación y uso

1. **Requisitos:**  
   - Node.js y npm instalados.
   - Base de datos PostgreSQL con PostGIS.
   - (Opcional) GeoServer para capas de mapas.

2. **Instalación:**  
   - Clonar el repositorio.  
   - Instalar dependencias con `npm install`.  
   - Configurar la base de datos en el archivo `.env`.  
   - Iniciar la aplicación con `npm start`.

3. **Acceso:**  
   - Usuario anónimo: acceso libre al mapa.  
   - Usuario administrador: credenciales provistas por el equipo.
  


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

---

### Cómo cambiar el sistema de referencia espacial (`srsName`)

La función `fetchGeoServerFeatures` permite definir el sistema de referencia espacial (SRS) que utiliza tu GeoServer. Por defecto se usa `EPSG:4326`, pero si tu servidor utiliza otro (por ejemplo, `EPSG:3857`), puedes cambiarlo de dos maneras:

1. **Al llamar la función desde el adaptador:**
   ```js
   fetchGeoServerFeatures({
     typeName: 'montevideo:paradas',
     srsName: 'EPSG:3857' // Cambia este valor según tu configuración
   })
   ```
2. O modificando el valor por defecto en la función:
   ```js
       export async function fetchGeoServerFeatures({
      typeName,
      bbox,
      srsName = 'EPSG:4326' // Cambia este valor si tu GeoServer usa otro SRS
      }) {
      // ...
      }
   ```
Importante: Revisar de que el srsName coincida con el sistema de referencia configurado en tu GeoServer y en las capas que vas a consumir.

