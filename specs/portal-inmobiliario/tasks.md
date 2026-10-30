# Tareas — Portal Inmobiliario

> Ejecutar las tareas en orden. No comenzar la siguiente hasta implementar y validar la actual.

## Fase 1 — Fundamentos

- [x] **Paso 1 — Crear proyecto Next.js**
  - Crear proyecto con React y TypeScript.
  - Configurar estructura básica.
  - Crear `.env.example`.
  - Validar servidor de desarrollo y build.

- [x] **Paso 2 — Layout y navegación**
  - Crear header, navegación, footer y layout.
  - Agregar diseño responsive base.
  - Navegación: Inicio, Propiedades, Comprar, Arrendar, Ingresar.

- [x] **Paso 3 — Configurar PostgreSQL**
  - Configurar PostgreSQL.
  - Seleccionar y configurar ORM.
  - Configurar migraciones.
  - Validar conexión.

- [x] **Paso 4 — Crear modelo de dominio**
  - User.
  - Property.
  - PropertyImage.
  - Feature.
  - Favorite.
  - Inquiry.
  - Crear relaciones y constraints.
  - Ejecutar migraciones.

- [x] **Paso 5 — Crear seed**
  - Propiedades realistas de venta y arriendo.
  - Casas, departamentos, terrenos y oficinas.
  - Diferentes comunas, precios y características.

## Fase 2 — Portal público

- [x] **Paso 6 — API REST pública de propiedades**
  - `GET /api/properties`.
  - `GET /api/properties/{id}`.
  - Mostrar públicamente solo propiedades publicadas.
  - Separar API, servicios y persistencia.

- [x] **Paso 7 — Landing page**
  - Hero.
  - Buscador.
  - Propiedades destacadas.
  - Secciones comprar y arrendar.
  - Llamadas a la acción.

- [x] **Paso 7.1 — Reorganizar en monorepo**
  - npm workspaces: `apps/web`, `apps/api`, `packages/shared`.
  - Frontend y backend como aplicaciones Next.js separadas.
  - Proxy `/api/**` del frontend al backend.
  - Contrato REST compartido (tipos, enums, esquemas).
  - Mantener pruebas, build y comportamiento existentes.

- [x] **Paso 8 — PropertyCard y grid responsive**
  - Crear componente reutilizable.
  - Imagen, título, precio, operación, ubicación, dormitorios, baños y superficie.
  - Crear grid responsive.

- [x] **Paso 9 — Catálogo**
  - Crear `/properties`.
  - Consumir API REST.
  - Mostrar propiedades publicadas.

- [x] **Paso 10 — Búsqueda**
  - Búsqueda textual.
  - Título, comuna, ciudad, región y descripción.
  - Reflejar búsqueda en query parameters.

- [x] **Paso 11 — Filtros**
  - Venta/arriendo.
  - Tipo.
  - Rango de precio.
  - Dormitorios.
  - Baños.
  - Superficie mínima.
  - Comuna/ciudad/región.
  - Permitir filtros combinados.
  - [x] Ajuste: barra lateral izquierda plegable y selección múltiple de región/ciudad/comuna (casillas).
  - [x] Ajuste: Operación con casillas Venta/Arriendo; orden final Comuna (casillas) → Ciudad → Región (selects de un valor).

- [x] **Paso 12 — Ordenamiento y estados**
  - Más recientes.
  - Precio ascendente/descendente.
  - Superficie ascendente/descendente.
  - Loading, vacío y error.
  - Skeletons cuando aporten valor.

- [x] **Paso 13 — Detalle de propiedad**
  - Crear `/properties/{id}`.
  - Mostrar información completa.
  - Consumir exclusivamente API REST.
  - Hecho: Server Component que llama a la API por `API_INTERNAL_URL` (sin caché); 404 propio para id inválido o no publicada; error con «Reintentar». Muestra la foto principal; galería, mapa y contacto en los pasos 14–16.

- [x] **Paso 14 — Galería**
  - Imagen principal.
  - Miniaturas.
  - Navegación.
  - Responsive.
  - Hecho: foto principal primero y luego por posición; botones anterior/siguiente con vuelta circular, contador, miniaturas (scroll horizontal en móvil) y flechas del teclado. Sin deslizar con el dedo (los botones cubren el táctil).

- [x] **Paso 15 — Mapa de ubicación (Leaflet + OpenStreetMap)**
  - Construir ubicación desde dirección, comuna, ciudad y región.
  - Integrar el mapa.
  - No solicitar latitud/longitud manual.
  - Hecho: dirección + comuna + ciudad + región + «Chile».
  - Reemplazado Google Maps por Leaflet + OpenStreetMap: geocodificación Nominatim en el servidor (caché de 30 días; si no encuentra la calle, usa la comuna), mapa solo en cliente, pin rojo y enlaces a Google Maps (búsqueda de la dirección). Sin claves.

- [x] **Paso 16 — Contacto con Web3Forms**
  - Formulario de contacto.
  - Incluir ID/título de propiedad.
  - Estados enviando/éxito/error.
  - Validar datos.
  - Hecho: `POST /api/inquiries` guarda primero en PostgreSQL y luego el navegador envía a Web3Forms (el plan gratuito no acepta envíos desde servidor). Clave `NEXT_PUBLIC_WEB3FORMS_ACCESS_KEY` en `apps/web`. Validación compartida (Zod), honeypot. Si el correo falla, la consulta queda guardada. Usuario autenticado: enlazado en el Paso 21. Pendiente: probar el correo con una clave real.

