# Plan técnico — Portal Inmobiliario

## 1. Arquitectura

Monorepo (npm workspaces) con dos aplicaciones Next.js separadas y una arquitectura REST clara.

```text
apps/web (Next.js + React, puerto 3000)
      │
    fetch(/api/**) ── proxy (rewrites) ──┐
                                         │
                                         ▼
apps/api (Next.js Route Handlers, puerto 4000)
API REST /api/**
      │
      ▼
Capa de servicios
      │
      ▼
Repositorio / ORM
      │
      ▼
PostgreSQL
```

Integraciones externas:

```text
Cloudinary  → imágenes
OpenStreetMap → mapa de ubicación (Leaflet; geocodificación con Nominatim)
Web3Forms   → contacto
```

## 2. Tecnologías obligatorias

- Next.js
- React
- TypeScript
- PostgreSQL
- API REST con Route Handlers de Next.js
- Cloudinary
- Leaflet + React-Leaflet + OpenStreetMap
- Web3Forms

## 3. Restricciones

- No utilizar Server Actions.
- No acceder a PostgreSQL directamente desde componentes React.
- No almacenar imágenes binarias en PostgreSQL.
- No exigir latitud/longitud en el formulario ADMIN.
- No implementar funcionalidades especulativas fuera de `spec.md`.

## 4. Estructura (monorepo)

```text
apps/
├── web/                 # @portal/web — frontend Next.js (sin acceso a DB)
│   └── src/
│       ├── app/         # páginas: /, /properties, /account, /admin, ...
│       ├── components/
│       ├── hooks/
│       └── lib/         # cliente REST, formateo, utilidades de UI
└── api/                 # @portal/api — backend Next.js (solo Route Handlers)
    ├── prisma/          # schema, migraciones y seed
    └── src/
        ├── app/api/     # Route Handlers REST
        ├── services/
        ├── repositories/
        └── lib/         # Prisma, entorno, errores HTTP
packages/
└── shared/              # @portal/shared — contrato REST compartido
    └── src/             # tipos de respuesta, enums y esquemas Zod
```

Reglas del monorepo:

- `apps/web` no depende de Prisma ni de `apps/api`; solo de `@portal/shared`.
- El navegador solo conoce el origen del frontend: `apps/web` reenvía `/api/**` a `apps/api` mediante rewrites (`API_INTERNAL_URL`). Mismo origen: cookies de sesión sin CORS.
- Los Server Components del frontend pueden llamar al backend por `API_INTERNAL_URL`.
- Los enums compartidos deben coincidir con los de Prisma (verificado por pruebas en `apps/api`).
- Adaptar cuando las convenciones actuales de Next.js lo justifiquen sin romper la separación de responsabilidades.

## 5. Modelo de datos

Entidades:

- User
- Property
- PropertyImage
- Feature
- Favorite
- Inquiry

Relaciones:

```text
User 1 --- * Favorite * --- 1 Property
User 1 --- * Inquiry  * --- 1 Property

Property 1 --- * PropertyImage
Property * --- * Feature
```

`Inquiry.userId` puede ser nulo para permitir consultas de visitantes.

## 6. Persistencia

PostgreSQL es la única base de datos.

Seleccionar un ORM compatible con las versiones actuales de Next.js y PostgreSQL.

Requisitos:

- migraciones;
- claves foráneas;
- restricciones de unicidad;
- índices cuando estén justificados;
- seed para desarrollo.

Restricciones importantes:

- `User.email` único;
- combinación `(userId, propertyId)` única en favoritos.

## 7. API REST

Propiedades públicas:

```text
GET /api/properties
GET /api/properties/{id}
```

Autenticación:

```text
POST /api/auth/register
POST /api/auth/login
POST /api/auth/logout
GET  /api/auth/me
```

Favoritos:

```text
GET    /api/favorites
POST   /api/favorites/{propertyId}
DELETE /api/favorites/{propertyId}
```

Consultas:

```text
POST /api/inquiries
```

Administración:

