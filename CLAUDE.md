# CLAUDE.md

Portal inmobiliario (Chile). Spec-Driven Development: `specs/portal-inmobiliario/` es la fuente de verdad.

- `spec.md`: qué construir. Manda ante cualquier duda funcional.
- `plan.md`: decisiones técnicas vigentes. Si una tarea cambia una decisión, actualiza `plan.md` en la misma tarea.
- `tasks.md`: progreso. Una tarea a la vez, en orden.

## Flujo por tarea

1. Lee en `tasks.md` la primera tarea pendiente y, de `spec.md`/`plan.md`, solo las secciones que la afectan.
2. Implementa únicamente esa tarea. No adelantes trabajo de pasos futuros (galería, mapa, contacto, auth, admin…).
3. Verifica (ver «Verificación») y corrige hasta que todo pase.
4. Marca `[x]` en `tasks.md` solo con la verificación en verde; anota debajo ajustes o límites relevantes.
5. Detente. No avances al siguiente paso sin que el usuario lo pida.

Ajustes pedidos fuera de `tasks.md` (UI, bugs): hazlos sin marcar tareas, salvo que el usuario indique dónde anotarlos.

## Arquitectura real (no inventar otra)

Monorepo npm workspaces:

- `apps/web` (`@portal/web`, :3000): Next.js 16.3.7 + React 19 + Tailwind 4 + SWR. Sin acceso a BD. Depende solo de `@portal/shared`.
  - El navegador llama a `/api/**`, que `next.config.ts` reenvía a `API_INTERNAL_URL`.
  - Los Server Components llaman al backend directamente por `API_INTERNAL_URL` (patrón: `lib/property-detail-api.ts`).
- `apps/api` (`@portal/api`, :4000): solo Route Handlers REST → `services/` → `repositories/` → Prisma 7.10.0 (`adapter-pg`) → PostgreSQL 16.
  - Errores HTTP con forma `{ message, status }` vía `lib/http/api-error.ts`.
  - Cliente Prisma generado en `apps/api/src/generated/prisma`: no se versiona; regenéralo con `npm run db:generate`.
- `packages/shared` (`@portal/shared`): contrato REST, con tipos, enums, límites y esquemas Zod. Los enums deben coincidir con Prisma (hay un test que lo comprueba).

Prohibido: Server Actions; acceder a la BD desde `apps/web`; secretos en variables `NEXT_PUBLIC_*`; imágenes binarias en BD.
Integraciones previstas en `plan.md`: Cloudinary (imágenes), Leaflet + OpenStreetMap con geocodificación Nominatim (ubicación, sin clave) y Web3Forms (contacto). Credenciales siempre por env (`.env.example` en cada app).

## Reglas no obvias

- Versiones fijadas (`next` 16.3.7, `prisma` 7.10.0). No actualices dependencias ni agregues nuevas sin pedirlo.
- APIs de Next 16: consulta `node_modules/next/dist/docs/` antes de usar convenciones de archivos o APIs que no estén ya en el código. Ejemplo: `error.tsx` recibe `retry`.
- `typecheck` ejecuta `next typegen` (tipos `PageProps`/`LayoutProps`/`RouteContext`): usa siempre el script, no `tsc` solo.
- `next.config.ts` lleva `agentRules: false` para que `next dev` no modifique este archivo. No lo quites.
- Búsqueda: `Property.searchText` lo mantiene un trigger SQL (`search_normalize`). Nunca lo asignes desde código. La normalización JS (`normalizeSearchText`) debe coincidir con la SQL; hay un test que las compara.
- Estado del catálogo (página, búsqueda, filtros, orden) en la URL, con los mismos nombres de parámetros que la API.
- Imágenes del seed: `publicId` con prefijo `seed-placeholder/` (Unsplash). La integración con Cloudinary no debe intentar borrarlas.
- UI: usa los tokens de `apps/web/src/app/globals.css` (`paper`, `surface`, `ink`, `muted`, `line`, `accent`, `brass`…, con modo oscuro). No uses colores Tailwind sueltos (`zinc-*`, `sky-*`).
- Tipografía: `font-display` (Cormorant) solo en títulos, precios y marca; `font-sans` (Hanken) para el resto.
- El movimiento debe respetar `prefers-reduced-motion`.
- Código, nombres y commits en inglés; UI y documentación en español. Nombres explícitos, sin abreviaturas. TypeScript estricto, sin `any`.
- Valida toda entrada en el backend con los esquemas de `@portal/shared`. Protege USER/ADMIN también en el servidor.

## Comandos (raíz)

| Comando | Uso |
|---|---|
| `npm run dev` | API y web juntas (`dev:api` / `dev:web` por separado) |
| `npm test` / `lint` / `typecheck` / `build` | Todos los workspaces; acota con `-w @portal/web` (o `api`/`shared`) |
| `npx vitest run <ruta>` | Test puntual, desde el workspace |
| `npm run db:migrate` / `db:seed` / `db:generate` / `db:status` | Prisma, en `apps/api` |

