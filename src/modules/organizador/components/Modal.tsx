"use client";

import { useEffect, useRef, type ReactNode } from "react";
import styles from "./Modal.module.css";

interface ModalProps {
  titulo: string;
  children: ReactNode;
  acciones: ReactNode;
  onCerrar: () => void;
}

export default function Modal({
  titulo,
  children,
  acciones,
  onCerrar,
}: ModalProps) {
  const dialogoRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    dialogoRef.current?.focus();
    const alPresionar = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCerrar();
    };
    document.addEventListener("keydown", alPresionar);
    return () => document.removeEventListener("keydown", alPresionar);
  }, [onCerrar]);

  return (
    <div className={styles.overlay} onClick={onCerrar}>
      <div
        className={styles.modal}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-titulo"
        tabIndex={-1}
        ref={dialogoRef}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="modal-titulo" className={styles.titulo}>
          {titulo}
        </h2>
        <div className={styles.cuerpo}>{children}</div>
        <div className={styles.acciones}>{acciones}</div>
      </div>
    </div>
  );
}
