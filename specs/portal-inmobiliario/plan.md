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
│       ├── app/         # (site)/: /, /properties, /account, /login… con header y footer públicos;
│       │                # admin/: /admin con su propio layout (sidebar). Grupo de rutas: no cambia URLs
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
- InquiryMessage

Relaciones:

```text
User 1 --- * Favorite * --- 1 Property
User 1 --- * Inquiry  * --- 1 Property

Inquiry 1 --- * InquiryMessage * --- 0..1 User (autor)

Property 1 --- * PropertyImage
Property * --- * Feature
```

`Inquiry.userId` puede ser nulo para permitir consultas de visitantes.

`InquiryMessage` guarda la conversación que sigue a una consulta (`fromAdmin`, `body`, autor). El mensaje original sigue en `Inquiry.message` y es el primero de la conversación.

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

- Requieren sesión (USER o ADMIN). `GET` devuelve `PropertySummary[]` de las propiedades guardadas que siguen publicadas y no eliminadas, la más reciente primero.
- `POST` (solo propiedades publicadas; si no, 404) y `DELETE` son idempotentes y responden 204. La clave primaria `(userId, propertyId)` impide duplicados.
- Web: botón de corazón en las tarjetas y en el detalle (`aria-pressed`); un visitante va al login y vuelve. `/account` lista los guardados. La lista se comparte por SWR (`/api/favorites`), una sola petición para todas las tarjetas.

Consultas:

```text
POST   /api/inquiries
GET    /api/account/inquiries
GET    /api/account/inquiries/{id}
DELETE /api/account/inquiries/{id}
POST   /api/account/inquiries/{id}/messages
GET    /api/admin/inquiries
GET    /api/admin/inquiries/{id}
POST   /api/admin/inquiries/{id}/messages
```

- `POST` es público; con sesión la consulta queda asociada al usuario.
- `GET /api/account/inquiries` (sesión requerida) lista las consultas del usuario, la más reciente primero: título guardado al enviarla, mensaje, fecha y los datos actuales de la propiedad (`null` si ya no está publicada). Se muestra en «Propiedades consultadas» de `/account` como tabla, con búsqueda por título o mensaje y 6 por página, ambas en el cliente.
- `DELETE /api/account/inquiries/{id}` (sesión requerida) solo la quita de la cuenta del usuario: marca `Inquiry.hiddenByUser` y el ADMIN la sigue viendo. Responde 204; 404 si no es suya o ya estaba quitada.
- `/api/account/inquiries/**` y `/api/favorites/**` son solo para cuentas USER (403 a un ADMIN).
- Conversación (chat en la app, sin correo al usuario: Web3Forms solo escribe a la casilla dueña de la clave):
  - ADMIN: `GET /api/admin/inquiries` (`page`, `pageSize`, `search` sin distinguir mayúsculas sobre título, nombre, email y mensaje), `GET /api/admin/inquiries/{id}` (contacto, usuario asociado y conversación) y `POST …/messages` (201). Incluye las que el usuario quitó de su cuenta. `awaitingReply`: el último mensaje no es del ADMIN.
  - USER: `GET /api/account/inquiries/{id}` y `POST …/messages` solo sobre sus consultas no quitadas (404 si no). La lista trae `adminReplyCount`.
  - Respuesta: `inquiryReplySchema` (1–2000 caracteres). A un visitante sin cuenta el ADMIN le escribe además por `mailto:`; la respuesta queda registrada igual.
  - Páginas: `/admin/inquiries` (lista) y `/admin/inquiries/{id}` (chat); el usuario, en `/account/inquiries/{id}` (enlace «Conversación» en su tabla). Sin notificaciones ni marcas de leído.

Administración:

```text
GET    /api/admin/dashboard
GET    /api/admin/properties
POST   /api/admin/properties
GET    /api/admin/properties/{id}
PUT    /api/admin/properties/{id}
DELETE /api/admin/properties/{id}
```