```text
GET    /api/admin/properties
POST   /api/admin/properties
GET    /api/admin/properties/{id}
PUT    /api/admin/properties/{id}
DELETE /api/admin/properties/{id}
```

Crear recursos REST adicionales cuando sean necesarios para:

- imágenes;
- características;
- usuarios;
- consultas.

## 8. Responsabilidades

### Route Handlers

- recibir y analizar HTTP;
- validar entrada básica;
- invocar servicios;
- devolver respuestas HTTP.

### Servicios

- lógica de aplicación;
- reglas de negocio;
- coordinación de persistencia e integraciones.

### Repositorios / ORM

- persistencia;
- consultas a PostgreSQL;
- sin lógica de presentación.

### React

- interfaz;
- interacción;
- estado visual;
- consumo de REST;
- sin acceso directo a base de datos.

## 9. Búsqueda y filtros

`GET /api/properties` debe soportar parámetros como:

```text
search
operation
type
minPrice
maxPrice
bedrooms
bathrooms
minUsableArea
commune
city
region
sort
```

El filtrado y ordenamiento debe ejecutarse principalmente en PostgreSQL y no cargando todo el catálogo en el navegador.

### Filtros

- Todos se combinan (AND) y viven en la URL con los mismos nombres que en la API.
- `bedrooms`, `bathrooms` y `minUsableArea` son mínimos («3» = 3 o más); excluyen propiedades sin ese dato (p. ej. terrenos sin dormitorios).
- `commune`, `city` y `region` usan slugs (`las-condes`, `nunoa`, `region-metropolitana`), insensibles a mayúsculas y acentos. La API los traduce a los nombres guardados; un slug desconocido devuelve 0 resultados.
- Las ubicaciones admiten varios valores repitiendo el parámetro (`?commune=las-condes&commune=providencia`, máx. 20 por campo): coincide cualquiera de ellos. Repetir un parámetro de valor único (p. ej. `type`) devuelve 400.
- En el catálogo la barra de filtros va a la izquierda y es plegable en todas las pantallas (abierta por defecto en escritorio, plegada en móvil); las ubicaciones se eligen con casillas.
- `GET /api/properties/filter-options` entrega las regiones, ciudades y comunas con propiedades publicadas (`{ slug, name }`) para el formulario.
- La API responde 400 a valores inválidos (`minPrice` > `maxPrice` con mensaje específico). El catálogo ignora valores inválidos de una URL editada en vez de fallar.

### Ordenamiento

- Parámetro `sort`: `newest` (por defecto, más recientes), `price-asc`, `price-desc`, `area-asc`, `area-desc`. Un valor desconocido o repetido devuelve 400; la URL del catálogo omite el valor por defecto.
- Todos los órdenes terminan con los mismos desempates (fecha e id), así la paginación no repite ni omite propiedades entre páginas.
- «Superficie» es la superficie útil; las propiedades sin ella (terrenos) quedan al final, ordenadas por superficie total.
- El precio ordena en USD sin distinguir operación: con venta y arriendo mezclados, los arriendos (mensuales) quedan al principio de «menor a mayor». Para comparar, filtrar antes por operación.

### Estados del catálogo

- Carga inicial: esqueletos. Al cambiar página, filtros, búsqueda u orden, la lista previa permanece atenuada (`aria-busy`) hasta que llegan los nuevos resultados, sin parpadeo.
- Error: mensaje con botón «Reintentar». Vacío: mensaje según el contexto (sin publicadas, sin coincidencias con búsqueda o filtros, página inexistente).

### Búsqueda textual

- Busca en título, descripción, comuna, ciudad y región, **sin distinguir mayúsculas ni acentos** (`maipu` encuentra «Maipú»; `nunoa`, «Ñuñoa»; y viceversa).
- Varias palabras: todas deben aparecer, cada una en cualquiera de los campos. Máximo 5 palabras y 100 caracteres.
- `Property.searchText` guarda el texto normalizado (minúsculas, sin diacríticos mediante Unicode NFD) y lo mantiene un trigger de PostgreSQL (`search_normalize()`): ninguna escritura debe asignarlo. La API normaliza las palabras buscadas con la misma regla (`normalizeSearchText`); un test compara ambas implementaciones.
- Los comodines `%` y `_` se escapan: se buscan como texto literal.
- No se usa la extensión `unaccent`: evita requerir permisos de extensión. Requiere PostgreSQL 13+ y base UTF8.
- Si el catálogo crece, añadir un índice trigram (`pg_trgm`, GIN) sobre `searchText`.

