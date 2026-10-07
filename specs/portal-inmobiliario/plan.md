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
- Cada dependencia se declara en el `package.json` del workspace que la usa (p. ej. `leaflet` y `react-leaflet` en `apps/web`); el raíz solo tiene herramientas del monorepo (`concurrently`). Así cada app se instala y despliega sola.
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

Entornos:

- **Supabase** (base principal, PostgreSQL 17): la API se conecta como el usuario propio `prisma` (`BYPASSRLS`) al pooler en modo sesión (puerto 5432, IPv4), con SSL `verify-full` contra la CA de Supabase. La API la toma del código (`src/lib/supabase-root-ca.ts`, aplicada por `src/lib/database-config.ts` a todo host de Supabase, ignorando los parámetros SSL de la URL), porque en serverless un archivo nombrado en la URL no llega a la función; el CLI de Prisma usa `apps/api/certs/prod-ca-2021.crt`. En local, servidor persistente: pooler en modo sesión (5432). En Vercel (serverless): modo transacción (6543); las migraciones se aplican desde local con `db:deploy`. `transactionOptions.maxWait` de 10 s cubre la apertura de conexiones a una base remota (antes fallaba con P2028).
- **Local** (Docker, PostgreSQL 16): `prisma migrate dev` (necesita base sombra, por eso no se ejecuta contra Supabase) y los tests, que solo aceptan una base `*_test`.
- Migraciones: se crean en local con `migrate dev` y se aplican en Supabase con `migrate deploy`.
- RLS activo en todas las tablas, sin políticas (migración `enable_row_level_security`; `_prisma_migrations` se protege a mano al configurar Supabase): con las claves públicas de Supabase (`anon` / `authenticated`) no se ven filas. La autorización sigue en la API.
- Las funciones de búsqueda tienen `search_path` fijo (migración `fix_search_function_search_path`).
- Los IDs son UUID v7 generados por la app: no hay secuencias que sincronizar al copiar datos entre bases.

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

