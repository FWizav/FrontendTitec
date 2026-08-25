// Todas las llamadas al microservicio de "Catálogo de Eventos" (Grupo 2).
// Recuerden: este módulo solo CONSULTA información (búsqueda, filtros,
// detalle de evento). Crear/editar/eliminar eventos es responsabilidad
// del microservicio de Panel Organizador (Grupo 7).

import { API_URLS } from "@/lib/env";

const BASE_URL = API_URLS.catalogo;

export async function buscarEventos(query?: string) {
  const url = query ? `${BASE_URL}/eventos?q=${encodeURIComponent(query)}` : `${BASE_URL}/eventos`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Error al buscar eventos");
  return res.json();
}

export async function obtenerEvento(eventoId: string) {
  const res = await fetch(`${BASE_URL}/eventos/${eventoId}`);
  if (!res.ok) throw new Error("Error al obtener el evento");
  return res.json();
}
