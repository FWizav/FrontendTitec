"use client";

/**
 * HU-06 — Verificación de autorización del organizador.
 *
 * Según docs/CONTRATO_PANEL_AUTH.md, el Frontend nunca valida el JWT localmente:
 * solo intenta la operación protegida y reacciona al resultado.
 * Por eso, aquí "verificar sesión" = intentar cargar "mis eventos" (GET /api/organizador/v1/panel/eventos/mios)
 * y reaccionar según la respuesta:
 *   200        -> hay sesión válida y rol organizador; guardamos eventos y mostramos el panel
 *   401        -> sesión no válida / expirada -> redirigir a /auth/admin/login de inmediato
 *   403        -> autenticado pero sin rol organizador -> "Acceso restringido a organizadores" sin datos
 *   otro/red   -> error genérico (Fail-Secure)
 */
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import { obtenerMisEventos, ApiError } from "../api";
import PantallaEstado from "./PantallaEstado";
import BarraContexto from "./BarraContexto";
import styles from "../styles/organizador.module.css";

export const ESTADO = {
  CARGANDO: "cargando",
  AUTORIZADO: "autorizado",
  NO_AUTENTICADO: "no_autenticado",
  SIN_PERMISO: "sin_permiso",
  ERROR: "error",
} as const;

type EstadoSesion = (typeof ESTADO)[keyof typeof ESTADO];

interface SesionContextType {
  estado: EstadoSesion;
  ESTADO: typeof ESTADO;
  usuario: any;
  eventos: any[];
  mensajeError: string;
  reintentar: () => void;
  actualizarEventoLocal: (evento: any) => void;
  quitarEventoLocal: (idEvento: string) => void;
}

const SesionContext = createContext<SesionContextType | null>(null);

export function SesionProvider({ children }: { children: ReactNode }) {
  const [estado, setEstado] = useState<EstadoSesion>(ESTADO.CARGANDO);
  const [usuario, setUsuario] = useState<any>(null);
  const [eventos, setEventos] = useState<any[]>([]);
  const [mensajeError, setMensajeError] = useState("");

  const verificarSesion = useCallback(async (signal?: AbortSignal) => {
    setEstado(ESTADO.CARGANDO);
    try {
      const data = await obtenerMisEventos(signal);
      setUsuario(data?.usuario ?? null);
      setEventos(Array.isArray(data?.eventos) ? data.eventos : []);
      setEstado(ESTADO.AUTORIZADO);
    } catch (err: any) {
      if (err?.name === "AbortError") return;
      if (err instanceof ApiError && err.status === 401) {
        if (typeof window !== "undefined") {
          window.location.assign("/auth/admin/login");
        }
        setEstado(ESTADO.NO_AUTENTICADO);
      } else if (err instanceof ApiError && err.status === 403) {
        setEstado(ESTADO.SIN_PERMISO);
      } else {
        setMensajeError(err?.message || "Ocurrió un error inesperado al conectar con el servidor.");
        setEstado(ESTADO.ERROR);
      }
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    verificarSesion(controller.signal);
    return () => controller.abort();
  }, [verificarSesion]);

  const actualizarEventoLocal = useCallback((eventoActualizado: any) => {
    setEventos((prev) => {
      const existe = prev.some(
        (e) => e.id_evento === eventoActualizado.id_evento
      );
      if (existe) {
        return prev.map((e) =>
          e.id_evento === eventoActualizado.id_evento ? eventoActualizado : e
        );
      }
      return [eventoActualizado, ...prev];
    });
  }, []);

  const quitarEventoLocal = useCallback((idEvento: string) => {
    setEventos((prev) => prev.filter((e) => e.id_evento !== idEvento));
  }, []);

  const value: SesionContextType = {
    estado,
    ESTADO,
    usuario,
    eventos,
    mensajeError,
    reintentar: () => verificarSesion(),
    actualizarEventoLocal,
    quitarEventoLocal,
  };

  // Si no está autorizado, NO mostrar el panel ni BarraContexto ni datos
  if (estado !== ESTADO.AUTORIZADO) {
    return (
      <div className={styles.panelOrganizador}>
        {estado === ESTADO.CARGANDO && <PantallaEstado tipo="cargando" />}
        {estado === ESTADO.NO_AUTENTICADO && (
          <PantallaEstado
            tipo="no_autenticado"
            urlLogin="/auth/admin/login"
          />
        )}
        {estado === ESTADO.SIN_PERMISO && (
          <PantallaEstado tipo="sin_permiso" />
        )}
        {estado === ESTADO.ERROR && (
          <PantallaEstado
            tipo="error"
            mensaje={mensajeError}
            onReintentar={() => verificarSesion()}
          />
        )}
      </div>
    );
  }

  return (
    <SesionContext.Provider value={value}>
      <div className={styles.panelOrganizador}>
        <BarraContexto />
        {children}
      </div>
    </SesionContext.Provider>
  );
}

export function useSesion() {
  const ctx = useContext(SesionContext);
  if (!ctx) throw new Error("useSesion debe usarse dentro de <SesionProvider>");
  return ctx;
}
