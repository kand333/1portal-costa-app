# Portal Inmobiliario — SDD

Proyecto base para desarrollar un portal inmobiliario utilizando **Spec-Driven Development (SDD)** con Claude Code.

## Estructura

Monorepo con npm workspaces:

```text
.
├── CLAUDE.md
├── apps/
│   ├── web/        # @portal/web — frontend Next.js (puerto 3000)
│   └── api/        # @portal/api — backend Next.js, REST + Prisma (puerto 4000)
├── packages/
│   └── shared/     # @portal/shared — contrato REST: tipos, enums y esquemas Zod
└── specs/
    └── portal-inmobiliario/
        ├── spec.md
        ├── plan.md
        └── tasks.md
```

El navegador solo habla con `apps/web`; este reenvía `/api/**` a `apps/api` (variable `API_INTERNAL_URL`, por defecto `http://localhost:4000`).

## Documentos

### `CLAUDE.md`

Contiene las instrucciones permanentes que Claude Code debe seguir durante el desarrollo.

### `spec.md`

Define **qué debe hacer la aplicación**: funcionalidades, usuarios, propiedades, filtros, imágenes, ubicación, contacto, administración y criterios de aceptación.

### `plan.md`

Define **cómo se construirá técnicamente**: arquitectura, PostgreSQL, API REST, autenticación, Cloudinary, Google Maps, Web3Forms y separación de responsabilidades.

### `tasks.md`

Divide la implementación en una secuencia incremental de tareas.

## Comenzar con Claude Code

Abre Claude Code desde la raíz del repositorio y utiliza:

```text
Lee CLAUDE.md y todos los documentos del directorio
specs/portal-inmobiliario/.

Analiza la especificación, el plan técnico y la lista de tareas.

Comienza únicamente con la primera tarea pendiente de tasks.md.
No avances a la siguiente tarea hasta que te lo indique.
```

Para continuar posteriormente:

```text
Continúa con la siguiente tarea pendiente de tasks.md.

Consulta spec.md y plan.md cuando sea necesario.
Implementa únicamente esa tarea, valida los cambios y márcala
como completada cuando esté correctamente terminada.

No avances a la siguiente tarea.
```

## Desarrollo local

Requisitos: Node.js 24 y un contenedor Docker de PostgreSQL llamado `postgres` con el puerto `5432` publicado.

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

### 3. Variables de entorno

Cada aplicación tiene su `.env.example`.

Backend (`apps/api/.env.example`), copiar a:

- `apps/api/.env.local` → `DATABASE_URL` apuntando a `portal_inmobiliario`.
- `apps/api/.env.test.local` → solo `DATABASE_URL` apuntando a `portal_inmobiliario_test`.

Frontend (`apps/web/.env.example`): solo variables públicas y `API_INTERNAL_URL`; crear `apps/web/.env.local` cuando un valor difiera del predeterminado. Nunca poner secretos del backend en el frontend.

Next.js ignora `.env.local` cuando `NODE_ENV=test` (Vitest), por eso las pruebas usan `.env.test.local`. Ningún archivo `.env*` salvo `.env.example` se versiona.

### 4. Comandos

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
| `npm run db:deploy` | Aplicar migraciones existentes |
| `npm run db:status` | Estado de migraciones |
| `npm run db:seed` | Cargar datos de desarrollo (re-ejecutable, no duplica) |
| `npm run db:generate` | Regenerar el cliente Prisma |

### 5. pgAdmin (opcional)

Crear `.env.pgadmin` (ignorado por git) con `PGADMIN_DEFAULT_EMAIL` y `PGADMIN_DEFAULT_PASSWORD` (mínimo 6 caracteres; para una clave más corta añadir `PGADMIN_CONFIG_PASSWORD_LENGTH_MIN`), y ejecutar:

```bash
docker run -d --name pgadmin --restart always -p 127.0.0.1:5050:80 --env-file .env.pgadmin -v pgadmin-data:/var/lib/pgadmin dpage/pgadmin4:9.18.0
```

Abrir `http://localhost:5050` y registrar el servidor con host `host.docker.internal`, puerto `5432`.
