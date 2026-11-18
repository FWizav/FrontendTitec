"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { MapPin, Pencil, Check, Trash2 } from "lucide-react";
import BadgeEstado from "./BadgeEstado";
import styles from "./TarjetaEvento.module.css";

const MESES = ["ENE", "FEB", "MAR", "ABR", "MAY", "JUN", "JUL", "AGO", "SEP", "OCT", "NOV", "DIC"];

function formatearFecha(fechaISO: string) {
  if (!fechaISO) return { mes: "—", dia: "—" };
  const [, mes, dia] = fechaISO.split("-").map(Number);
  return { mes: MESES[(mes || 1) - 1], dia: String(dia || "—").padStart(2, "0") };
}

interface TarjetaEventoProps {
  evento: any;
  onPublicar?: (e: any) => void;
  onEditar?: (e: any) => void;
  onEliminar?: (e: any) => void;
}

export default function TarjetaEvento({
  evento,
  onPublicar,
  onEditar,
  onEliminar,
}: TarjetaEventoProps) {
  const router = useRouter();
  const { mes, dia } = formatearFecha(evento.fecha_evento);
  const estadoClave = evento.estado_gestion?.toLowerCase() || "";
  const claseEstado = styles[estadoClave] || "";

  const esBorrador = evento.estado_gestion === "BORRADOR";
  const esEliminable =
    evento.estado_gestion === "BORRADOR" || evento.estado_gestion === "PUBLICADO";

  const accion = (fn?: (e: any) => void) => (e: React.MouseEvent) => {
    e.stopPropagation();
    fn?.(evento);
  };

  const manejarClickTarjeta = () => {
    router.push(`/organizador/${evento.id_evento}`);
  };

  const manejarTeclaTarjeta = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") manejarClickTarjeta();
  };

  const manejarEditar = onEditar
    ? accion(onEditar)
    : (e: React.MouseEvent) => {
        e.stopPropagation();
        router.push(`/organizador/${evento.id_evento}/editar`);
      };

  return (
    <div
      className={`${styles.tarjetaEvento} ${claseEstado}`}
      onClick={manejarClickTarjeta}
      onKeyDown={manejarTeclaTarjeta}
      role="link"
      tabIndex={0}
      style={{ cursor: "pointer" }}
    >
      <div className={styles.fecha}>
        <span className={styles.mes}>{mes}</span>
        <span className={styles.dia}>{dia}</span>
        <span className={styles.hora}>{evento.hora_evento || "—"}</span>
      </div>

      <div className={styles.cuerpo}>
        <div className={styles.info}>
          <h3>{evento.nombre_evento}</h3>
          <div className={styles.meta}>
            <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
              <MapPin size={16} strokeWidth={2} /> {evento.direccion_evento}
            </span>
          </div>
        </div>

        <BadgeEstado estado={evento.estado_gestion} />

        <div className={styles.acciones}>
          <button
            type="button"
            className={styles.accion}
            title="Editar evento"
            aria-label="Editar"
            onClick={manejarEditar}
          >
            <Pencil size={18} strokeWidth={2} />
          </button>
          <button
            type="button"
            className={`${styles.accion} ${styles.accionSuccess}`}
            title={
              esBorrador
                ? "Publicar evento"
                : "Sólo un evento en Borrador puede publicarse"
            }
            aria-label="Publicar"
            disabled={!esBorrador}
            onClick={accion(onPublicar)}
          >
            <Check size={18} strokeWidth={2} />
          </button>
          <button
            type="button"
            className={`${styles.accion} ${styles.accionDanger}`}
            title={
              esEliminable
                ? "Eliminar evento"
                : "Sólo un evento en Borrador o Publicado puede eliminarse"
            }
            aria-label="Eliminar"
            disabled={!esEliminable}
            onClick={accion(onEliminar)}
          >
            <Trash2 size={18} strokeWidth={2} />
          </button>
        </div>
      </div>
    </div>
  );
}
