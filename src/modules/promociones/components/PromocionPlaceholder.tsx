"use client";

// ============================================================================
// modules/promociones/components/PromocionPlaceholder.tsx
// ----------------------------------------------------------------------------
// Grupo 9 — Promociones.
//
// RESUMEN chico de solo lectura para el detalle de un evento (Catálogo, Grupo 2):
// muestra las promociones vigentes del evento (código y % de descuento) que el
// comprador puede usar al comprar sus entradas. Datos por el API Gateway:
// GET /api/promociones/eventos/{eventoId}/promociones.
// El Grupo 2 solo lo importa y lo posiciona; no debe modificar este archivo.
// ============================================================================

import { useEffect, useState } from "react";
import "../promociones.css";
import { fechaCorta, obtenerPromocionesDeEvento, Promocion, promocionesVigentes } from "../api";

export default function PromocionPlaceholder({ eventoId }: { eventoId: string }) {
  const [promos, setPromos] = useState<Promocion[] | null>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    let activo = true;
    obtenerPromocionesDeEvento(eventoId)
      .then((lista) => activo && setPromos(promocionesVigentes(lista)))
      .catch(() => activo && setError(true));
    return () => {
      activo = false;
    };
  }, [eventoId]);

  if (error) {
    return <p className="modulo-promociones text-sm text-ticket-secondary">Promociones no disponibles en este momento.</p>;
  }
  if (promos === null) {
    return <p className="modulo-promociones text-sm text-ticket-secondary">Buscando promociones…</p>;
  }
  if (promos.length === 0) {
    return <p className="modulo-promociones text-sm text-ticket-secondary">Este evento no tiene promociones activas.</p>;
  }

  return (
    <div className="modulo-promociones flex flex-col gap-2">
      <strong className="text-ticket-primary">Promociones activas</strong>
      {promos.map((p) => (
        <div key={p._id} className="flex items-center gap-3 bg-ticket-banner border border-ticket-border rounded-lg px-3 py-2">
          <span className="font-bold text-ticket-primary">{p.porcentaje_descuento}%</span>
          <span className="text-sm">
            Usa el código <strong>{p.nombre_codigo}</strong>
            {p.minimo_entradas > 1 ? ` (mínimo ${p.minimo_entradas} entradas)` : ""} · hasta {fechaCorta(p.fecha_fin)}
          </span>
        </div>
      ))}
    </div>
  );
}
