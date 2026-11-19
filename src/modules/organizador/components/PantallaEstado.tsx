"use client";

import { useEffect } from "react";
import Link from "next/link";
import Boton from "./Boton";
import styles from "./PantallaEstado.module.css";

interface PantallaEstadoProps {
  tipo: "cargando" | "no_autenticado" | "sin_permiso" | "error";
  mensaje?: string;
  onReintentar?: () => void;
  urlLogin?: string;
}

/**
 * Pantallas de estado para HU-06:
 * cargando / no autenticado (401) / sin permiso (403) / error.
 */
export default function PantallaEstado({
  tipo,
  mensaje,
  onReintentar,
  urlLogin = "/auth/admin/login",
}: PantallaEstadoProps) {
  useEffect(() => {
    if (tipo === "no_autenticado" && typeof window !== "undefined") {
      window.location.assign(urlLogin);
    }
  }, [tipo, urlLogin]);

  if (tipo === "cargando") {
    return (
      <div className={styles.pantallaEstado}>
        <div className={styles.spinner} aria-hidden="true" />
        <p>Verificando tu sesión…</p>
      </div>
    );
  }

  if (tipo === "no_autenticado") {
    return (
      <div className={styles.pantallaEstado}>
        <div className={styles.spinner} aria-hidden="true" />
        <h2>Redirigiendo al inicio de sesión…</h2>
        <p>Debes iniciar sesión con una cuenta de organizador para acceder a este panel.</p>
        <Link href={urlLogin} className={styles.enlaceLogin}>
          <Boton variante="primario">Ir al login manualmente</Boton>
        </Link>
      </div>
    );
  }

  if (tipo === "sin_permiso") {
    return (
      <div className={styles.pantallaEstado}>
        <h2>Acceso restringido a organizadores</h2>
        <p>
          Esta sección es exclusiva para usuarios con rol de organizador.
          Tu cuenta no cuenta con los permisos necesarios para acceder a este panel.
        </p>
        <Link href={urlLogin}>
          <Boton variante="primario">Iniciar sesión con otra cuenta</Boton>
        </Link>
      </div>
    );
  }

  return (
    <div className={styles.pantallaEstado}>
      <h2>No se pudo cargar la información</h2>
      <p>{mensaje || "Ocurrió un error inesperado al conectar con el servicio."}</p>
      {onReintentar && (
        <Boton variante="secundario" onClick={onReintentar}>
          Reintentar
        </Boton>
      )}
    </div>
  );
}