## Fase 3 — Autenticación y usuario

- [x] **Paso 17 — Registro y login REST**
  - Registro.
  - Login.
  - Logout.
  - Endpoint de usuario actual.
  - Hashing seguro.
  - Hecho: `/api/auth/register|login|logout|me`, scrypt + cookie de sesión firmada (HMAC, httpOnly, SameSite=Lax), límite de intentos de login, cuentas desactivadas rechazadas. Páginas `/login` y `/register` y sesión en el header. Requiere `AUTH_SECRET` (≥ 32 caracteres) en `apps/api/.env.local` y `.env.test.local`.

- [x] **Paso 18 — Autorización USER y ADMIN**
  - Crear roles.
  - Proteger APIs.
  - Proteger páginas.
  - Aplicar permisos en backend.
  - Hecho: roles USER/ADMIN (enum compartido verificado contra Prisma). API: `requireUser`/`requireAdmin` (401/403, usuario leído de la BD en cada petición), listos para los endpoints de favoritos y administración. Web: `proxy.ts` + verificación en layout y en cada página (`/account` para USER/ADMIN, `/admin` solo ADMIN; un USER ve «Acceso restringido»). `/account` y `/admin` son páginas mínimas que se completan en el Paso 19 y en la Fase 4.

- [x] **Paso 19 — Cuenta de usuario**
  - Crear `/account`.
  - Mostrar información básica.
  - Preparar secciones de propiedades interesadas y consultadas.
  - Hecho: `/account` (protegida) con nombre, email y tipo de cuenta (enlace al panel para ADMIN) y las secciones «Propiedades guardadas» y «Propiedades consultadas» con su estado vacío; sus listas llegan en los Pasos 20 y 21. El nombre en el header enlaza a la cuenta.

- [x] **Paso 20 — Favoritos**
  - Listar.
  - Agregar.
  - Eliminar.
  - Evitar duplicados.
  - Integrar en interfaz.
  - Hecho: `GET /api/favorites`, `POST|DELETE /api/favorites/{propertyId}` (sesión requerida, idempotentes, 204; duplicados imposibles por la clave primaria). Corazón en tarjetas y detalle (visitante → login), lista en `/account`. Las propiedades despublicadas dejan de aparecer.

- [x] **Paso 21 — Persistir consultas**
  - Crear consulta mediante REST.
  - Persistir en PostgreSQL.
  - Asociar propiedad.
  - Asociar usuario cuando exista.
  - Integrar envío Web3Forms.
  - Hecho: creación, persistencia, propiedad y Web3Forms venían del Paso 16. Ahora, con sesión, la consulta se asocia al usuario; `GET /api/account/inquiries` las lista y `/account` las muestra en «Propiedades consultadas» (con enlace mientras la propiedad siga publicada).

## Fase 4 — Administración

- [x] **Paso 22 — Dashboard ADMIN**
  - Crear `/admin`.
  - Mostrar indicadores.
  - Restringir a ADMIN.
  - Hecho: `GET /api/admin/dashboard` (solo ADMIN) con total, publicadas, en venta, en arriendo, usuarios y consultas; `/admin` los muestra (con error y «Reintentar» si la API falla). Un USER ve «Acceso restringido» y no se piden los indicadores.

- [x] **Paso 23 — CRUD REST de propiedades**
  - Listar.
  - Crear.
  - Obtener.
  - Actualizar.
  - Eliminar.
  - Proteger endpoints.
  - Hecho: `GET|POST /api/admin/properties` y `GET|PUT|DELETE /api/admin/properties/{id}`, solo ADMIN (401/403). Incluye las no publicadas, búsqueda y paginación; validación compartida sin latitud/longitud; características por nombre (reutiliza existentes sin distinguir mayúsculas). Eliminar pasó después a ser soft delete y conserva las imágenes (ver Paso 27).

- [x] **Paso 24 — Interfaz de administración**
  - `/admin/properties`.
  - `/admin/properties/new`.
  - `/admin/properties/{id}/edit`.
  - Hecho: `/admin/properties` lista todas (publicadas o no) desde el servidor, con búsqueda por GET en la URL (`?search=&page=`), paginación, estado (publicada/sin publicar, destacada) y acciones Ver (solo publicadas), Editar y Eliminar (con confirmación; recarga la lista). El panel enlaza a la lista. `/new` y `/{id}/edit` validan ADMIN en la página; editar carga la propiedad y responde 404 si no existe o el id no es UUID. El formulario queda para el Paso 25.

- [x] **Paso 25 — Formulario de propiedad**
  - Título y descripción.
  - Operación y tipo.
  - Precio.
  - Superficie útil/total.
  - Dormitorios, baños y estacionamientos.
  - Antigüedad.
  - Dirección, comuna, ciudad y región.
  - Características.
  - Publicada/destacada.
  - No agregar latitud/longitud manual.
  - Hecho: un formulario cliente para crear y editar, validado con `propertyInputSchema` antes de enviar (un error por campo, foco en el primero) y de nuevo en la API. Números opcionales en blanco = no aplica (`null`); acepta coma decimal. Precio en USD. Características como lista (Enter o «Agregar», sin repetir ignorando mayúsculas; la API reutiliza las existentes). Crear (`POST`) lleva a la edición con «Propiedad creada»; guardar (`PUT`) actualiza el encabezado.

