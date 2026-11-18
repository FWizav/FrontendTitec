"use client";

import React, { type ReactNode } from "react";
import { AlertCircle } from "lucide-react";
import styles from "./CampoFormulario.module.css";

interface CampoFormularioProps {
  etiqueta: string;
  nombre: string;
  error?: string;
  ayuda?: string;
  as?: "input" | "textarea" | "select";
  children?: ReactNode;
  [key: string]: any;
}

export default function CampoFormulario({
  etiqueta,
  nombre,
  error,
  ayuda,
  as = "input",
  children,
  ...props
}: CampoFormularioProps) {
  const Componente = as;
  const claseCampo = `${
    as === "textarea" ? styles.textarea : as === "select" ? styles.select : styles.input
  } ${error ? styles.conError : ""}`.trim();

  return (
    <div className={styles.campoFormulario}>
      <label htmlFor={nombre} className={styles.label}>
        {etiqueta}
      </label>
      {as === "select" ? (
        <select
          id={nombre}
          name={nombre}
          className={claseCampo}
          aria-invalid={!!error}
          aria-describedby={error ? `${nombre}-error` : undefined}
          {...props}
        >
          {children}
        </select>
      ) : (
        <Componente
          id={nombre}
          name={nombre}
          className={claseCampo}
          aria-invalid={!!error}
          aria-describedby={error ? `${nombre}-error` : undefined}
          {...props}
        />
      )}
      {ayuda && !error && <p className={styles.ayuda}>{ayuda}</p>}
      {error && (
        <p className={styles.error} id={`${nombre}-error`}>
          <AlertCircle size={14} strokeWidth={2} aria-hidden="true" style={{ display: "inline-block", verticalAlign: "middle", marginRight: 4 }} />
          <span>{error}</span>
        </p>
      )}
    </div>
  );
}
