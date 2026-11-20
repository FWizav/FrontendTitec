import type { NewReviewInput, Review } from "./types";
import { GATEWAY_URL } from "@/lib/env";

const BASE_PATH = `${GATEWAY_URL}/api/resenas`;

interface ApiReview {
  num_resena: number;
  id_usuario: number | string;
  id_evento: string;
  clasificacion: number;
  descripcion: string | null;
  fecha_reseña: string;
  nombre_usuario?: string;
  respuesta_texto?: string | null;
  respuesta_fecha?: string | null;
  nombre_responsable?: string | null;
  reporte_motivo?: string | null;
  reporte_fecha?: string | null;
}

interface ApiReport {
  id_resena: number;
  id_evento: string;
  id_organizador: number;
  motivo: string;
  fecha_reporte: string;
}

interface ApiReply {
  id_resena: number;
  id_usuario: number | string;
  texto: string;
  fecha_respuesta: string;
  nombre_responsable: string | null;
}

function numericId(value: string, field: string): number {
  const id = Number(value);
  if (!Number.isSafeInteger(id) || id <= 0) {
    throw new Error(`${field} debe ser un número entero positivo.`);
  }
  return id;
}

function validEventId(value: string): boolean {
  return value.length > 0 && value.trim() === value && value.length <= 64;
}

async function parseResponse<T>(response: Response): Promise<T> {
  const body = (await response.json()) as T | { error?: string };
  if (!response.ok) {
    const message =
      typeof body === "object" && body !== null && "error" in body
        ? body.error
        : undefined;
    throw new Error(message || "No se pudo completar la solicitud.");
  }
  return body as T;
}

function mapReview(review: ApiReview): Review {
  return {
    id: String(review.num_resena),
    eventId: String(review.id_evento),
    userId: String(review.id_usuario),
    userName: review.nombre_usuario ?? "Usuario",
    rating: review.clasificacion,
    comment: review.descripcion ?? undefined,
    createdAt: review.fecha_reseña,
    reply: review.respuesta_texto
      ? {
          id: String(review.num_resena),
          authorName: review.nombre_responsable ?? "Organizador",
          text: review.respuesta_texto,
          createdAt: review.respuesta_fecha ?? review.fecha_reseña,
        }
      : undefined,
    report: review.reporte_motivo
      ? {
          reason: review.reporte_motivo,
          createdAt: review.reporte_fecha ?? review.fecha_reseña,
        }
      : undefined,
  };
}

export async function obtenerResenasDeEvento(eventoId: string): Promise<Review[]> {
  if (!validEventId(eventoId)) {
    throw new Error("El ID del evento debe tener entre 1 y 64 caracteres.");
  }
  const response = await fetch(`${BASE_PATH}?id_evento=${encodeURIComponent(eventoId)}`);
  const reviews = await parseResponse<ApiReview[]>(response);
  return reviews.map(mapReview);
}

export async function crearResena(
  eventoId: string,
  input: NewReviewInput,
): Promise<Review> {
  if (!validEventId(eventoId)) {
    throw new Error("El ID del evento debe tener entre 1 y 64 caracteres.");
  }
  const response = await fetch(BASE_PATH, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "include",
    body: JSON.stringify({
      id_evento: eventoId,
      clasificacion: input.rating,
      descripcion: input.comment,
    }),
  });
  const review = await parseResponse<ApiReview>(response);
  return mapReview(review);
}

export interface ReviewEligibilityResult {
  puedeResenar: boolean;
  motivo: "NO_ASISTIO" | "YA_RESENO" | null;
}

export async function verificarElegibilidad(
  eventoId: string,
): Promise<ReviewEligibilityResult> {
  if (!validEventId(eventoId)) {
    throw new Error("El ID del evento debe tener entre 1 y 64 caracteres.");
  }
  const params = new URLSearchParams({ eventoId });
  const response = await fetch(`${BASE_PATH}/eligibilidad?${params.toString()}`, {
    credentials: "include",
    cache: "no-store",
  });
  const result = await parseResponse<ReviewEligibilityResult>(response);
  if (
    !result ||
    typeof result !== "object" ||
    typeof result.puedeResenar !== "boolean" ||
    (result.motivo !== null &&
      result.motivo !== "NO_ASISTIO" &&
      result.motivo !== "YA_RESENO") ||
    (result.puedeResenar && result.motivo !== null) ||
    (!result.puedeResenar && result.motivo === null)
  ) {
    throw new Error("La API devolvió una respuesta de elegibilidad inválida.");
  }
  return result;
}

export interface AuthenticatedReviewUser {
  id: string;
  name: string;
  role: "usuario" | "organizador" | "staff";
}

export async function obtenerSesionResenas(): Promise<AuthenticatedReviewUser | null> {
  const response = await fetch(`${BASE_PATH}/me`, {
    credentials: "include",
    cache: "no-store",
  });
  if (response.status === 401) return null;

  const body = await parseResponse<{ user: AuthenticatedReviewUser }>(response);
  if (
    !body?.user ||
    typeof body.user.id !== "string" ||
    typeof body.user.name !== "string" ||
    !["usuario", "organizador", "staff"].includes(body.user.role)
  ) {
    throw new Error("La API devolvió un perfil de sesión inválido.");
  }
  return body.user;
}

export async function crearRespuesta(
  reviewId: string,
  text: string,
): Promise<ApiReply> {
  const response = await fetch(
    `${BASE_PATH}/${numericId(reviewId, "El ID de la reseña")}/respuestas`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({
        texto: text,
      }),
    },
  );
  return parseResponse<ApiReply>(response);
}

/**
 * HU3 · El organizador reporta una reseña indicando el motivo.
 * POST /api/resenas/:id/reportes  { motivo }
 * El organizador y el evento los toma el backend desde la sesión (cookie),
 * el front no los envía: así no se pueden falsificar.
 */
export async function reportarResena(
  reviewId: string,
  reason: string,
): Promise<ApiReport> {
  const response = await fetch(
    `${BASE_PATH}/${numericId(reviewId, "El ID de la reseña")}/reportes`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ motivo: reason }),
    },
  );
  return parseResponse<ApiReport>(response);
}

/**
 * HU3 · El organizador elimina una reseña que reportó antes.
 * DELETE /api/resenas/:id  (el backend responde 409 si no estaba reportada).
 */
export async function eliminarResena(reviewId: string): Promise<void> {
  const response = await fetch(
    `${BASE_PATH}/${numericId(reviewId, "El ID de la reseña")}`,
    { method: "DELETE", credentials: "include" },
  );
  if (!response.ok) {
    await parseResponse<unknown>(response); // lanza con el mensaje de la API
  }
}