- [x] **Paso 26 — Subida a Cloudinary**
  - Configurar Cloudinary.
  - Crear subida segura mediante REST.
  - Validar tipo y tamaño.
  - Guardar URL y `publicId`.
  - Hecho: `POST /api/admin/properties/{id}/images` (solo ADMIN; ≤ 5 MB; JPG/PNG/WebP detectados por sus bytes) sube a Cloudinary, carpeta `propiedades-claude`, y guarda URL y `publicId`; sección «Imágenes» en la edición. Verificado contra Cloudinary real: subida (201, principal la primera, la segunda en posición 1), imagen servida por `next/image` y destrucción del asset. La API key necesita permisos de crear/borrar (una clave de solo lectura da 503 «revisa la configuración»).

- [x] **Paso 27 — Administración de imágenes**
  - Múltiples imágenes.
  - Eliminar.
  - Seleccionar principal.
  - Ordenar.
  - Mantener sincronizados Cloudinary y PostgreSQL.
  - No destruir en Cloudinary imágenes con `publicId` `seed-placeholder/*` (placeholders del seed, ver `apps/api/prisma/seed/images.ts`).
  - Hecho: subida múltiple (una por una, con progreso), máximo 20 por propiedad; `DELETE /api/admin/properties/{id}/images/{imageId}` borra primero en Cloudinary (salvo `seed-placeholder/*`) y luego la fila (si Cloudinary falla no cambia nada; si era la principal, pasa a serlo la siguiente; posiciones 0..n-1); `PUT /api/admin/properties/{id}/images` (`{ order, mainImageId }`, debe listar exactamente sus imágenes) define orden y principal en una transacción. UI: galería en el orden público (principal primero) con «Principal», ←/→ y «Eliminar». Verificado contra Cloudinary real (subida, principal, orden y borrado: el asset da 404 en la Admin API). Eliminar una propiedad (soft delete) conserva sus imágenes a propósito.

- [x] **Paso 28 — Características**
  - Múltiples características por propiedad.
  - Modelo flexible.
  - Permitir nuevas características sin modificar columnas de Property.
  - Hecho: el modelo ya era flexible (`Feature` N:M `Property` vía `PropertyFeature`, sin columnas en `Property`). Se agregó el catálogo para ADMIN: `GET|POST /api/admin/features` y `PUT|DELETE /api/admin/features/{id}` (nombre único sin distinguir mayúsculas → 409; renombrar aplica en todas las propiedades; eliminar solo si ninguna propiedad activa la usa, desvinculando las eliminadas). Página `/admin/properties/features` (enlace «Características» en la lista, sin agregar un menú al sidebar). El formulario de propiedad ofrece como casillas las 12 comunes y luego el resto del catálogo.

- [x] **Paso 29 — Usuarios**
  - Crear `/admin/users`.
  - Listar y buscar.
  - Activar/desactivar.
  - Modificar rol cuando corresponda.
  - Hecho: `GET /api/admin/users` (búsqueda por nombre o email sin distinguir mayúsculas, filtros de rol y estado, paginación; fecha de registro y cuántas consultas y favoritos tiene) y `PATCH /api/admin/users/{id}` (`{ isActive?, role? }`). «Cuando corresponda»: un ADMIN no puede cambiar su propia cuenta (409), así siempre queda un ADMIN activo. Los cambios rigen en la siguiente petición (la sesión se valida contra la BD). Página `/admin/users`, enlazada desde el panel.
  - Ajuste posterior: menú «Administrar usuarios» en el sidebar (bajo «Administrar propiedades»); ADMIN puede crear (`POST /api/admin/users`, panel colapsable «Nuevo usuario»), editar datos (nombre, email, nueva contraseña, rol, estado en un diálogo) y eliminar definitivamente (`DELETE`; favoritos en cascada, consultas y mensajes se conservan sin usuario). Confirmaciones en ventana modal (`components/ui/confirm-dialog.tsx`, `<dialog>` nativo) al hacer ADMIN, editar, desactivar o eliminar. 10 por página. Su propia cuenta no se toca desde aquí (409; se edita en «Mi cuenta»).

- [x] **Paso 30 — Consultas**
  - Crear `/admin/inquiries`.
  - Mostrar propiedad, usuario, contacto, mensaje y fecha.
  - Enlazar propiedad asociada.
  - Nota: la lista y la conversación (`/admin/inquiries/{id}`, respuestas tipo chat) se hicieron junto con el layout de admin. En este paso, la lista enlaza la propiedad mientras está publicada (si no, «Ya no está publicada»), muestra el teléfono y el nombre del usuario registrado («Visitante» si no tiene cuenta). Búsqueda y paginación de 12.

## Fase 5 — Calidad y finalización

