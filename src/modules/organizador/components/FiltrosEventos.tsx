"use client";

import { useEffect, useRef } from "react";
import styles from "./FiltrosEventos.module.css";

const OPCIONES = [
  { valor: "TODOS", etiqueta: "Todos" },
  { valor: "BORRADOR", etiqueta: "Borrador" },
  { valor: "PUBLICADO", etiqueta: "Publicado" },
  { valor: "FINALIZADO", etiqueta: "Finalizado" },
  { valor: "CANCELADO", etiqueta: "Cancelado" },
];

interface FiltrosEventosProps {
  eventos: any[];
  filtroActivo: string;
  onCambiarFiltro: (filtro: string) => void;
  busqueda: string;
  onCambiarBusqueda: (busqueda: string) => void;
  enfocarBuscador?: boolean;
}

export default function FiltrosEventos({
  eventos,
  filtroActivo,
  onCambiarFiltro,
  busqueda,
  onCambiarBusqueda,
  enfocarBuscador,
}: FiltrosEventosProps) {
  const buscadorRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (enfocarBuscador) buscadorRef.current?.focus();
  }, [enfocarBuscador]);

  const contarPorEstado = (estado: string) =>
    estado === "TODOS"
      ? eventos.length
      : eventos.filter((e) => e.estado_gestion === estado).length;

  return (
    <div className={styles.filtrosEventos}>
      <div
        className={styles.pills}
        role="tablist"
        aria-label="Filtrar por estado"
      >
        {OPCIONES.map((op) => (
          <button
            key={op.valor}
            role="tab"
            aria-selected={filtroActivo === op.valor}
            className={`${styles.pill} ${
              filtroActivo === op.valor ? styles.pillActivo : ""
            }`}
            onClick={() => onCambiarFiltro(op.valor)}
          >
            {op.etiqueta}{" "}
            <span className={styles.contador}>
              {contarPorEstado(op.valor)}
            </span>
          </button>
        ))}
      </div>

      <label className={styles.buscador}>
        <span className={styles.visuallyHidden}>Buscar evento</span>
        <input
          ref={buscadorRef}
          type="search"
          placeholder="Buscar evento..."
          value={busqueda}
          onChange={(e) => onCambiarBusqueda(e.target.value)}
        />
      </label>
    </div>
  );
}
