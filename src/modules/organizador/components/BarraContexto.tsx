"use client";

import styles from "./BarraContexto.module.css";

/** Barra "MICROSERVICIO · PANEL ORGANIZADOR" debajo del header, según el mockup del equipo. */
export default function BarraContexto() {
  return (
    <div className={styles.barraContexto}>
      <div className={styles.inner}>
        <span>MICROSERVICIO</span>
        <span className={styles.separador}>·</span>
        <span className={styles.destacado}>PANEL ORGANIZADOR</span>
      </div>
    </div>
  );
}