- [x] **Paso 31 — SEO y metadata**
  - Metadata dinámica.
  - Título.
  - Descripción.
  - Open Graph.
  - Nota: `buildPropertyMetadata` (`lib/property-metadata.ts`) para la ficha: título, descripción con los datos clave, canónica, Open Graph y Twitter con la imagen principal. `metadataBase` desde `NEXT_PUBLIC_SITE_URL`. Catálogo con su propio Open Graph y canónica. Sin imagen Open Graph propia del sitio (no hay logo o imagen de marca).

- [x] **Paso 32 — Optimización**
  - Optimizar imágenes Next.js/Cloudinary.
  - Evitar imágenes sobredimensionadas.
  - Revisar solicitudes duplicadas.
  - Revisar consultas PostgreSQL.
  - Nota: loader propio de `next/image` (Cloudinary `f_auto,q_auto,c_limit,w_N`; Unsplash `w`/`q`/`auto=format`). Subidas limitadas a 2560 px (verificado con una subida real a Cloudinary, borrada después). `sizes` de la tarjeta corregido. Imagen Open Graph de 1200×630 en JPEG. Sin peticiones duplicadas. Índice `Inquiry.lastActivityAt` en vez de `createdAt`. Búsqueda sin índice trigram, a propósito (detalle en `plan.md` §11).

- [x] **Paso 33 — Responsive y accesibilidad**
  - Desktop.
  - Tablet.
  - Móvil.
  - Labels, teclado, foco, alt y semántica.
  - Nota: auditoría automática en el navegador de las 17 páginas (públicas, cuenta de USER y admin) a 1280, 768 y 375 px. Revisa desborde horizontal, `alt`, labels, nombres accesibles, un `h1` y encabezados sin saltos, un `main`, enlace de salto, ids únicos y objetivos de 24 px; además, búsqueda de antipatrones en el código (`outline-none` sin reemplazo, `transition-all`, clics en `div`, zoom bloqueado). Único hallazgo: el marcador del mapa era un «botón» enfocable sin nombre y sin acción; ahora queda fuera del teclado (`keyboard={false}`, `interactive={false}`), con test. Ya cumplían: foco visible global (`:focus-visible`), `prefers-reduced-motion` global, `aria-expanded`/`aria-controls`/`aria-pressed` y cierre con Escape en menús y diálogos. Los enlaces de texto de 20–23 px de alto entran en la excepción de espaciado de WCAG 2.5.8. El foco visible no se pudo medir por script (la pestaña oculta no aplica `:focus-visible`); se verificó por la regla CSS global y la búsqueda en el código.

- [x] **Paso 34 — Seguridad**
  - Autenticación.
  - Autorización.
  - Validación REST.
  - Uploads.
  - Secretos.
  - Cloudinary.
  - Web3Forms.
  - Endpoints ADMIN.
  - Nota: se corrigieron 3 puntos.
    1. Cambiar la contraseña ahora cierra las demás sesiones (`User.sessionsValidAfter` + `iat` en el token), con tests.
    2. Redirección abierta en `?next=` («/», tabulador, «/evil.com» pasaba el filtro), con tests.
    3. Cabeceras de seguridad y sin `X-Powered-By`.
    El resto se comprobó sin cambios: auth y Zod en los 27 handlers, scrypt, subidas, Cloudinary, errores, secretos. Riesgos pendientes en `plan.md` §10: CSP, avisos de `npm audit` en el CLI de Prisma y un `.env` antiguo en el historial de git.

- [x] **Paso 35 — QA integral**
  - Flujos visitante.
  - Flujos USER.
  - Flujos ADMIN.
  - Errores y códigos HTTP.
  - Corregir defectos bloqueantes.
  - Nota: prueba de punta a punta contra el stack en marcha, por el proxy de la web: 89/89 verificaciones (visitante 28, USER 26, ADMIN 34, limpieza 1).
    - Cubre: catálogo, venta/arriendo, búsqueda (sin tildes), filtros AND, orden, paginación, detalle, consultas; registro, login, favoritos, «Mis consultas» y conversación, perfil y contraseña (con sesión renovada), logout; CRUD de propiedades, características, usuarios e imágenes (subida real a Cloudinary y borrado), respuesta a consultas, soft delete.
    - Códigos verificados: 200, 201, 204, 307, 400, 401, 403, 404, 409 y 415; también las redirecciones de `/account`.
    - Interfaz en el navegador: búsqueda y orden en la URL, filtros combinados (también sin JavaScript), galería con botones y teclado, mapa, y validación del contacto sin envío.
    - Sin defectos bloqueantes. Los datos de prueba se borraron.
    - No se envió el correo de Web3Forms: la clave real está configurada y el guardado ya se probó en la API.

