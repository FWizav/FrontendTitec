// Todas las llamadas al microservicio de "Check-in" (Grupo 5) van acá.
// Nada de fetch/axios sueltos dentro de los componentes: siempre
// pasan por este archivo para mantener la lógica de red en un
// solo lugar y facilitar el testing/debug.

import { API_URLS } from "@/lib/env";

const BASE_URL = API_URLS.checkin;

// Ejemplo de función — bórrenla y reemplácenla por las suyas
export async function ejemploFetchCheckinPage() {
  const res = await fetch(`${BASE_URL}/checkin`);
  if (!res.ok) throw new Error("Error al consultar el servicio de Check-in");
  return res.json();
}
