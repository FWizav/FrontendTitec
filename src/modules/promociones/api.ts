// ============================================================================
// modules/promociones/api.ts
// ----------------------------------------------------------------------------
// Llamadas del módulo de Promociones (Grupo 9), SIEMPRE a través del API Gateway
// (/api/promociones/* -> promociones-service). La sesión es la cookie HttpOnly
// "jwt" de Auth: viaja sola con credentials: "include" y Promociones la valida con Auth.
// ============================================================================

import { GATEWAY_URL } from "@/lib/env";

const BASE_PATH = "/api/promociones";
const API = `${GATEWAY_URL.replace(/\/+$/, "")}${BASE_PATH}`;
const TIMEOUT_MS = 8000;

/** Página de inicio de sesión (módulo Auth). Igual que Pagos: NEXT_PUBLIC_LOGIN_URL o /auth. */
export const URL_LOGIN = process.env.NEXT_PUBLIC_LOGIN_URL || "/auth";

export function urlLogin(): string {
  if (typeof window === "undefined") return URL_LOGIN;
  const separador = URL_LOGIN.includes("?") ? "&" : "?";
  return `${URL_LOGIN}${separador}volver=${encodeURIComponent(window.location.href)}`;
}

// ---------------------------------------------------------------- tipos
export interface Promocion {
  _id: string;
  nombre_codigo: string;
  id_evento: string;
  porcentaje_descuento: number;
  fecha_inicio: string;
  fecha_fin: string;
  cantidad_codigos: number;
  usos_actuales: number;
  minimo_entradas: number;
  max_usos_por_cuenta: number;
  activo: boolean;
}

export interface NuevaPromocion {
  nombre_codigo: string;
  id_evento: string;
  porcentaje_descuento: number;
  fecha_inicio: string;
  fecha_fin: string;
  cantidad_codigos: number;
  minimo_entradas: number;
  max_usos_por_cuenta: number;
}

export interface UsuarioSesion {
  id_usuario: string;
  rol_usuario: string;
}

/** Error con el estado HTTP y un mensaje listo para mostrar al usuario. */
export class PromocionesApiError extends Error {
  status: number;
  constructor(status: number, mensaje: string) {
    super(mensaje);
    this.status = status;
  }
}

const MENSAJE_RED = "No pudimos conectar con el servicio de promociones. Inténtalo nuevamente en unos minutos.";

async function solicitar<T>(ruta: string, opciones: RequestInit = {}): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${API}${ruta}`, {
      ...opciones,
      credentials: "include",
      cache: "no-store",
      headers: { "Content-Type": "application/json", ...(opciones.headers as Record<string, string>) },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });
  } catch {
    throw new PromocionesApiError(0, MENSAJE_RED);
  }

  let cuerpo: any = null;
  try {
    cuerpo = await res.json();
  } catch {
    /* respuesta sin JSON */
  }

  if (!res.ok) {
    const porDefecto =
      res.status === 401 ? "Tu sesión no es válida o expiró. Vuelve a iniciar sesión."
      : res.status === 403 ? "Tu usuario no tiene permisos para gestionar promociones."
      : res.status === 404 ? "No encontramos lo que buscabas."
      : res.status === 502 || res.status === 503 || res.status === 504 ? "El servicio de promociones no está disponible en este momento. Inténtalo nuevamente en unos minutos."
      : "No se pudo completar la operación.";
    // Los errores del gateway traen "message"; los de Promociones, "mensaje"
    const detalle = Array.isArray(cuerpo?.detalle) ? ` ${cuerpo.detalle.join(" ")}` : "";
    throw new PromocionesApiError(res.status, (cuerpo?.mensaje || porDefecto) + detalle);
  }
  return cuerpo as T;
}

// ---------------------------------------------------------------- sesión (I1 vía Promociones -> Auth)
/** Usuario de la sesión según Auth (Promociones lo consulta). null = sin sesión. */
export async function obtenerSesion(): Promise<UsuarioSesion | null> {
  try {
    return await solicitar<UsuarioSesion>("/sesion");
  } catch (e) {
    if (e instanceof PromocionesApiError && e.status === 401) return null;
    throw e;
  }
}

// ---------------------------------------------------------------- gestión (organizador / staff)
export function listarPromociones() {
  return solicitar<Promocion[]>("");
}

export function crearPromocion(datos: NuevaPromocion) {
  return solicitar<Promocion>("", { method: "POST", body: JSON.stringify(datos) });
}

export function actualizarPromocion(id: string, cambios: Partial<Promocion>) {
  return solicitar<Promocion>(`/${encodeURIComponent(id)}`, { method: "PATCH", body: JSON.stringify(cambios) });
}

// ---------------------------------------------------------------- público (Catálogo)
// Usada por Catálogo (Grupo 2) para mostrar promociones activas en el detalle
// de un evento. Ver modules/promociones/components/PromocionPlaceholder.tsx
export async function obtenerPromocionesDeEvento(eventoId: string): Promise<Promocion[]> {
  return solicitar<Promocion[]>(`/eventos/${encodeURIComponent(eventoId)}/promociones`);
}

/** Promociones que hoy se pueden usar (activas, dentro de fechas y con cupos). */
export function promocionesVigentes(lista: Promocion[], ahora = Date.now()): Promocion[] {
  return lista.filter(
    (p) =>
      p.activo &&
      p.cantidad_codigos > 0 &&
      new Date(p.fecha_inicio).getTime() <= ahora &&
      new Date(p.fecha_fin).getTime() >= ahora,
  );
}

const MESES = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
export function fechaCorta(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "-";
  return `${String(d.getDate()).padStart(2, "0")} ${MESES[d.getMonth()]} ${d.getFullYear()}`;
}