- [x] **Paso 36 — Cumplimiento arquitectónico**
  - Confirmar que no existen Server Actions.
  - Confirmar comunicación REST.
  - Confirmar PostgreSQL.
  - Confirmar que React no accede a DB.
  - Confirmar permisos backend.
  - Confirmar integraciones externas.
  - Nota (verificado con búsquedas en el código):
    - Server Actions: ninguna; no hay `"use server"`, y los `action={pathname}` son formularios GET.
    - REST: la web solo llama a `/api/**` (navegador) o a `API_INTERNAL_URL` (servidor). Salidas externas: Nominatim (servidor, con caché) y Web3Forms (navegador).
    - PostgreSQL: Prisma `provider = "postgresql"` con `@prisma/adapter-pg`.
    - React sin acceso a la BD: sin Prisma, `pg` ni `DATABASE_URL` en `apps/web`. `apps/api` solo tiene Route Handlers.
    - Permisos: los 27 handlers protegidos (ver Paso 34) y las 12 páginas privadas verifican la sesión en la propia página.
    - Integraciones: Cloudinary solo en la API (en la web, únicamente URLs públicas); Leaflet/OSM y Nominatim sin clave; variables documentadas en los `.env.example`.
    - Corregido: `leaflet` y `react-leaflet` estaban declaradas en el `package.json` raíz y las usa solo `apps/web`. Se movieron a `apps/web` con las mismas versiones (lockfile: 6 líneas; instaladas 1.9.4 y 5.0.0).

- [x] **Paso 37 — Convergencia final del SDD**
  - Releer `spec.md`.
  - Releer `plan.md`.
  - Comparar implementación con requisitos.
  - Corregir faltantes o inconsistencias.
  - Ejecutar build y validaciones finales.
  - Confirmar ausencia de errores bloqueantes.
  - Nota: todos los requisitos de `spec.md` (§2–§26) están implementados.
    - Además de los pasos 35 (E2E 89/89) y 36, se comprobó: secciones y navegación de la landing, campos de la ficha y estados «Enviando…», «Consulta enviada» y error del contacto.
    - Sin faltantes en el código. Se corrigió documentación desactualizada:
      - `spec.md` §21–22: CRUD de usuarios y menú «Usuarios», pedidos durante el desarrollo.
      - `plan.md`: favoritos solo USER; orden por `lastActivityAt` y `lastMessage`; la respuesta del ADMIN devuelve la consulta; presencia con `loggedOutAt`; menú con «Administrar usuarios»; `iat` en el token; códigos 413, 415, 429, 502 y 503.
    - Validaciones finales en verde: test (web 418, api 307, shared 129), lint, typecheck y build.

## Cambios posteriores

- [x] **Paso 38 — Precios en pesos chilenos**
  - Moneda única `CLP` (Prisma, `@portal/shared`) y conversión de los precios existentes.
  - Venta en millones («$846 millones»); arriendo completo y mensual.
  - Etiquetas de precio del formulario y de los filtros en CLP.
  - Nota: migración `20261007120000_prices_in_chilean_pesos` (renombra el valor del enum y convierte a 950 CLP/USD), aplicada en local y en Supabase (`db:deploy`). Snapshot del seed regenerado desde la base local: solo cambian precio y moneda. Validaciones: test (web 426, api 299, shared 129), lint, typecheck y build.

- [x] **Paso 39 — Leads: contrato, modelo y API**
  - `@portal/shared/lead` (`leadCreateSchema`, enums, tipos) con test; modelo y migración `Lead` en Prisma.
  - `POST /api/leads` (límite 10 cada 10 min, honeypot, usuario opcional) y `lib/lead-submission.ts` (API guarda, Web3Forms envía).
  - Nota: migración `20261023184941_add_lead` aplicada en local y en Supabase (`db:deploy`, 2026-10-23). `LeadKind` se verifica contra Prisma en `shared-contract.test.ts`. Validaciones: test (web 431, api 303, shared 132), lint, typecheck y build.
- [x] **Paso 40 — Portada de captación (scroll-craft)**
  - Hero con formulario de tasación, dial de comunas, pasos, FAQ y cierre con formulario; catálogo conservado; barra CTA móvil.
- [x] **Paso 41 — Administración de leads**
  - `GET /api/admin/leads` y `/admin/leads` (listado simple) con menú.
  - Nota pasos 40–41: portada con hero parallax (`HeroParallax`), `LeadForm` de dos pasos (tasación o búsqueda), dial de comunas fijo con scroll (`CommuneDial`, `useScrollProgress`; elegir comuna la precarga en ambos formularios), pasos, FAQ, cierre con formulario y barra CTA móvil. Cifras solo reales (propiedades publicadas por API; el resto es cobertura y gratuidad). `/admin/leads` con menú «Leads».
  - Verificado: test (web 437, api 305, shared 132), lint, typecheck y build. Captura de escritorio revisada; a 375 px solo con viewport de ~500 px (Chrome headless no baja de ahí). **Sin verificar:** envío real desde el navegador (por curl, `POST /api/leads` responde 201 contra Supabase), 375 px real, modo oscuro, correo de Web3Forms.
- [x] **Paso 42 — Página «Tasar propiedades»**
  - Pestaña «Tasar propiedades» en el menú y página `/tasador-propiedades` con el `LeadForm` de tasación; origen de lead `tasador` en `@portal/shared/lead`.
  - Nota: `LeadForm` acepta `fixedKind` (oculta el selector vender/buscar). Sin endpoint ni migración nuevos. `/tasador-propiedades/` redirige a la ruta sin barra (comportamiento por defecto de Next). Verificado: test (shared 133, web 439, api 306), lint, typecheck y build; capturas a 1280 px y ~500 px; `POST /api/leads` con `source: "tasador"` responde 201 contra Supabase. **Sin verificar:** envío desde el navegador, 375 px real, modo oscuro, correo de Web3Forms.
