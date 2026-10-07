# Portal Inmobiliario — SDD

Portal inmobiliario full stack para el mercado chileno, construido con **Spec-Driven Development (SDD)** y Claude Code.

**Estado:** SDD terminado. Las 39 tareas de `specs/portal-inmobiliario/tasks.md` están completas y verificadas (tests, lint, typecheck, build y QA de punta a punta).

## Qué incluye

- **Visitante:** landing (hero, buscador, destacadas, venta, arriendo), catálogo con búsqueda sin tildes, filtros combinados y orden en la URL, ficha con galería, mapa (Leaflet + OpenStreetMap) y formulario de contacto (Web3Forms + PostgreSQL), registro e inicio de sesión.
- **USER:** cuenta con datos editables, favoritos, «Mis consultas» con conversación (chat) con el portal.
- **ADMIN** (`/admin`, layout propio con menú lateral): panel con indicadores, propiedades (CRUD, publicar, destacar, borrado lógico, filtros), imágenes en Cloudinary (subir, ordenar, principal, eliminar), catálogo de características, usuarios (CRUD, roles, activar/desactivar, quién está conectado) y consultas con respuestas.
- **Transversal:** responsive y accesible (desktop, tablet, móvil), SEO con Open Graph, imágenes optimizadas por CDN, avisos (mensajes flash), seguridad revisada (sesión firmada `httpOnly`, revocación al cambiar la contraseña, límites de intentos y por IP, cabeceras).

## Estructura

Monorepo con npm workspaces:

```text
.
├── CLAUDE.md
├── apps/
│   ├── web/        # @portal/web — frontend Next.js (puerto 3000), sin acceso a la BD
│   └── api/        # @portal/api — backend Next.js: Route Handlers REST + Prisma (puerto 4000)
├── packages/
│   └── shared/     # @portal/shared — contrato REST: tipos, enums y esquemas Zod
└── specs/
    └── portal-inmobiliario/
        ├── spec.md
        ├── plan.md
        └── tasks.md
```

El navegador solo habla con `apps/web`; este reenvía `/api/**` a `apps/api` (variable `API_INTERNAL_URL`, por defecto `http://localhost:4000`). Sin Server Actions: toda la comunicación es REST.

Stack: Next.js 16.3.7, React 19, TypeScript, Tailwind 4, SWR, Prisma 7.10.0, PostgreSQL (Supabase; local para tests), Zod 4, Vitest.

## Documentos

| Documento | Contenido |
|---|---|
| `CLAUDE.md` | Instrucciones permanentes para Claude Code: arquitectura, reglas no obvias, verificación |
| `spec.md` | **Qué** hace la aplicación: usuarios, propiedades, catálogo, contacto, administración y criterios de aceptación |
| `plan.md` | **Cómo** está construida: API REST, modelo de datos, autenticación, integraciones, decisiones y riesgos pendientes (§10) |
| `tasks.md` | Las 39 tareas en orden, cada una con su nota de verificación |

## Desarrollo local

Requisitos: Node.js 24, un proyecto de Supabase (base principal, ver sección 6) y un contenedor Docker de PostgreSQL 16 llamado `postgres` con el puerto `5432` publicado (tests y creación de migraciones).

### 1. Dependencias

```bash
npm install
```

Instala todos los workspaces. `postinstall` de `apps/api` ejecuta `prisma generate` y crea el cliente en `apps/api/src/generated/prisma` (no versionado).

### 2. Base de datos

Crear un rol propio de la aplicación (sin superusuario; `CREATEDB` es necesario para la shadow database de `prisma migrate dev`) y dos bases: desarrollo y pruebas.

```bash
docker exec -i postgres psql -U postgres -v ON_ERROR_STOP=1 -c "CREATE ROLE portal_app LOGIN CREATEDB PASSWORD 'CAMBIAR_ESTA_CLAVE';" -c "CREATE DATABASE portal_inmobiliario OWNER portal_app;" -c "CREATE DATABASE portal_inmobiliario_test OWNER portal_app;"
```

