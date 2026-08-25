// Todas las llamadas al microservicio de "Panel Organizador" (Grupo 7) van acá.
// Nada de fetch/axios sueltos dentro de los componentes: siempre
// pasan por este archivo para mantener la lógica de red en un
// solo lugar y facilitar el testing/debug.

import { API_URLS } from "@/lib/env";

const BASE_URL = API_URLS.organizador;

// Ejemplo de función — bórrenla y reemplácenla por las suyas
export async function ejemploFetchOrganizadorPage() {
  const res = await fetch(`${BASE_URL}/organizador`);
  if (!res.ok) throw new Error("Error al consultar el servicio de Panel Organizador");
  return res.json();
}