- Solo para cuentas USER (401 sin sesión, 403 a un ADMIN). `GET` devuelve `PropertySummary[]` de las propiedades guardadas que siguen publicadas y no eliminadas, la más reciente primero.
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
- `GET /api/account/inquiries` (sesión requerida) lista las consultas del usuario por actividad más reciente (`Inquiry.lastActivityAt`: creación o último mensaje de cualquiera de los dos lados): título guardado al enviarla, mensaje, fecha, la última entrada de la conversación (`lastMessage`) y los datos actuales de la propiedad (`null` si ya no está publicada). Se muestra en «Propiedades consultadas» de `/account` como tabla, con búsqueda por título o mensaje y 6 por página, ambas en el cliente.
- `DELETE /api/account/inquiries/{id}` (sesión requerida) solo la quita de la cuenta del usuario: marca `Inquiry.hiddenByUser` y el ADMIN la sigue viendo. Responde 204; 404 si no es suya o ya estaba quitada.
- `/api/account/inquiries/**` y `/api/favorites/**` son solo para cuentas USER (403 a un ADMIN).
- Conversación (chat en la app, sin correo al usuario: Web3Forms solo escribe a la casilla dueña de la clave):
  - ADMIN: `GET /api/admin/inquiries` (`page`, `pageSize`, `search` sin distinguir mayúsculas sobre título, nombre, email y mensaje), `GET /api/admin/inquiries/{id}` (contacto, usuario asociado y conversación) y `POST …/messages` (201). Incluye las que el usuario quitó de su cuenta. Orden por `lastActivityAt`, con `lastMessage` como vista previa. `awaitingReply`: el último mensaje no es del ADMIN. Una respuesta del ADMIN devuelve la consulta a la cuenta del usuario (`hiddenByUser = false`), para que la vea.
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
- Catálogo de características (Paso 28): `GET /api/admin/features` (por nombre, con cuántas propiedades activas la usan), `POST` (201), `PUT /api/admin/features/{id}` (renombrar; aplica donde se usa) y `DELETE` (204; 409 si una propiedad activa la usa, desvincula las eliminadas). Nombre: `featureInputSchema` (2–60), único sin distinguir mayúsculas (409). Página `/admin/properties/features`; el formulario de propiedad muestra las 12 comunes y luego el resto del catálogo.
- Características: viajan como lista de nombres. Se quitan vacías y repetidas sin distinguir mayúsculas; si ya existe una con otra capitalización se reutiliza ("piscina" → "Piscina") y si no, se crea. `PUT` reemplaza el conjunto.
- Eliminar es un soft delete: `Property.deletedAt = now()`. La fila y lo relacionado (imágenes, en PostgreSQL y Cloudinary; características; favoritos; consultas) se conservan. Una eliminada se oculta en todo el portal, en las listas del usuario (favoritos; en sus consultas la propiedad llega `null` y queda el título guardado), en los indicadores del panel y en la lista activa de admin; `GET`/`PUT`/`DELETE` por id responden 404. Solo aparece en `/admin/properties?status=deleted` (filtro Estado: «Eliminadas», solo lectura, con «Eliminada el»). Sin restauración desde la UI; re-ejecutar `db:seed` restaura las propiedades de la instantánea de desarrollo (`prisma/seed/snapshot.json`), con su estado exportado.
- El filtro público vive en `publishedOnly` (`isPublished: true, deletedAt: null`, `property-repository.ts`): úsalo en toda consulta pública o de usuario.
- Usuarios (Paso 29): `GET /api/admin/users` (`page`, `pageSize`, `search` sobre nombre y email, `role`, `status` = `active`|`inactive`), `POST /api/admin/users` (`adminUserCreateSchema`: reglas del registro + rol; email usado → 409), `PATCH /api/admin/users/{id}` (`adminUserUpdateSchema`: nombre, email, contraseña nueva, `isActive`, `role`) y `DELETE /api/admin/users/{id}` (borrado definitivo: favoritos en cascada; consultas y mensajes quedan sin usuario). El ADMIN no puede cambiar ni eliminar su propia cuenta (409): evita quedarse fuera y garantiza un ADMIN activo. Desactivar o cambiar el rol aplica en la siguiente petición del usuario; una contraseña nueva cierra sus sesiones abiertas; eliminarlo invalida su sesión. Orden: el ADMIN que mira, luego los conectados y luego el resto (ADMIN primero, más recientes). «Conectado» = `User.lastSeenAt` (se actualiza en cada petición autenticada, como máximo una vez por minuto) dentro de los últimos 5 minutos (`ONLINE_WINDOW_MS`) y sin un cierre de sesión posterior (`User.loggedOutAt`); solo esos usuarios se marcan en verde. Al pasar el cursor por el estado se ve «Conectado ahora» o la última conexión (`lastSeenAt`, que se conserva al cerrar sesión). Página `/admin/users` (menú «Administrar usuarios»), 10 por página; confirmaciones con `ConfirmDialog` (`<dialog>` nativo con `showModal`).
- `GET /api/admin/dashboard`: indicadores del panel calculados en PostgreSQL (propiedades totales, publicadas, en venta y en arriendo, incluidas las no publicadas y sin contar las eliminadas; usuarios; consultas). La página `/admin` los pide desde el servidor reenviando la cookie (`fetchWithSession` en `apps/web/src/lib/session.ts`).
- Área `/admin`: layout propio y corporativo (`components/admin/admin-shell.tsx`), sin header ni footer públicos: sidebar a la izquierda, colapsable a íconos en escritorio y como cajón en móvil, con «Panel administración», «Administrar propiedades», «Administrar usuarios», «Consultas» y «Mi cuenta» (`/admin/account`: datos y contraseña del ADMIN), más «Ver sitio» y «Salir». El sitio público vive en el grupo `app/(site)` con su header y footer; el layout raíz solo define `<html>`/`<body>`.
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
- El precio (CLP) ordena sin distinguir operación: con venta y arriendo mezclados, los arriendos (mensuales) quedan al principio de «menor a mayor». Para comparar, filtrar antes por operación.
- Moneda: solo `CLP`. Los precios pasaron de USD a CLP con la migración `20261007120000_prices_in_chilean_pesos` (950 CLP/USD fijo; venta redondeada al millón y arriendo a $10.000). `formatPrice` (`apps/web/src/lib/property-format.ts`) muestra la venta en millones desde $1.000.000.

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
- Sesión: token `payload.firma` (id de usuario, emisión `iat` y expiración a 7 días, firmado con HMAC-SHA256 y `AUTH_SECRET` de al menos 32 caracteres) en la cookie `portal_session`, con `HttpOnly`, `SameSite=Lax`, `Path=/` y `Secure` en producción. Llega al navegador por el proxy `/api` (mismo origen). No se usa `localStorage`.
- Logout borra la cookie. El token no se revoca en el servidor, pero `GET /api/auth/me` (y toda protección futura) vuelve a leer el usuario: si fue eliminado o desactivado responde 401 y borra la cookie.
- Login: el mismo mensaje y el mismo tiempo para un email inexistente y una contraseña errónea (401); cuenta desactivada → 403. Tras 5 fallos en 15 minutos para un email → 429 (en memoria, por proceso).
- Registro → 201 e inicio de sesión; email ya registrado → 409. Rol USER por defecto.
- Límite por IP (`apps/api/src/lib/http/rate-limit.ts`, ventana fija en memoria, por proceso) → 429 con `Retry-After`: login 20 cada 15 min, registro 5 por hora, consultas (`POST /api/inquiries`) 10 cada 10 min. La IP es la primera de `x-forwarded-for`, que el proxy de la web pone desde la conexión si la petición no la trae; un cliente puede enviar la suya, así que este límite solo frena el abuso. El de 5 fallos por email no depende de la IP.
- Web: páginas `/login` y `/register` (vuelven a `?next=` solo si es una ruta del sitio) y el header muestra el nombre con «Salir». El usuario actual se lee con SWR (`/api/auth/me`).