- Tests de API: son de integración contra la BD `portal_inmobiliario_test` (`apps/api/.env.test.local`). `global-setup` se niega a usar una BD cuyo nombre no termine en `_test`; corren sin paralelismo entre archivos.
- PostgreSQL corre en Docker (contenedor `postgres`); pgAdmin, en :5050. Detalles en `README.md`.
- Servidores para verificar en navegador: `.claude/launch.json` (`web`, `api`) con `preview_start`. Si el API cambia de esquema, regenera Prisma y reinicia `api`.

## Inspección antes de modificar

- Lee siempre el archivo que vas a editar y busca con `Grep` sus usos antes de cambiar una firma o un contrato compartido.
- Reutiliza antes de crear: `lib/property-format.ts`, `lib/api-client.ts`, `lib/cn.ts`, hooks SWR, esquemas de `@portal/shared`.
- Investiga (sin editar) cuando la causa no está clara: reproduce, revisa los logs del servidor y forma hipótesis. Recién entonces corrige.
- No explores por precaución: nada de lecturas completas del repo, `node_modules`, `.next` ni código generado salvo necesidad concreta.

## Verificación (proporcional al cambio)

| Cambio | Mínimo exigido |
|---|---|
| Lógica en `lib/`, servicio o repositorio | Tests del archivo y del workspace |
| Contrato en `shared` o Route Handler | Tests de `shared` y `api` + `typecheck` |
| Componente o página | Tests del workspace + `lint` + `typecheck` + revisión en el navegador (escritorio y 375 px; sin desborde horizontal; consola limpia) |
| Cierre de una tarea de `tasks.md` | `test`, `lint`, `typecheck` y `build` del workspace afectado, en verde |
| Migración | `db:migrate` en dev + tests de `api` (aplican las migraciones a `_test`) |

Toda funcionalidad nueva lleva su test (Vitest; componentes con `renderToStaticMarkup`). No declares algo verificado sin haberlo ejecutado. Informa qué no se pudo verificar.

## Skills: cuándo sí y cuándo no

Del proyecto (en `.claude/skills/`, enlazadas desde `.agents/skills/`):

- **`web-design-guidelines`**
  - Sí: al crear o modificar UI, y para auditar accesibilidad, foco, formularios, responsive o consistencia. Descarga las reglas vigentes con WebFetch.
  - No: cambios sin efecto visual (API, `lib/`, tests).
- **`frontend-design`**
  - Sí: al decidir dirección visual, composición, tipografía o jerarquía de pantallas nuevas o rediseños. Respeta los tokens y la dirección visual ya existente.
  - No: ajustes de estilo menores dentro del sistema actual.
- **`react-rules`**
  - Sí: solo sus reglas generales (componentes puros, hooks, uso correcto de `useEffect`, Zod).
  - No: no introduzcas Zustand, React Hook Form ni React Query, que no están en el stack (se usan SWR, `useState` y la URL). Requeriría pedirlo explícitamente.

Del usuario (instaladas en `~/.claude/skills`, no versionadas):

- **`surgical-patch`**
  - Sí: bugs y cambios pequeños, aislados y de bajo alcance, aplicados en la capa responsable y con prueba de regresión.
  - No: funcionalidades nuevas ni rediseños.
- **`mvp-planner`**
  - Sí: antes de implementar cuando el alcance no está claro o el cambio es multicapa.
  - Cadena: en LIGHT, `surgical-patch` → `verify-and-stop`; en STANDARD o superior, `ponytail` → `surgical-patch` → `verify-and-stop`.
  - No: correcciones evidentes de una línea.
- **`investigate-first`**: fallos ambiguos o intermitentes antes de editar.
- **`verify-and-stop`**: cerrar una tarea con la prueba mínima suficiente, sin ampliar el alcance.
- **`code-review`**: solo cuando se pida revisar una rama o PR.

No uses skills para preguntas, lecturas o cambios triviales. No lances subagentes salvo que se pidan.

## Alcance y git

- Parche mínimo correcto. Sin refactors, renombres, reformateos ni cambios en archivos no relacionados.
- No modifiques la configuración del proyecto (`next.config.ts`, `package.json`, `.claude/`) sin una necesidad explícita.
- Commits solo cuando se pidan.
  - Mensaje en inglés, estilo `feat: … (tasks N-M)`, en una rama `feat/*`.
  - Fuera del commit: `.env*` (salvo `.env.example`), cliente Prisma generado y archivos ajenos a la tarea.
- Sin operaciones destructivas sobre git, archivos o bases de datos sin autorización. La BD de desarrollo tiene datos del seed; los tests usan solo `_test`.
