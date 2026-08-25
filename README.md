# Plataforma de Eventos — Front-end

Este repositorio es la **base común del front-end**, entregada por el _platform team_.
Está hecha en **Next.js** (un framework construido sobre React, que además trae el sistema
de rutas y la estructura de carpetas ya resuelta).

Cada uno de los 9 grupos trabaja en **sus propias carpetas**, sin tocar el código de los
demás. Este documento explica exactamente qué carpetas le corresponden a cada grupo.

---

## 1. Antes de empezar

```bash
npm install        # instala dependencias
cp .env.example .env.local   # copia las variables de entorno
npm run dev        # levanta el proyecto en http://localhost:3000
```

Abran `.env.local` y reemplacen la URL de su microservicio por la que les entregue su
propio grupo de backend (o `localhost:PUERTO` mientras prueban en su PC).

---

## 2. Idea general de la estructura

Hay dos carpetas importantes dentro de `src/`, y cumplen roles distintos:

- **`src/app/`** → define **QUÉ URL** muestra **QUÉ**. Es el "mapa" de rutas de Next.js:
  cada carpeta dentro de `app/` es una página (`app/pagos/` = ruta `/pagos`). Los archivos
  acá deben ser **cortos**: solo importan y muestran el componente principal de su módulo.

- **`src/modules/`** → acá vive **TODO el trabajo real** de cada grupo: las llamadas a su
  microservicio (`api.ts`) y todos sus componentes (`components/`). Este es el lugar donde
  van a pasar el 95% del tiempo programando.

Piensen a `app/` como el "letrero de la puerta" y a `modules/` como la "oficina" donde
realmente se trabaja.

```
src/
├── app/            ← rutas (letreros de puerta) — NO programen lógica acá
├── components/     ← Header, Footer y UI compartida — NO LO TOQUEN sin acuerdo de los 9 grupos
├── modules/        ← acá programa cada grupo, en SU carpeta
└── lib/env.ts       ← URLs de los 9 microservicios, centralizadas
```

---

## 3. Qué carpetas usa cada grupo

**Regla general:** cada grupo edita **solo** `src/app/<su-ruta>/` y `src/modules/<su-módulo>/`.
No hace falta tocar nada fuera de esas dos carpetas.

| #   | Grupo                 | Ruta (`src/app/...`)                                | Su carpeta de trabajo (`src/modules/...`) |
| --- | --------------------- | --------------------------------------------------- | ----------------------------------------- |
| 1   | Auth                  | `app/auth/`                                         | `modules/auth/`                           |
| 2   | Catálogo de eventos   | `app/catalogo/` y `app/catalogo/[eventoId]/`        | `modules/catalogo/`                       |
| 3   | Entradas / Inventario | `app/entradas/`                                     | `modules/entradas/`                       |
| 4   | Pagos                 | `app/pagos/`                                        | `modules/pagos/`                          |
| 5   | Check-in              | `app/checkin/`                                      | `modules/checkin/`                        |
| 6   | Reseñas               | `app/catalogo/[eventoId]/resenas/` ⚠️ ver sección 4 | `modules/resenas/`                        |
| 7   | Panel organizador     | `app/organizador/`                                  | `modules/organizador/`                    |
| 8   | Notificaciones        | `app/notificaciones/`                               | `modules/notificaciones/`                 |
| 9   | Promociones           | `app/promociones/`                                  | `modules/promociones/`                    |

Dentro de `modules/<su-módulo>/` van a encontrar:

- `api.ts` → acá van todas las llamadas `fetch` a su propio microservicio (ya viene
  configurado para leer la URL correcta desde `lib/env.ts`, no hace falta escribirla de nuevo).
- `components/` → acá van todos los componentes visuales de su módulo. Pueden crear los
  archivos y sub-carpetas que necesiten, siempre dentro de esta carpeta.

Ya dejamos un componente de ejemplo (`...Placeholder.tsx`) en cada módulo para que el
proyecto compile desde el día 1. Bórrenlo o reemplácenlo por su interfaz real.

---

## 4. Caso especial: Catálogo (Grupo 2) y Reseñas (Grupo 6)

Estos dos grupos son los únicos que "comparten vecindario" de rutas, así que léanlo con
calma:

Las reseñas de un evento se muestran **dentro** de la página de detalle de ese evento —
por eso su URL vive anidada: `/catalogo/123/resenas`. Eso significa que, dentro de la
carpeta `app/catalogo/`, va a existir una sub-carpeta que le pertenece al Grupo 6:

```
app/catalogo/
├── page.tsx                    ← Grupo 2 (listado/búsqueda de eventos)
├── [eventoId]/
│   ├── page.tsx                ← Grupo 2 (detalle del evento)
│   └── resenas/
│       └── page.tsx            ← Grupo 6 (reseñas de ESE evento)
```

**Reglas para que esto no genere conflictos:**

1. El **Grupo 2** no edita `app/catalogo/[eventoId]/resenas/page.tsx`.
2. El **Grupo 6** no edita `app/catalogo/page.tsx` ni `app/catalogo/[eventoId]/page.tsx`.
3. Aunque las carpetas de ruta estén "cerca", la lógica de cada grupo vive completamente
   separada en `modules/catalogo/` y `modules/resenas/` — nunca se mezcla código de un
   grupo dentro de los archivos del otro.
4. El único punto de contacto real es visual: el Grupo 2, en su página de detalle de
   evento (`modules/catalogo/components/DetalleEventoPlaceholder.tsx`), puede importar
   y mostrar el componente de reseñas del Grupo 6
   (`modules/resenas/components/ResenasPlaceholder.tsx`) — así como ya está armado de
   ejemplo. Si alguno de los dos grupos necesita cambiar cómo se ve o se comporta esa
   integración, se coordinan directamente entre ustedes antes de tocar el código.

Recuerden también el límite de responsabilidad que ya viene del enunciado del proyecto:
**Catálogo solo busca/lista/consulta eventos — no crea, modifica ni elimina eventos**
(eso es el Panel organizador, Grupo 7).

---

## 5. Header y Footer (los 9 grupos)

`src/components/layout/Header.tsx` y `Footer.tsx` aparecen en **todas** las páginas de la
plataforma (se muestran una sola vez desde `src/app/layout.tsx`, el layout raíz de Next.js).

- Ya vienen con un contenido de ejemplo para que el proyecto se vea bien desde el día 1.
- El contenido final (qué logo, qué links, qué información del footer) lo **acuerdan entre
  los 9 grupos** en conjunto — no lo decide un solo grupo por su cuenta.
- Una vez acordado, **una sola persona** (o el platform team) implementa el cambio en esos
  dos archivos. Si después hace falta ajustar algo, se propone como Pull Request y lo
  revisa el platform team antes de aprobarlo — así evitamos que 9 grupos editen el mismo
  archivo al mismo tiempo y se pisen los cambios.

---

## 6. Reglas generales de trabajo en Git

1. Nunca se trabaja directo sobre `main`. Cada cambio va en un branch corto:
   `feature/<grupo>-<que-hace>` (ej. `feature/pagos-formulario-checkout`).
2. Al terminar, se abre un Pull Request contra `main`. Se recomienda que lo revise alguien
   de otro grupo.
3. Traten de integrar seguido (cambios chicos y frecuentes) en vez de acumular todo el
   trabajo para el final — así los conflictos, si aparecen, son fáciles de resolver.
4. Si su cambio _solo_ toca `app/<su-ruta>/` y `modules/<su-módulo>/`, prácticamente no
   deberían tener conflictos de Git con otros grupos.

---

## 7. Conectar con su microservicio

Cada grupo de backend expone su servicio en su propia URL/puerto. Ya está resuelto en
`src/lib/env.ts` — solo necesitan definir la URL correcta en `.env.local` (ver sección 1)
y usar las funciones de su propio `modules/<su-módulo>/api.ts` para llamar a su API.

Ejemplo (ya armado en `modules/catalogo/api.ts`):

```ts
import { API_URLS } from "@/lib/env";

const BASE_URL = API_URLS.catalogo;

export async function buscarEventos(query?: string) {
  const res = await fetch(`${BASE_URL}/eventos?q=${query ?? ""}`);
  return res.json();
}
```

No hardcodeen URLs de microservicios en ningún otro archivo — siempre pasan por
`lib/env.ts`.
