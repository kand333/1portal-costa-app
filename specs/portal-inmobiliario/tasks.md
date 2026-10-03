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
  - Hecho: `GET|POST /api/admin/properties` y `GET|PUT|DELETE /api/admin/properties/{id}`, solo ADMIN (401/403). Incluye las no publicadas, búsqueda y paginación; validación compartida sin latitud/longitud; características por nombre (reutiliza existentes sin distinguir mayúsculas). Eliminar aún no borra imágenes en Cloudinary (Paso 27).

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

- [ ] **Paso 26 — Subida a Cloudinary**
  - Configurar Cloudinary.
  - Crear subida segura mediante REST.
  - Validar tipo y tamaño.
  - Guardar URL y `publicId`.

- [ ] **Paso 27 — Administración de imágenes**
  - Múltiples imágenes.
  - Eliminar.
  - Seleccionar principal.
  - Ordenar.
  - Mantener sincronizados Cloudinary y PostgreSQL.
  - No destruir en Cloudinary imágenes con `publicId` `seed-placeholder/*` (placeholders del seed, ver `apps/api/prisma/seed/images.ts`).

- [ ] **Paso 28 — Características**
  - Múltiples características por propiedad.
  - Modelo flexible.
  - Permitir nuevas características sin modificar columnas de Property.

- [ ] **Paso 29 — Usuarios**
  - Crear `/admin/users`.
  - Listar y buscar.
  - Activar/desactivar.
  - Modificar rol cuando corresponda.

- [ ] **Paso 30 — Consultas**
  - Crear `/admin/inquiries`.
  - Mostrar propiedad, usuario, contacto, mensaje y fecha.
  - Enlazar propiedad asociada.

## Fase 5 — Calidad y finalización

- [ ] **Paso 31 — SEO y metadata**
  - Metadata dinámica.
  - Título.
  - Descripción.
  - Open Graph.

- [ ] **Paso 32 — Optimización**
  - Optimizar imágenes Next.js/Cloudinary.
  - Evitar imágenes sobredimensionadas.
  - Revisar solicitudes duplicadas.
  - Revisar consultas PostgreSQL.

- [ ] **Paso 33 — Responsive y accesibilidad**
  - Desktop.
  - Tablet.
  - Móvil.
  - Labels, teclado, foco, alt y semántica.

- [ ] **Paso 34 — Seguridad**
  - Autenticación.
  - Autorización.
  - Validación REST.
  - Uploads.
  - Secretos.
  - Cloudinary.
  - Web3Forms.
  - Endpoints ADMIN.

- [ ] **Paso 35 — QA integral**
  - Flujos visitante.
  - Flujos USER.
  - Flujos ADMIN.
  - Errores y códigos HTTP.
  - Corregir defectos bloqueantes.

- [ ] **Paso 36 — Cumplimiento arquitectónico**
  - Confirmar que no existen Server Actions.
  - Confirmar comunicación REST.
  - Confirmar PostgreSQL.
  - Confirmar que React no accede a DB.
  - Confirmar permisos backend.
  - Confirmar integraciones externas.

- [ ] **Paso 37 — Convergencia final del SDD**
  - Releer `spec.md`.
  - Releer `plan.md`.
  - Comparar implementación con requisitos.
  - Corregir faltantes o inconsistencias.
  - Ejecutar build y validaciones finales.
  - Confirmar ausencia de errores bloqueantes.
