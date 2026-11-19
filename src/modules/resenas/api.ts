import type { NewReviewInput, Review } from "./types";
import { GATEWAY_URL } from "@/lib/env";

// Todas las llamadas pasan por el API Gateway (/api/resenas/...), nunca directo
// al microservicio. Para probar en local sin Gateway, apunta
// NEXT_PUBLIC_GATEWAY_URL a la API de reseñas (por ejemplo http://localhost:5000).
const BASE_PATH = `${GATEWAY_URL}/api/resenas`;

interface ApiReview {
  num_resena: number;
  id_usuario: number;
  id_evento: number;
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
  id_usuario: number;
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
  const id = numericId(eventoId, "El ID del evento");
  const response = await fetch(`${BASE_PATH}?id_evento=${id}`);
  const reviews = await parseResponse<ApiReview[]>(response);
  return reviews.map(mapReview);
}

export async function crearResena(
  eventoId: string,
  userId: string,
  input: NewReviewInput,
): Promise<Review> {
  const response = await fetch(BASE_PATH, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      id_usuario: numericId(userId, "El ID del usuario"),
      id_evento: numericId(eventoId, "El ID del evento"),
      clasificacion: input.rating,
      descripcion: input.comment,
    }),
  });
  const review = await parseResponse<ApiReview>(response);
  return mapReview(review);
}

export async function crearRespuesta(
  reviewId: string,
  userId: string,
  text: string,
): Promise<ApiReply> {
  const response = await fetch(
    `${BASE_PATH}/${numericId(reviewId, "El ID de la reseña")}/respuestas`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        id_usuario: numericId(userId, "El ID del usuario"),
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
