import { GATEWAY_URL } from "@/lib/env";

const BASE_PATH = "/api/organizador/v1/panel/eventos";
const API_URL = `${GATEWAY_URL.replace(/\/+$/, "")}${BASE_PATH}`;

export class ApiError extends Error {
  status: number;
  detalles: Array<{ campo: string; mensaje: string }>;
  codigo: string;

  constructor(
    status: number,
    message: string,
    detalles: Array<{ campo: string; mensaje: string }> = [],
    codigo: string = ""
  ) {
    super(message);
    this.name = "ApiError";
    this.status = status;
    this.detalles = detalles;
    this.codigo = codigo;
  }
}

function defaultMessageForStatus(status: number): string {
  switch (status) {
    case 401:
      return "Tu sesión no es válida o expiró.";
    case 403:
      return "No tienes permisos para realizar esta acción.";
    case 500:
      return "Ocurrió un error inesperado en el servidor.";
    case 503:
      return "El servicio no está disponible en este momento.";
    default:
      return "Ocurrió un error al comunicarse con el servidor.";
  }
}

export async function request<T = any>(
  path: string,
  {
    method = "GET",
    body,
    signal,
  }: { method?: string; body?: any; signal?: AbortSignal } = {}
): Promise<T> {
  let response: Response;
  const url = `${API_URL}${path}`;

  try {
    response = await fetch(url, {
      method,
      credentials: "include",
      cache: "no-store",
      headers: body ? { "Content-Type": "application/json" } : undefined,
      body: body ? JSON.stringify(body) : undefined,
      signal,
    });
  } catch (networkError: any) {
    if (networkError?.name === "AbortError") throw networkError;
    throw new ApiError(503, "No se pudo contactar al servidor. Intenta nuevamente en unos segundos.");
  }

  if (response.status === 401) {
    if (typeof window !== "undefined") {
      window.location.assign("/auth/admin/login");
    }
    throw new ApiError(401, "Tu sesión no es válida o expiró.", [], "UNAUTHORIZED");
  }

  let payload: any = null;
  const text = await response.text();
  if (text) {
    try {
      payload = JSON.parse(text);
    } catch {
      payload = text;
    }
  }

  if (!response.ok) {
    const apiError = payload && typeof payload === "object" ? payload.error : null;
    throw new ApiError(
      response.status,
      apiError?.mensaje || defaultMessageForStatus(response.status),
      apiError?.detalles ?? [],
      apiError?.codigo ?? ""
    );
  }

  return payload;
}

export function obtenerMisEventos(signal?: AbortSignal) {
  return request("/mios", { signal });
}

export function obtenerEvento(idEvento: string, signal?: AbortSignal) {
  return request(`/mios/${idEvento}`, { signal });
}

export function crearEvento(datosEvento: any) {
  return request("", { method: "POST", body: datosEvento });
}

export function editarEvento(idEvento: string, cambios: any) {
  return request(`/mios/${idEvento}`, { method: "PATCH", body: cambios });
}

export function publicarEvento(idEvento: string) {
  return request(`/mios/${idEvento}/publicar`, { method: "POST" });
}

export function eliminarEvento(idEvento: string) {
  return request(`/mios/${idEvento}`, { method: "DELETE" });
}
