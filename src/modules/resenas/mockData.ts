import expoUvImage from "./assets/expo-uv-2026.png";
import type { CurrentUser, ReviewEvent } from "./types";

/**
 * El evento y el usuario siguen simulados para la interfaz. La asistencia se
 * verifica contra Check-in antes de habilitar el formulario.
 */

export const MOCK_EVENT: ReviewEvent = {
  id: "1",
  name: "Expo UV 2026 Valparaíso",
  status: "finalizado",
  organizerId: "1",
  imageSrc: expoUvImage,
};

/** Datos del evento según el id de la ruta. TODO: reemplazar por la API de Catálogo. */
export function getMockEvent(eventoId: string): ReviewEvent {
  return { ...MOCK_EVENT, id: eventoId };
}

export interface SimulatedUser {
  key: string;
  label: string;
  user: CurrentUser | null;
}

/** Usuarios para probar los distintos casos desde el selector temporal. */
export const SIMULATED_USERS: SimulatedUser[] = [
  { key: "attendee", label: "Asistente con check-in", user: { id: "2", name: "Carlos Ramirez" } },
  { key: "no-check-in", label: "Asistente sin check-in", user: { id: "3", name: "Maria Gonzalez" } },
  { key: "organizer", label: "Organizador del evento", user: { id: "1", name: "Ana Lopez" } },
  { key: "guest", label: "Visitante (sin sesión)", user: null },
];
