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
    El resto se comprobó sin cambios: auth y Zod en los 27 handlers, scrypt, subidas, Cloudinary, errores, secretos. Riesgos pendientes en `plan.md` §10: CSP, límite de frecuencia en registro y consultas, avisos de `npm audit` en el CLI de Prisma y un `.env` antiguo en el historial de git.

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