- [x] **Paso 43 — Tasador de precio**
  - `@portal/shared/valuation`, `POST /api/valuations` (comparables publicados, algoritmo puro, límite de frecuencia) y página `/tasador-propiedades` con formulario, resultado, contacto (`Lead` `tasador`) y preguntas frecuentes.
  - Nota: sin migración. Algoritmo puro en `services/valuation-algorithm.ts` (mediana de precio/m² sin atípicos, ajustes ±15 %, rango p25–p75, mínimo 3 comparables: comuna, luego todo el portal, si no `insufficient`). El resultado ofrece el formulario de contacto (`Lead` `tasador`, con el resumen en `message`). `LeadForm` acepta `initialAddress` y `message`; `CommuneProvider`, `initialCommune`. Verificado: test (shared 137, web 445, api 316), lint, typecheck y build; `POST /api/valuations` contra Supabase responde `ok` (alcance portal) y 400 con datos inválidos; capturas del formulario a 1280 px y ~500 px. **Sin verificar:** envío del formulario y pantalla de resultado en el navegador (solo por tests y curl), 375 px real, modo oscuro. La precisión depende de las propiedades publicadas (hoy pocas).
  - Ajuste de formato: la página replica la composición de un tasador en línea clásico (título centrado, formulario a la izquierda con opciones en píldoras y fichas numéricas, «Continuar» deshabilitado hasta completar, mapa Leaflet/OpenStreetMap a la derecha que sigue la dirección con Nominatim desde el navegador, FAQ en acordeón). Mapa y geocodificación con lo ya instalado, sin dependencias nuevas; con `prefers-reduced-motion` el mapa no vuela. Verificado: test web 450, lint, typecheck y build; capturas a 1280 px y ~500 px. **Sin verificar:** interacción real (escribir una dirección y ver el mapa moverse), 375 px real, modo oscuro.
- [x] **Paso 44 — Tasador: amenidades, aviso de contacto y resumen en UF**
  - Paso de amenidades, diálogo de contacto y resumen con mapa y precio en UF (venta) o CLP (arriendo); valor de la UF desde la API con caché y degradación a CLP.
  - Nota: flujo en 4 pasos en `property-valuator.tsx` (datos, amenidades, diálogo de contacto, resumen con mapa). Amenidades en `@portal/shared/valuation` con ajustes fijos (1,5 %; 2 % piscina temperada) dentro del tope de ±15 %. UF desde `https://mindicador.cl/api/uf` (`apps/api/src/lib/uf-value.ts`, caché 6 h, timeout 4 s, sin UF devuelve `uf: null` y la web muestra CLP); solo ventas. `LeadForm` acepta `onSent`. Verificado: test (shared 138, web 458, api 323), lint, typecheck y build; API en vivo con y sin amenidades (el precio sube) y con UF real (41.205 CLP). **Sin verificar:** recorrido completo en el navegador (pasos, diálogo, envío del lead desde el diálogo), 375 px real, modo oscuro. Con la API recién compilada la primera consulta pudo responder `uf: null` por el timeout de 4 s.
- [x] **Paso 45 — Informe PDF de valoración**
  - Botón «Generar Informe PDF» en el resumen del tasador; `POST /api/valuations/report` con `pdfkit`; contenido solo con datos reales y avisos de alcance en cada página.
  - Nota: `POST /api/valuations/report` recalcula la estimación y devuelve el PDF (`pdfkit`, tamaño carta, 5 páginas: portada con el valor destacado y barra de rango, resumen, ficha con estado de cada dato, mercado, recomendaciones y conclusión). Contenido en `services/valuation-report-data.ts`, dibujo en `lib/pdf/`, marca en `lib/pdf/report-brand.ts` (hoy «Portal Inmobiliario» como logotipo vectorial). Sin entorno, plano ni precios de cierre: se omiten y se dice. UF del día con fecha desde mindicador.cl (`getUfQuote`). Verificado: test (shared 138, web 459, api 337), lint, typecheck y build; PDF de muestra en `docs/samples/` renderizado y revisado con pdf.js; descarga real desde la API en vivo (200, `application/pdf`). **Sin verificar:** descarga con el botón en el navegador, el PDF de referencia (no se pudo leer: sin `pdftoppm` y el visor de Chrome headless lo muestra en blanco), el logo de Propizoom (no existe en el repo), impresión en papel.