Después aplicar las migraciones y cargar los datos de desarrollo:

```bash
npm run db:migrate
```

```bash
npm run db:seed
```

### 3. Variables de entorno

Cada aplicación tiene su `.env.example`, que documenta cada integración (dónde crear la clave y si es secreta).

Backend (`apps/api/.env.example`), copiar a:

- `apps/api/.env.local` → `DATABASE_URL` (base `portal_inmobiliario`), `AUTH_SECRET` (32 caracteres o más) y las credenciales de Cloudinary (`CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`; la clave necesita permiso para subir y destruir).
- `apps/api/.env.test.local` → `DATABASE_URL` (base `portal_inmobiliario_test`) y `AUTH_SECRET`. Sin `AUTH_SECRET`, los tests de autenticación se omiten.

Frontend (`apps/web/.env.example`): `NEXT_PUBLIC_SITE_URL` (en producción, el dominio real), `API_INTERNAL_URL` y `NEXT_PUBLIC_WEB3FORMS_ACCESS_KEY` (pública por diseño; restringirla por dominio en el panel de Web3Forms). Crear `apps/web/.env.local` cuando un valor difiera del predeterminado. Nunca poner secretos del backend en el frontend.

Next.js ignora `.env.local` cuando `NODE_ENV=test` (Vitest), por eso las pruebas usan `.env.test.local`. Ningún archivo `.env*` salvo `.env.example` se versiona.

El mapa (OpenStreetMap + Nominatim) no requiere claves.

### 4. Datos de desarrollo y usuarios de prueba

`npm run db:seed` carga `apps/api/prisma/seed/snapshot.json`, una instantánea de una base real: características, propiedades (incluida una eliminada), imágenes (de ejemplo en Unsplash y reales en Cloudinary), usuarios, favoritos, consultas y conversaciones. Conserva los IDs y se puede re-ejecutar sin duplicar: restaura lo que viene en la instantánea y no toca lo creado aparte.

Usuarios: `admin@test.com` (ADMIN), `ana@test.com`, `luis@test.com`, `marta@test.com` y `andres@test.com` (USER). Todos con la contraseña de `apps/api/prisma/seed/test-users.ts`. Solo para desarrollo.

Para regenerar la instantánea desde una base (sin contraseñas ni sesiones), desde `apps/api`:

```bash
npx tsx prisma/seed/export-snapshot.ts
```

Usa `SNAPSHOT_DATABASE_URL` si está definida y si no `DATABASE_URL`.

### 5. Comandos

Todos se ejecutan desde la raíz.

| Comando | Uso |
|---|---|
| `npm run dev` | Backend (`:4000`) y frontend (`:3000`) a la vez |
| `npm run dev:api` / `npm run dev:web` | Solo una de las aplicaciones |
| `npm run build` | Build de backend y frontend |
| `npm test` | Pruebas de todos los workspaces; las del backend aplican migraciones a la base `_test` y se niegan a usar otra |
| `npm run lint` | ESLint en todos los workspaces |
| `npm run typecheck` | TypeScript en todos los workspaces |
| `npm run db:migrate` | Crear/aplicar migraciones en desarrollo |
| `npm run db:deploy` | Aplicar migraciones existentes (producción) |
| `npm run db:status` | Estado de migraciones |
| `npm run db:seed` | Cargar la instantánea de desarrollo (re-ejecutable, no duplica) |
| `npm run db:generate` | Regenerar el cliente Prisma (y reiniciar la API si cambió el esquema) |

### 6. Base de datos en Supabase

La base principal está en Supabase. La API se conecta con un usuario propio, `prisma` (con `BYPASSRLS`), al pooler en modo sesión (puerto 5432, IPv4) y verifica el SSL contra la CA de Supabase.

Configuración (una vez por proyecto de Supabase):

