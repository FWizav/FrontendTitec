"use client";

// ============================================================================
// modules/resenas/components/ResenasPlaceholder.tsx
// ----------------------------------------------------------------------------
// Grupo 6 — Reseñas de un evento (HU1: calificar y comentar, HU4: respuesta
// pública del organizador).
//
// Se conserva el nombre y el export por defecto para no romper los imports que
// ya existen en:
//   - app/catalogo/[eventoId]/page.tsx          (detalle del evento, Grupo 2)
//   - app/catalogo/[eventoId]/resenas/page.tsx  (ruta propia, Grupo 6)
// Si se quiere renombrar a "Resenas", hay que coordinarlo con el Grupo 2.
// ============================================================================

import { useEffect, useState } from "react";
import { obtenerSesionResenas } from "../api";
import { getMockEvent } from "../mockData";
import type { CurrentUser } from "../types";
import { ReviewsSection } from "./ReviewsSection";

export default function ResenasPlaceholder({ eventoId }: { eventoId: string }) {
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [sessionError, setSessionError] = useState<string | null>(null);
  const event = { ...getMockEvent(eventoId), status: "finalizado" as const };

  useEffect(() => {
    let cancelled = false;
    obtenerSesionResenas()
      .then((user) => {
        if (cancelled) return;
        setCurrentUser(user);
        setSessionError(null);
      })
      .catch((error: unknown) => {
        if (cancelled) return;
        setCurrentUser(null);
        setSessionError(
          error instanceof Error
            ? error.message
            : "No se pudo validar la sesión con Auth.",
        );
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div>
      {sessionError && (
        <p role="alert">
          No se pudo consultar la sesión con Auth: {sessionError}
        </p>
      )}
      <ReviewsSection event={event} currentUser={currentUser} />
    </div>
  );
}