Edición de la cuenta (`/account/edit`, página independiente con el botón «Editar cuenta» en `/account`):

- `PATCH /api/account/profile` actualiza nombre y email; cambiar el email (es el login) exige la contraseña actual. Email ya usado → 409.
- `PUT /api/account/password` exige la contraseña actual; la nueva cumple las reglas del registro y debe ser distinta. Respuesta 204.
- Contraseña actual incorrecta → 400. Los fallos cuentan para el mismo límite de intentos que el login (por cuenta) → 429.
- Revocación (Paso 34): el token lleva `iat` (hora de emisión). Cambiar la contraseña, el propio usuario o un ADMIN, fija `User.sessionsValidAfter`, y `getActiveUser` rechaza las sesiones emitidas antes (cierra los otros dispositivos). A quien la cambia por sí mismo se le renueva la cookie y sigue conectado. Los tokens anteriores sin `iat` lo derivan de `exp`. Cerrar sesión borra la cookie, pero no invalida en el servidor una copia robada del token (sesión sin estado, 7 días).

Autorización:

- API: todo Route Handler protegido empieza con `requireUser(request)` o `requireAdmin(request)` (`apps/api/src/lib/auth/authorization.ts`). Leen la cookie y cargan el usuario de la BD en cada petición: 401 sin sesión válida o con cuenta desactivada, 403 sin el rol. Un cambio de rol o una desactivación rige en la siguiente petición.
- Web, en tres capas:
  1. `proxy.ts` (optimista, solo mira si existe la cookie) redirige `/account/**` y `/admin/**` a `/login?next=…`.
  2. Los layouts y **cada página** privada validan la sesión con la API desde el servidor (`lib/session.ts`: `requireSessionUser`, `requireCustomerUser`, `getAdminUser`). En `/admin`, un USER ve «Acceso restringido». Las páginas de `/account/**` son solo para USER: un ADMIN se redirige a su equivalente (`/admin`, `/admin/account`, `/admin/inquiries`); su nombre en el header lleva a `/admin` y no ve el botón de favoritos. El chequeo debe estar también en la página: Next renderiza layout y página en paralelo y, con el chequeo solo en el layout, el contenido de la página viaja igual en la respuesta.
  3. La API vuelve a verificar en cada endpoint protegido: es la defensa real.