- [ ] **Paso 46 — Rediseño de la portada PropiZoom** (por etapas)
  - [x] Etapa 1 — Tokens de marca, solo tema claro, logo, header y footer.
  - [x] Etapa 2 — Primitivas de movimiento: `CountUp` (cifras animadas), `useScrollProgress` y `Reveal` ya existentes, clase `.night` (tokens invertidos para bandas navy). Más naranja y oscuro: `accent` pasa a naranja con texto navy (AA), header navy, banda de cifras navy con borde naranja.
  - [x] Etapa 3 — Hero en capas: foto de prueba (Unsplash), panel naranja y ficha con foto a distintas velocidades, colinas, lupa del logo que sigue al puntero (`.glow-lens`); fotos centralizadas arriba de `hero-section.tsx`. Brief en `landing-brief.md`.
  - [x] Etapa A (fidelidad al video) — paleta crema/arena/naranja/charcoal medida del video, Newsreader + Geist Mono, header píldora blanca con botón naranja degradado. Test web 465, lint y typecheck en verde; capturas de home, `/properties` y `/tasador-propiedades` a 1280 px y home a 500 px. Sin verificar: build, contraste AA medido, 375 px reales, páginas de cuenta/admin.
  - [x] Etapa B (hero v2) — hero a pantalla completa con titular corto y solo botones de acceso directo (Tasar, Comprar, Arrendar), sin formulario ni buscador; debajo, tres fichas grandes con foto en grilla de líneas finas (`ShortcutTiles`, entrada por scroll con CSS `animation-timeline: view()`). El formulario de captación queda en el cierre (`#cierre`) y en `/tasador-propiedades`; los anclas `#tasar` pasaron a `#cierre`. Test web 467, lint y typecheck en verde; capturas a 1280 y 500 px. Sin verificar: build, 375 px reales. Nota: `Reveal` no se dispara sobre un contenedor `absolute inset-0` (no investigado); las fichas usan CSS puro.
  - [x] Etapa C — frase grande que se oscurece palabra a palabra con el scroll y tres pasos que se apilan como tarjetas sticky (lg+): teléfono naranja, casa isométrica cuyo techo con paneles se levanta, ciudad isométrica con ruta naranja que se dibuja. Todo en CSS (`animation-timeline: view()`, sin JavaScript; sin soporte se ve el estado final). Reemplaza `lead-steps.tsx` (arte en `step-art.tsx`). Test web 467, lint y typecheck en verde; capturas a 1280 y 500 px. Sin verificar: Firefox/Safari sin timelines, 375 px reales, la animación en movimiento (solo cuadros estáticos). Ciudad del paso 3 detallada después: torres y bloques con ventanas, casas con techo a dos aguas (una con panel solar), losa con calles punteadas, ruta naranja que se dibuja y termina en un pin.
  - [x] Etapa D — escena oscura «El riesgo» (`RiskScene`, sección alta con marco fijo: 3 fotos que se funden y 3 líneas desplazadas que se encienden palabra a palabra, todo por el rango de scroll de la sección en CSS) y panel de mercado (`MarketPanel`: pestañas Venta/Arriendo con contador real; `fetchPublishedCount` acepta `operation`). Con movimiento reducido: sin altura extra ni animaciones. Test web 470, lint y typecheck en verde; capturas a 1280 y 500 px en 4 puntos del scroll. Sin verificar: build, Firefox/Safari, 375 px reales, el panel con la API caída (los tests cubren conteos nulos).
  - [x] Etapa E — «Conocemos tu comuna» inmersivo (el pico): al elegir una comuna el mapa se acerca a su pin y la foto se abre desde él con `clip-path: circle()` (efecto lente), con Ken Burns lento, nombre, una frase, 3 cualidades y selector de comunas; Esc o la X cierran y devuelven el foco al pin. Curvas naranjas de red desde Concepción que se dibujan con el scroll. Datos y fotos de prueba (Unsplash) en `lib/commune-profiles.ts`; panel en `commune-showcase.tsx`. Test web 472, lint y typecheck en verde; interacción real probada con Playwright a 1280 y 500 px (clic, cambio de comuna, Esc, foco), sin desborde ni errores de consola. Sin verificar: build, 375 px reales, teclado completo con lector de pantalla, las fotos son genéricas (no de cada comuna) y las cualidades están por revisar con el cliente.
  - [x] Etapa F — cierre dividido (bloque azul de marca con el formulario `#cierre` + foto con ficha naranja que se desliza), pie naranja con ondas lentas y enlaces mono entre corchetes, títulos «Portal Inmobiliario» renombrados a PropiZoom (tests incluidos). Supervisión móvil: recorrido completo de la portada a 375x812 con emulación táctil (Playwright), sin desborde ni errores de consola; objetivos táctiles menores de 40 px corregidos (enlaces de texto, logo, pestañas); auditoría web-design-guidelines: área segura inferior en la barra CTA (`viewport-fit=cover`), teclas de flecha en las pestañas, números tabulares, `scroll-padding-top` mayor por la píldora. Test web 472, lint, typecheck y build en verde. Sin verificar: dispositivo real (iOS/Android), Firefox/Safari, movimiento en vivo (solo cuadros). No había skill «expo» instalada (además es de React Native): se usó web-design-guidelines y el arnés de scroll-craft.
  - [x] Mapa de «Conocemos tu comuna» reemplazado por un mapa real (Leaflet + OpenStreetMap con filtro cálido por CSS; `commune-map-canvas.tsx` y `commune-map-loader.tsx`, que monta el mapa solo al acercarse al viewport): pines con el nombre en coordenadas reales (`lib/communes.ts`), arcos naranjas desde Concepción, vuelo animado a la comuna elegida y luego la lente con la foto; lista de chips como selector accesible. Banner con foto del mar (Unsplash de prueba) en la cabecera de la sección, con ola y deriva por scroll. En móvil el mapa va primero. Test web 474, lint, typecheck y build en verde; flujo probado con Playwright a 1280 y 390 px (clic, cambio, Esc, foco), sin desborde ni errores de consola. Sin verificar: dispositivo real, Firefox/Safari, coordenadas aproximadas por contrastar, tráfico real contra la política de tiles de OSM.
  - [x] Identidad de corredora (landing tipo imagina.cl) — PropiZoom pasa a corredora de proyectos nuevos del Gran Concepción que también tasa y hace corretaje tradicional y busca inmobiliarias. Hero rehecho a la imagen de la referencia: fondo tipo video (`HeroBackdrop`: 4 fotos con zoom lento y fundido en bucle de 28 s; admite `videoSrc` para un mp4 en `public/video/`), kicker, H1 en mayúsculas, selects de comuna y tipo (`HeroSearch`, envío GET nativo sin JS), `VER RESULTADOS`, `BÚSQUEDA AVANZADA`, conteo real de resultados y los dos ingresos (Tasación gratuita, Corretaje tradicional); píldora de WhatsApp «Asesoría personalizada · Compra tu depto». Resto reutilizado con cambio de textos: menú (Proyectos nuevos, Tasación, Corretaje, Inmobiliarias), fichas, frase y pasos, escena «Para inmobiliarias» con botón a WhatsApp (`#inmobiliarias`), FAQ, cierre, pie y metadata. Test web 475, lint, typecheck y build en verde; Playwright a 1440 y 390 px (ciclo del fondo, búsqueda real a `/properties?search=…&type=…`, sin desborde ni errores de consola). Sin verificar: dispositivo real, el mp4 (aún no hay), cintas de estado y «Desde UF» de la referencia (requieren cambios de modelo, fuera de alcance). Las propiedades de prueba del seed son de Santiago.
  - [x] Captación de leads — se quita la lupa del cursor del hero (`.glow-lens`; `PointerGlow` y `.glow-ring` se conservan para las tarjetas) y la escena «Para inmobiliarias» (`RiskScene`, su CSS y el enlace «Inmobiliarias» del menú) se reemplaza por `FreeValuationPitch`: titular de tasación/valoración gratuita, cifras reales con contador (5+ años, 500+ negocios, 1.000+ tasaciones; `CountUp` ahora admite `suffix`), «Especializados en» (departamentos, casas, terrenos, oficinas), nota de comunas generada con `COMMUNE_NAMES` y `LeadForm` de tasación (`source: home-hero`, sin cambios de contrato) con ancla `#tasacion-gratis`; los botones «Tasación gratuita» del hero y del paso 1 apuntan ahí. Test web 478, lint, typecheck y build en verde; capturas a 1440 y 390 px sin desborde ni errores de consola. Sin verificar: envío real del formulario desde esta sección (no se probó contra la base), dispositivo real.
  - [ ] Etapa 4 — Cifras y «Cómo funciona». [ ] Etapa 5 — Escena oscura y mapa. [ ] Etapa 6 — Propiedades, panel, FAQ y cierre. [ ] Etapa 7 — Pulido móvil y auditoría.
  - Nota etapa 1: test web 463, lint y typecheck en verde. Títulos de página (`| Portal Inmobiliario`) y `metadata` aún con el nombre anterior.
