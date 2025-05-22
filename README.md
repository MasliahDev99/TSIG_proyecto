
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

### Enlaces útiles

- [Desafío ANII - Gestión de paradas de transporte público](https://anii.org.uy/apoyos/innovacion/407/desafio-gestion-de-paradas-de-transporte-publico-en-rutas-nacionales/)