- Redirección tras el login (`?next=`): `getSafeRedirectPath` resuelve el valor como lo hará el navegador (sin tabuladores ni saltos de línea; `\` cuenta como `/`) y solo acepta el mismo origen.

Revisión de seguridad (Paso 34):

- Cabeceras: la web envía `X-Content-Type-Options: nosniff`, `X-Frame-Options: SAMEORIGIN`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy` sin cámara, micrófono, geolocalización ni pagos, y HSTS en producción. La API envía `nosniff`. Ninguna envía `X-Powered-By`.
- Comprobado sin cambios: los 27 handlers de la API (todos los privados empiezan con `requireAdmin` o `requireRole`, y validan cuerpo, query e ids con Zod); scrypt con costo OWASP y comparación en tiempo constante; sin SQL crudo ni `dangerouslySetInnerHTML`; subidas con tope de tamaño y tipo detectado por los bytes; Cloudinary firmado y con el secreto solo en la API; los errores 500 no exponen detalles; `.env*` fuera de git y la única variable `NEXT_PUBLIC_*` con valor sensible es la clave de Web3Forms, pública por diseño (se restringe por dominio en su panel).
- Riesgos aceptados o pendientes:
  - Sin CSP: los scripts inline de Next necesitarían nonces. Hacerlo antes de producción.
  - Los límites de frecuencia (login, registro, consultas) son en memoria y por proceso, y la IP sale de `x-forwarded-for`. Con varias instancias o tráfico real, usar un almacén compartido o el limitador del proveedor.
  - La subida corta por `Content-Length`; un cuerpo `chunked` se lee entero antes de comprobar el tamaño. Solo afecta a ADMIN.
  - `npm audit --omit=dev`: 4 avisos «high» en `deepmerge-ts` y `mysql2`, del CLI de `prisma` (herramienta de desarrollo; el proyecto no usa MySQL). La corrección pide bajar Prisma a la 6, y la 7.10.0 está fijada. Revisar en la próxima actualización de Prisma.
  - El primer commit (`9340794`) subió un `.env` en la raíz con `DATABASE_URL` y `JWT_SECRET` de desarrollo (quitado en `3842159`; `JWT_SECRET` ya no se usa). Si el repositorio es público y esa contraseña de BD se reutiliza, cambiarla.

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

Implementación (Paso 26):

- `POST /api/admin/properties/{id}/images` (solo ADMIN, multipart, campo `file`). Valida tamaño (≤ 5 MB; también por `Content-Length` antes de leer) y tipo por los primeros bytes (JPEG, PNG o WebP; un archivo renombrado se rechaza): 400 / 413 / 415. Propiedad inexistente o eliminada → 404 sin subir nada.
- La API sube a Cloudinary con la Upload API REST firmada (SHA-1 de los parámetros ordenados + `CLOUDINARY_API_SECRET`, `apps/api/src/lib/cloudinary.ts`), sin SDK, en la carpeta `propiedades-claude`, y guarda `secure_url` y `public_id` en `PropertyImage` (última posición; principal si no hay otra). La primera imagen propia reemplaza las de ejemplo del seed (`seed-placeholder/*`, solo se borran sus filas). Si falla la BD, se destruye el asset subido.
- Errores de Cloudinary: credenciales o permisos rechazados (401/403) → 503 «revisa la configuración»; otros → 502. La API key necesita permiso para crear (subir) y destruir assets.
- Web: sección «Imágenes» en `/admin/properties/{id}/edit`; valida en el navegador con la misma detección (`@portal/shared/property-image`). `next.config.ts` admite `res.cloudinary.com` en `next/image` (desde el Paso 32, con el loader propio).

Administración (Paso 27):

- Máximo 20 imágenes por propiedad (409, comprobado antes de subir; las de ejemplo no cuentan).
- `DELETE /api/admin/properties/{id}/images/{imageId}` → 204: destruye primero en Cloudinary (con `invalidate`) y después borra la fila; si Cloudinary falla, no cambia nada y se puede reintentar. Las `seed-placeholder/*` nunca se destruyen en Cloudinary. Si era la principal, la primera restante pasa a serlo; las posiciones quedan 0..n-1.
- `PUT /api/admin/properties/{id}/images` con `{ order, mainImageId }` (`propertyImageArrangementSchema`): `order` debe listar exactamente las imágenes de la propiedad (si no, 409); fija `position` según el orden y la principal en una transacción (primero desmarca, por el índice de principal única).
- UI: la galería del admin usa el orden público (principal primero, luego `position`); «Principal» la lleva al primer lugar, ←/→ mueven entre las demás, «Eliminar» pide confirmación. Subida múltiple secuencial con progreso.
- El soft delete de una propiedad conserva sus imágenes (en PostgreSQL y Cloudinary).

Optimización (Paso 32):

- Al subir, transformación entrante `c_limit,w_2560,h_2560` (firmada): Cloudinary guarda como máximo 2560 px por lado, sin agrandar.
- Entrega: `next/image` usa un loader propio (`images.loaderFile` → `apps/web/src/lib/image-loader.ts`). Cada imagen la redimensiona su CDN al ancho que pide `next/image`: Cloudinary con `f_auto,q_auto,c_limit,w_{ancho}` (AVIF/WebP) y Unsplash con `w`, `q` y `auto=format`. El servidor de Next no descarga originales; `/_next/image` ya no se usa. Ejemplo medido: un JPEG de 1 MB llega como WebP de 50 KB en la tarjeta.
- `sizes` de la tarjeta según la grilla real (400 px con tres columnas en el contenedor de 80rem).
- Open Graph: `toShareImageUrl` pide al CDN un JPEG de 1200×630 (`c_fill,g_auto`), no el original.
- Revisado sin cambios: no hay peticiones duplicadas (SWR deduplica `/api/auth/me`; la ficha comparte su petición entre metadata y página con `cache`; la geocodificación se cachea 30 días). Índice de `Inquiry` cambiado de `createdAt` a `lastActivityAt` (orden de ambas listas). La búsqueda usa `ILIKE '%…%'` sobre `searchText` sin índice trigram: suficiente con cientos de propiedades; con miles, `pg_trgm` + índice GIN.

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
5. Anti-spam: campo trampa (honeypot) oculto y límite de 10 consultas cada 10 minutos por IP en la API.

## 14. Errores

Utilizar códigos HTTP apropiados:

- 400
- 401
- 403
- 404
- 409
- 500

Además, donde corresponde: 413 y 415 (subida de imágenes), 429 (demasiados intentos), 502 y 503 (Cloudinary no disponible o mal configurado).

Formato recomendado:

```json
{
  "message": "Propiedad no encontrada",
  "status": 404
}
```

No exponer stack traces internos.

## 14a. Avisos (mensajes flash)

- `apps/web/src/lib/flash.ts` (`flash(texto, tono)`) y `components/ui/flash-messages.tsx`, montado en el layout raíz: avisos arriba al centro de toda página (sitio y admin), con botón para cerrar y que desaparecen a los 5 s (`FLASH_DURATION_MS`). Región `aria-live="polite"`. Los pendientes se guardan en `sessionStorage`, así sobreviven a una recarga completa (p. ej. tras cerrar sesión).
- Se usan para éxitos: login, registro y logout (`lib/auth-client.ts`); usuarios (crear, editar, activar/desactivar, eliminar); propiedades (crear, guardar, eliminar); características (crear, renombrar, eliminar). También para un logout fallido. Los errores de validación siguen junto al campo o al formulario.

## 14b. SEO (Paso 31)

- `metadataBase` en el layout raíz desde `NEXT_PUBLIC_SITE_URL`: las URLs relativas (canónica, Open Graph) se vuelven absolutas. En producción debe ser el dominio real.
- Ficha `/properties/{id}`: `generateMetadata` usa `buildPropertyMetadata` (`apps/web/src/lib/property-metadata.ts`), comparte la petición con la página (`cache`): título «{título} | Portal Inmobiliario», descripción que empieza con tipo, operación, precio y ubicación (máx. 160 caracteres, corte en palabra), canónica, Open Graph y Twitter con la imagen principal (o la primera; sin imagen, tarjeta `summary`). Si no existe, `notFound()` pone `noindex`.
- Catálogo con canónica `/properties` (filtros y páginas apuntan a la misma). El resto hereda el Open Graph del layout raíz. Next combina la metadata de forma superficial: una página que define `openGraph` reemplaza el objeto completo.

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