- Todos los endpoints `/api/admin/**` empiezan con `requireAdmin` (401 sin sesión, 403 para USER).
- CRUD de propiedades (`/api/admin/properties`): incluye las no publicadas. `GET` lista con `page`, `pageSize`, `search` (mismo `searchText` que el catálogo) y filtros que se combinan (AND): `status` (`active` por defecto = no eliminadas; `published`, `draft`, o `deleted` = solo eliminadas, de la última eliminada a la primera, con `deletedAt`), `operation`, `type`, `minPrice`/`maxPrice`, `city` (slug, como el catálogo) y `createdFrom`/`createdTo` (días de creación, YYYY-MM-DD, tomados en UTC; no existe una fecha de publicación). Rangos invertidos → 400. En `/admin/properties` son un panel colapsable (a la derecha desde `xl`) que escribe esos mismos parámetros en la URL; la ciudad se elige entre las de propiedades publicadas (`/api/properties/filter-options`) y se oculta si no hay ninguna. `POST` (201) y `PUT` (reemplazo completo) validan con `propertyInputSchema` (`@portal/shared/admin-property`): sin latitud ni longitud; publicada y destacada en `false` por defecto. `DELETE` → 204; inexistente → 404.
- Características: viajan como lista de nombres. Se quitan vacías y repetidas sin distinguir mayúsculas; si ya existe una con otra capitalización se reutiliza ("piscina" → "Piscina") y si no, se crea. `PUT` reemplaza el conjunto.
- Eliminar es un soft delete: `Property.deletedAt = now()`. La fila y lo relacionado (imágenes, en PostgreSQL y Cloudinary; características; favoritos; consultas) se conservan. Una eliminada se oculta en todo el portal, en las listas del usuario (favoritos; en sus consultas la propiedad llega `null` y queda el título guardado), en los indicadores del panel y en la lista activa de admin; `GET`/`PUT`/`DELETE` por id responden 404. Solo aparece en `/admin/properties?status=deleted` (filtro Estado: «Eliminadas», solo lectura, con «Eliminada el»). Sin restauración desde la UI; re-ejecutar `db:seed` restaura las propiedades del seed.
- El filtro público vive en `publishedOnly` (`isPublished: true, deletedAt: null`, `property-repository.ts`): úsalo en toda consulta pública o de usuario.
- `GET /api/admin/dashboard`: indicadores del panel calculados en PostgreSQL (propiedades totales, publicadas, en venta y en arriendo, incluidas las no publicadas y sin contar las eliminadas; usuarios; consultas). La página `/admin` los pide desde el servidor reenviando la cookie (`fetchWithSession` en `apps/web/src/lib/session.ts`).
- Área `/admin`: layout propio y corporativo (`components/admin/admin-shell.tsx`), sin header ni footer públicos: sidebar a la izquierda, colapsable a íconos en escritorio y como cajón en móvil, con «Panel administración», «Administrar propiedades», «Consultas» y «Mi cuenta» (`/admin/account`: datos y contraseña del ADMIN), más «Ver sitio» y «Salir». El sitio público vive en el grupo `app/(site)` con su header y footer; el layout raíz solo define `<html>`/`<body>`.
- Páginas `/admin/properties` (lista), `/admin/properties/new` y `/admin/properties/{id}/edit`: Server Components que piden la API reenviando la cookie (`fetchWithSession`; `findWithSession` devuelve `null` ante 404). La búsqueda y la página viven en la URL (`search`, `page`), con un formulario GET sin JavaScript. Eliminar es un botón cliente (`DELETE` + `router.refresh()`) con confirmación.
- Formulario (`components/admin/property-form.tsx`, lógica en `lib/property-form.ts`): componente cliente con `useState` que valida con `propertyInputSchema` antes de enviar (la API vuelve a validar). Crear hace `POST` y lleva a `/admin/properties/{id}/edit?created=1`; editar hace `PUT` y vuelve a renderizar la página. Sin latitud ni longitud.

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

Implementación (sin dependencias nuevas, con `node:crypto`):

- Contraseñas con scrypt (N=2^17, r=8, p=1, sal aleatoria), guardadas como `scrypt$N$r$p$sal$clave` para poder subir el coste más adelante.
- Sesión: token `payload.firma` (id de usuario y expiración a 7 días, firmado con HMAC-SHA256 y `AUTH_SECRET` de al menos 32 caracteres) en la cookie `portal_session`, con `HttpOnly`, `SameSite=Lax`, `Path=/` y `Secure` en producción. Llega al navegador por el proxy `/api` (mismo origen). No se usa `localStorage`.
- Logout borra la cookie. El token no se revoca en el servidor, pero `GET /api/auth/me` (y toda protección futura) vuelve a leer el usuario: si fue eliminado o desactivado responde 401 y borra la cookie.
- Login: el mismo mensaje y el mismo tiempo para un email inexistente y una contraseña errónea (401); cuenta desactivada → 403. Tras 10 fallos en 15 minutos para un email → 429 (en memoria, por proceso).
- Registro → 201 e inicio de sesión; email ya registrado → 409. Rol USER por defecto.
- Web: páginas `/login` y `/register` (vuelven a `?next=` solo si es una ruta del sitio) y el header muestra el nombre con «Salir». El usuario actual se lee con SWR (`/api/auth/me`).

