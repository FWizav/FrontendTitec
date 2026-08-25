// Todas las llamadas al microservicio de "Promociones" (Grupo 9) van acá.
// Nada de fetch/axios sueltos dentro de los componentes: siempre
// pasan por este archivo para mantener la lógica de red en un
// solo lugar y facilitar el testing/debug.

import { API_URLS } from "@/lib/env";

const BASE_URL = API_URLS.promociones;

// Ejemplo de función — bórrenla y reemplácenla por las suyas
export async function ejemploFetchPromocionesPage() {
  const res = await fetch(`${BASE_URL}/promociones`);
  if (!res.ok) throw new Error("Error al consultar el servicio de Promociones");
  return res.json();
}
