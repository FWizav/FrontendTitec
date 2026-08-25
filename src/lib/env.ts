// Centraliza TODAS las URLs de los microservicios.
// Ningún módulo debe escribir una URL "a mano" en su código: siempre se
// importa desde acá. Así, si un grupo cambia de puerto o despliega su
// servicio en otra parte, solo se actualiza un lugar.

export const API_URLS = {
  auth: process.env.NEXT_PUBLIC_AUTH_API_URL ?? "http://localhost:3001",
  catalogo: process.env.NEXT_PUBLIC_CATALOGO_API_URL ?? "http://localhost:3002",
  entradas: process.env.NEXT_PUBLIC_ENTRADAS_API_URL ?? "http://localhost:3003",
  pagos: process.env.NEXT_PUBLIC_PAGOS_API_URL ?? "http://localhost:3004",
  checkin: process.env.NEXT_PUBLIC_CHECKIN_API_URL ?? "http://localhost:3005",
  resenas: process.env.NEXT_PUBLIC_RESENAS_API_URL ?? "http://localhost:3006",
  organizador: process.env.NEXT_PUBLIC_ORGANIZADOR_API_URL ?? "http://localhost:3007",
  notificaciones: process.env.NEXT_PUBLIC_NOTIFICACIONES_API_URL ?? "http://localhost:3008",
  promociones: process.env.NEXT_PUBLIC_PROMOCIONES_API_URL ?? "http://localhost:3009",
} as const;
