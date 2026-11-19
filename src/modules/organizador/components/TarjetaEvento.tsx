"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { MapPin, Eye, Check, Trash2, Edit3 } from "lucide-react";
import BadgeEstado from "./BadgeEstado";
import Boton from "./Boton";
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
  onEliminar,
}: TarjetaEventoProps) {
  const router = useRouter();
  const { mes, dia } = formatearFecha(evento.fecha_evento);
  const estadoClave = evento.estado_gestion?.toLowerCase() || "";
  const claseEstado = styles[estadoClave] || "";

  const esBorrador = evento.estado_gestion === "BORRADOR";
  const esEditable =
    evento.estado_gestion === "BORRADOR" || evento.estado_gestion === "PUBLICADO";
  const esEliminable =
    evento.estado_gestion === "BORRADOR" || evento.estado_gestion === "PUBLICADO";

  const accion = (fn?: (e: any) => void) => (e: React.MouseEvent) => {
    e.stopPropagation();
    fn?.(evento);
  };

  const irADetalle = (e: React.MouseEvent) => {
    e.stopPropagation();
    router.push(`/organizador/${evento.id_evento}`);
  };

  return (
    <div
      className={`${styles.tarjetaEvento} ${claseEstado}`}
      tabIndex={0}
      role="article"
      aria-label={`Evento ${evento.nombre_evento}`}
    >
      {/* Encabezado visible en móvil */}
      <div className={styles.cabeceraMobile}>
        <div className={styles.fecha}>
          <span className={styles.mes}>{mes}</span>
          <span className={styles.dia}>{dia}</span>
          <span className={styles.hora}>{evento.hora_evento || "—"}</span>
        </div>
        <div className={styles.badgeContenedor}>
          <BadgeEstado estado={evento.estado_gestion} />
        </div>
      </div>

      {/* Información del evento */}
      <div className={styles.cuerpo}>
        <h3 className={styles.titulo}>{evento.nombre_evento}</h3>
        <div className={styles.meta}>
          <span className={styles.metaItem}>
            <MapPin size={15} strokeWidth={2} />
            <span>{evento.direccion_evento}</span>
          </span>
          {evento.categoria && (
            <span className={styles.metaItem}>
              <span>· {evento.categoria}</span>
            </span>
          )}
          {evento.tipo_entrada && (
            <span className={styles.metaItem}>
              <span>
                · {evento.tipo_entrada === "PAGADA" ? `$${evento.precio ?? 0}` : "Gratis"}
              </span>
            </span>
          )}
        </div>
      </div>

      {/* Botones de acción claros */}
      <div className={styles.acciones}>
        <Boton
          variante="secundario"
          className={styles.btnAccion}
          title="Ver detalle del evento"
          onClick={irADetalle}
        >
          <Eye size={15} strokeWidth={2} style={{ marginRight: 4 }} />
          Ver detalle
        </Boton>

        <Boton
          variante="secundario"
          className={styles.btnAccion}
          disabled={!esEditable}
          title={
            esEditable
              ? "Editar evento"
              : "Sólo eventos en Borrador o Publicado pueden editarse"
          }
          onClick={(e) => {
            e.stopPropagation();
            router.push(`/organizador/${evento.id_evento}/editar`);
          }}
        >
          <Edit3 size={15} strokeWidth={2} style={{ marginRight: 4 }} />
          Editar
        </Boton>

        <Boton
          variante="primario"
          className={styles.btnAccion}
          disabled={!esBorrador}
          title={
            esBorrador
              ? "Publicar evento en el catálogo"
              : "Sólo eventos en Borrador pueden publicarse"
          }
          onClick={accion(onPublicar)}
        >
          <Check size={15} strokeWidth={2} style={{ marginRight: 4 }} />
          Publicar
        </Boton>

        <Boton
          variante="peligro"
          className={styles.btnAccion}
          disabled={!esEliminable}
          title={
            esEliminable
              ? "Eliminar evento"
              : "Sólo eventos en Borrador o Publicado pueden eliminarse"
          }
          onClick={accion(onEliminar)}
        >
          <Trash2 size={15} strokeWidth={2} style={{ marginRight: 4 }} />
          Eliminar
        </Boton>
      </div>
    </div>
  );
}