Edición de la cuenta (`/account/edit`, página independiente con el botón «Editar cuenta» en `/account`):

- `PATCH /api/account/profile` actualiza nombre y email; cambiar el email (es el login) exige la contraseña actual. Email ya usado → 409.
- `PUT /api/account/password` exige la contraseña actual; la nueva cumple las reglas del registro y debe ser distinta. Respuesta 204.
- Contraseña actual incorrecta → 400. Los fallos cuentan para el mismo límite de intentos que el login (por cuenta) → 429.
- Límite: cambiar la contraseña no cierra las otras sesiones abiertas (cookie firmada sin registro en el servidor); siguen válidas hasta expirar.

Autorización:

- API: todo Route Handler protegido empieza con `requireUser(request)` o `requireAdmin(request)` (`apps/api/src/lib/auth/authorization.ts`). Leen la cookie y cargan el usuario de la BD en cada petición: 401 sin sesión válida o con cuenta desactivada, 403 sin el rol. Un cambio de rol o una desactivación rige en la siguiente petición.
- Web, en tres capas:
  1. `proxy.ts` (optimista, solo mira si existe la cookie) redirige `/account/**` y `/admin/**` a `/login?next=…`.
  2. Los layouts y **cada página** privada validan la sesión con la API desde el servidor (`lib/session.ts`: `requireSessionUser`, `requireCustomerUser`, `getAdminUser`). En `/admin`, un USER ve «Acceso restringido». Las páginas de `/account/**` son solo para USER: un ADMIN se redirige a su equivalente (`/admin`, `/admin/account`, `/admin/inquiries`); su nombre en el header lleva a `/admin` y no ve el botón de favoritos. El chequeo debe estar también en la página: Next renderiza layout y página en paralelo y, con el chequeo solo en el layout, el contenido de la página viaja igual en la respuesta.
  3. La API vuelve a verificar en cada endpoint protegido: es la defensa real.

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

Implementación (híbrida, porque el plan gratuito de Web3Forms solo acepta envíos desde el navegador; desde un servidor exige plan pago y lista blanca de IP):

1. El formulario valida en el navegador con el mismo esquema Zod que la API (`@portal/shared/inquiry`).
2. `POST /api/inquiries` valida, exige una propiedad publicada (404 si no), guarda la consulta con una copia del título y `userId` del usuario cuando hay sesión (nulo para visitantes; una cookie inválida cuenta como visitante), y responde 201.
3. Con la consulta ya guardada, el navegador la envía a Web3Forms con `NEXT_PUBLIC_WEB3FORMS_ACCESS_KEY` (pública por diseño: solo entrega correos a la casilla dueña de la clave). Incluye ID y título de la propiedad e ID de la consulta.
4. Si el correo falla, el usuario igual ve «Consulta enviada»: la consulta está en PostgreSQL y el ADMIN la verá en su panel. Si falla la API, se muestra el error y no se envía correo.
5. Anti-spam: campo trampa (honeypot) oculto. Sin limitación de tasa en la API por ahora.

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
- clave pública de Web3Forms (en `apps/web`).

Crear `.env.example` sin secretos reales en cada aplicación: `apps/api` (PostgreSQL, autenticación, Cloudinary) y `apps/web` (URL pública, `API_INTERNAL_URL`, clave pública de Web3Forms).

Los `.env.example` son el registro único de integraciones: cada servicio nuevo se documenta ahí (sección numerada, enlace para crear la clave, paso y si es secreto) con la plantilla del final de `apps/api/.env.example`. Google Maps no se usa (mapa OSM sin clave); su variable `GOOGLE_MAPS_API_KEY` queda solo documentada y comentada.

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
