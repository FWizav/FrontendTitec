// ============================================================================
// modules/catalogo/components/DetalleEventoPlaceholder.tsx
// ----------------------------------------------------------------------------
// Grupo 2 — Detalle de un evento específico dentro del catálogo.
// Este componente puede mostrar datos generales del evento y, más abajo,
// insertar el bloque de Reseñas (que es OTRO componente, de OTRO grupo,
// importado desde modules/resenas/ — ver ResenasPlaceholder.tsx).
// ============================================================================

export default function DetalleEventoPlaceholder({ eventoId }: { eventoId: string }) {
  return (
    <div>
      <h1>Detalle del evento {eventoId}</h1>
      <p>Información general del evento, promociones y entradas disponibles.</p>
      <p><em>Reemplacen este contenido por el detalle real del evento.</em></p>
    </div>
  );
}
