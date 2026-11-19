"use client";

import styles from "./BadgeEstado.module.css";

const ETIQUETAS: Record<string, string> = {
  BORRADOR: "Borrador",
  PUBLICADO: "Publicado",
  FINALIZADO: "Finalizado",
  CANCELADO: "Cancelado",
};

interface BadgeEstadoProps {
  estado?: string;
}

export default function BadgeEstado({ estado = "" }: BadgeEstadoProps) {
  const clave = estado.toLowerCase();
  const claseEstado = styles[clave] || styles.desconocido;

  return (
    <span className={`${styles.badgeEstado} ${claseEstado}`}>
      {ETIQUETAS[estado] || estado || "Desconocido"}
    </span>
  );
}
