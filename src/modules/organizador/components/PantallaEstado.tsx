"use client";

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
 * Pantallas de estado a pantalla completa para HU-06:
 * cargando / no autenticado / sin permiso / error.
 */
export default function PantallaEstado({
  tipo,
  mensaje,
  onReintentar,
  urlLogin = "/auth/admin/login",
}: PantallaEstadoProps) {
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
        <h2>Inicia sesión para continuar</h2>
        <p>Tu sesión no es válida o expiró. Debes iniciar sesión para ver tus eventos.</p>
        <Link href={urlLogin}>
          <Boton variante="primario">Ir a iniciar sesión</Boton>
        </Link>
      </div>
    );
  }

  if (tipo === "sin_permiso") {
    return (
      <div className={styles.pantallaEstado}>
        <h2>No tienes permisos de organizador</h2>
        <p>Esta sección es exclusiva para cuentas con rol organizador.</p>
      </div>
    );
  }

  return (
    <div className={styles.pantallaEstado}>
      <h2>No se pudo cargar la información</h2>
      <p>{mensaje || "Ocurrió un error inesperado."}</p>
      {onReintentar && (
        <Boton variante="secundario" onClick={onReintentar}>
          Reintentar
        </Boton>
      )}
    </div>
  );
}