- [ ] **Paso 47 — Filtros por ciudad, sector y región del Biobío, y propiedades de muestra de la zona**
  - `@portal/shared/locations` (regiones, ciudades, sectores y slugs, con test; la API lo compara con su `toSlug`). Catálogo: Operación → Comuna → Sector → Región (por defecto Región del Biobío; Provincia Arauco con sus 7 comunas), sector desactivado fuera de Concepción; el formulario del administrador usa las mismas listas encadenadas; el campo de la comuna se llama «Comuna» (en el catálogo, el hero y el administrador) y el de sector «Sector».
  - Datos: `prisma/seed/relocate-properties.ts` (+ `relocation-data.ts`) reubica por id las 21 propiedades del seed: 13 de las 19 publicadas (≈70 %) en Concepción, una por sector (13 de los 15), con texto centrado en la plusvalía del sector (sin prometer rentabilidad), y las otras 6 en San Pedro de la Paz, Talcahuano, Lota, Coronel, Tomé y Lebu (Provincia Arauco), con título, descripción, dirección, precio local, datos completos y características (conserva imágenes, favoritos y consultas; seco por defecto, `--apply`, exige `RELOCATE_DATABASE_URL` y `--confirm-host` fuera de localhost). Aplicado en la base local y `snapshot.json` regenerado (solo cambian las propiedades). **Aplicado también en Supabase el 2026-10-30** (simulacro, respaldo previo en `projects/db-backups/properties-before-relocation-<fecha>.json`, una transacción y `--confirm-host`; se revierte con `--restore=<archivo> --apply`): 22 filas actualizadas (las 21 del seed más la casa de Cañete creada a mano, de la que solo se normalizó la ubicación); 13 de 19 publicadas en Concepción (68 %), imágenes 57, consultas 9 y favoritos 7 sin cambios. El catálogo sin filtros muestra 18 (la región por defecto excluye Lebu, de Provincia Arauco) y la portada dice 19 resultados.
  - Verificado: test shared 149, api 338, web 487, lint, typecheck y build; recorrido en el navegador de los filtros (orden, 15 sectores, desactivado en otras ciudades, Arauco con 7 ciudades, URL limpia, móvil sin desborde). Sin verificar: tarjetas con los datos nuevos en el navegador (el API en ejecución lee Supabase), formulario del administrador en el navegador. Los textos y precios son de muestra.
