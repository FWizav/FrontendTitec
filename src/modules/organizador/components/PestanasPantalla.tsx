"use client";

import { useRouter } from "next/navigation";
import styles from "./PestanasPantalla.module.css";

interface PestanasPantallaProps {
  activa?: "listado" | "crear";
}

/**
 * Pestañas "01 · Listado / 02 · Crear-Editar / 03 · Eliminar" del mockup del equipo.
 */
export default function PestanasPantalla({ activa }: PestanasPantallaProps) {
  const router = useRouter();

  return (
    <div
      className={styles.pestanasPantalla}
      role="tablist"
      aria-label="Secciones de Mis eventos"
    >
      <button
        role="tab"
        aria-selected={activa === "listado"}
        className={`${styles.pestana} ${activa === "listado" ? styles.activa : ""}`}
        onClick={() => router.push("/organizador")}
      >
        01 · Listado
      </button>
      <button
        role="tab"
        aria-selected={activa === "crear"}
        className={`${styles.pestana} ${activa === "crear" ? styles.activa : ""}`}
        onClick={() => router.push("/organizador/nuevo")}
      >
        02 · Crear / Editar
      </button>
      <button
        role="tab"
        aria-selected={false}
        className={styles.pestana}
        title="Se elimina desde cada evento (Sprint 3 · HU-03)"
        disabled
      >
        03 · Eliminar
      </button>
    </div>
  );
}
