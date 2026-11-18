"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";
import styles from "./Boton.module.css";

interface BotonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variante?: "primario" | "secundario" | "peligro";
  children: ReactNode;
}

export default function Boton({
  variante = "primario",
  type = "button",
  children,
  className = "",
  ...props
}: BotonProps) {
  const claseVariante = styles[variante] || styles.primario;
  return (
    <button
      type={type}
      className={`${styles.boton} ${claseVariante} ${className}`.trim()}
      {...props}
    >
      {children}
    </button>
  );
}