1. Crear el usuario `prisma` en el SQL Editor de Supabase. El SQL está en la [guía de Prisma de Supabase](https://supabase.com/docs/guides/database/prisma).
2. La CA de Supabase (**Project Settings → Database → SSL Configuration → Download certificate**) ya está versionada en `apps/api/certs/prod-ca-2021.crt` (la usa el CLI de Prisma) y, como código, en `apps/api/src/lib/supabase-root-ca.ts` (la usa la API: `src/lib/database-config.ts` verifica todo host de Supabase contra ella, sin importar los parámetros SSL de la URL).
3. En `apps/api/.env.local`:

   ```text
   DATABASE_URL=postgresql://prisma.<ref>:<clave>@aws-0-<region>.pooler.supabase.com:5432/postgres?sslmode=verify-full&sslrootcert=certs/prod-ca-2021.crt
   ```

4. Aplicar las migraciones:

   ```bash
   npm run db:deploy
   ```

5. Proteger la tabla interna de Prisma (SQL Editor): `alter table "_prisma_migrations" enable row level security;`.
6. Cargar datos: `npm run db:seed` (instantánea de desarrollo), o copiar una base existente con `pg_dump --data-only --schema=public --exclude-table=_prisma_migrations` y `psql --single-transaction`.

Notas:

- `npm run db:migrate` (`migrate dev`) necesita una base sombra: créalas siempre contra la base local (con su `DATABASE_URL`) y aplícalas en Supabase con `db:deploy`.
- Los tests usan siempre la base local `portal_inmobiliario_test` (`.env.test.local`).
- Para volver a la base local, cambia `DATABASE_URL` en `apps/api/.env.local`.

#### API en Vercel

El proyecto de Vercel de la API (raíz `apps/api`) necesita en **Settings → Environment Variables**:

- `DATABASE_URL`: el pooler en **modo transacción** (puerto `6543`), recomendado por Supabase para serverless: `postgresql://prisma.<ref>:<clave>@aws-0-<region>.pooler.supabase.com:6543/postgres`. No hace falta `sslmode` ni ruta de certificado: la CA va en el código.
- `AUTH_SECRET` (32 caracteres o más) y `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`.

Las migraciones no se ejecutan en Vercel: se aplican desde local con `npm run db:deploy`.

### 7. pgAdmin (opcional)

Crear `.env.pgadmin` (ignorado por git) con `PGADMIN_DEFAULT_EMAIL` y `PGADMIN_DEFAULT_PASSWORD` (mínimo 6 caracteres; para una clave más corta añadir `PGADMIN_CONFIG_PASSWORD_LENGTH_MIN`), y ejecutar:

```bash
docker run -d --name pgadmin --restart always -p 127.0.0.1:5050:80 --env-file .env.pgadmin -v pgadmin-data:/var/lib/pgadmin dpage/pgadmin4:9.18.0
```

Abrir `http://localhost:5050` y registrar el servidor con host `host.docker.internal`, puerto `5432`.

## Antes de producción

Los riesgos aceptados están en `plan.md` §10 («Revisión de seguridad»). En resumen:

- Agregar una Content Security Policy (hoy no hay).
- Los límites de frecuencia y de intentos de login viven en memoria, por proceso: con varias instancias, usar un almacén compartido o el limitador de la plataforma.
- Configurar `NEXT_PUBLIC_SITE_URL` con el dominio real (canónicas y Open Graph) y servir por HTTPS (HSTS se envía en producción).

## Seguir desarrollando con SDD

El SDD inicial está cerrado. Para un cambio nuevo:

```text
Lee CLAUDE.md y specs/portal-inmobiliario/.
Actualiza spec.md (qué) y plan.md (cómo) con el cambio, agrega la tarea
a tasks.md e impleméntala siguiendo el flujo de CLAUDE.md.
```

Los ajustes pequeños fuera de `tasks.md` (UI, bugs) se hacen sin tarea nueva y se anotan en `plan.md` si cambian una decisión.