## 10. Autenticación y autorización

Utilizar un mecanismo seguro compatible con la API REST.

Requisitos:

- hashing de contraseñas;
- almacenamiento seguro de sesión/token;
- autorización en servidor;
- no almacenar tokens sensibles en `localStorage`;
- usuarios inactivos no pueden autenticarse;
- endpoints ADMIN requieren ADMIN;
- endpoints privados USER requieren autenticación.

## 11. Cloudinary

Flujo:

```text
ADMIN
  │
selecciona archivo
  │
  ▼
API REST
  │
  ▼
Cloudinary
  │
 URL + publicId
  │
  ▼
PostgreSQL
```

Validar:

- tipo;
- tamaño;
- autorización.

La eliminación debe mantener sincronizados Cloudinary y PostgreSQL.

## 12. Mapa (Leaflet + OpenStreetMap)

Construir la ubicación utilizando:

- dirección;
- comuna;
- ciudad;
- región;
- país.

No solicitar coordenadas manuales.

Implementación (sin claves):

- El page del detalle geocodifica en el servidor de `apps/web` con Nominatim (`lib/geocoding.ts`) la consulta «dirección, comuna, ciudad, región, Chile» (el país no se guarda: todas las propiedades están en Chile). Si no encuentra la calle, usa la comuna con un zoom más alejado. Caché de 30 días y `User-Agent` propio, según la política de uso de Nominatim (≈1 req/s).
- El mapa usa Leaflet + React-Leaflet con tiles de OpenStreetMap y atribución OSM. Se carga solo en el navegador (`next/dynamic` con `ssr: false`).
- La dirección (en azul, sobre el mapa) y el enlace «Abrir en Google Maps» (debajo del mapa) abren Google Maps con la dirección, sin clave. Si la geocodificación falla, se ve solo el enlace.
- Con tráfico real, guardar las coordenadas en la BD desde la API al guardar la propiedad (transparente para ADMIN).

Si posteriormente se requiere geocodificación interna, debe ser transparente para ADMIN y no modificar los campos obligatorios del formulario.

## 13. Web3Forms

Flujo:

1. validar datos;
2. identificar propiedad;
3. identificar usuario autenticado cuando exista;
4. persistir consulta;
5. enviar mediante Web3Forms;
6. devolver una respuesta REST consistente.

Definir un comportamiento claro ante fallos para evitar perder silenciosamente una consulta.

## 14. Errores

Utilizar códigos HTTP apropiados:

- 400
- 401
- 403
- 404
- 409
- 500

Formato recomendado:

```json
{
  "message": "Propiedad no encontrada",
  "status": 404
}
```

No exponer stack traces internos.

## 15. Variables de entorno

Utilizar variables de entorno para:

- conexión PostgreSQL;
- secretos de autenticación;
- credenciales Cloudinary;
- clave Web3Forms.

Crear `.env.example` sin secretos reales en cada aplicación: `apps/api` (PostgreSQL, autenticación, Cloudinary, Web3Forms) y `apps/web` (URL pública, `API_INTERNAL_URL`).

## 16. Validación

Como mínimo validar:

- build;
- migraciones;
- endpoints REST;
- autenticación;
- autorización;
- filtros;
- favoritos;
- consultas;
- subida/eliminación Cloudinary;
- CRUD ADMIN;
- comportamiento responsive.

## 17. Definición de terminado

Una tarea está terminada cuando:

- cumple `spec.md`;
- respeta este plan;
- el build pasa;
- las validaciones correspondientes pasan;
- no quedan errores bloqueantes;
- su checkbox se actualiza en `tasks.md`.
