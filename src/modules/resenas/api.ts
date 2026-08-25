// Todas las llamadas al microservicio de "Reseñas" (Grupo 6).
// Aunque la RUTA de esta página vive dentro de catalogo/[eventoId]/,
// las llamadas a la API siguen yendo al microservicio de Reseñas,
// no al de Catálogo.

import { API_URLS } from "@/lib/env";

const BASE_URL = API_URLS.resenas;

export async function obtenerResenas(eventoId: string) {
  const res = await fetch(`${BASE_URL}/eventos/${eventoId}/resenas`);
  if (!res.ok) throw new Error("Error al obtener reseñas");
  return res.json();
}

export async function crearResena(eventoId: string, data: unknown) {
  const res = await fetch(`${BASE_URL}/eventos/${eventoId}/resenas`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  if (!res.ok) throw new Error("Error al crear reseña");
  return res.json();
}
