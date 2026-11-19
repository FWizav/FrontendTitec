"use client";

// ============================================================================
// modules/promociones/components/PromocionesPlaceholder.tsx
// ----------------------------------------------------------------------------
// Grupo 9 — Promociones: panel de creación y gestión de códigos de descuento.
//
// - Sesión: la de Auth (cookie jwt). Promociones la valida con Auth; solo los roles
//   organizador y staff pueden gestionar. Sin sesión se ofrece ir a /auth y volver.
// - Datos: todo por el API Gateway (/api/promociones/*), ver ../api.ts.
// - Los canjes llegan desde Pagos por el broker (pago.completado) y el panel se
//   refresca solo cada 5 s, sin recargar la página.
// ============================================================================

import { useCallback, useEffect, useMemo, useState } from "react";
import "../promociones.css";
import {
  actualizarPromocion,
  crearPromocion,
  fechaCorta,
  listarPromociones,
  obtenerSesion,
  Promocion,
  PromocionesApiError,
  urlLogin,
  UsuarioSesion,
} from "../api";
import { buscarEventos } from "@/modules/catalogo/api";
import { obtenerMisEventos } from "@/modules/organizador/api";

const REFRESCO_MS = 5000;

type EventoOpcion = { id: string; nombre: string };

function hoyISO() {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}

export default function PromocionesPlaceholder() {
  const [estadoSesion, setEstadoSesion] = useState<"cargando" | "sin_sesion" | "ok">("cargando");
  const [usuario, setUsuario] = useState<UsuarioSesion | null>(null);
  const [promociones, setPromociones] = useState<Promocion[]>([]);
  const [eventos, setEventos] = useState<EventoOpcion[]>([]);
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sinPermiso, setSinPermiso] = useState(false);
  const [aviso, setAviso] = useState<string | null>(null);
  const [modalAbierto, setModalAbierto] = useState(false);
  const [editando, setEditando] = useState<Promocion | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [errorForm, setErrorForm] = useState<string | null>(null);

  const nombreEvento = useCallback(
    (id: string) => eventos.find((e) => e.id === id)?.nombre || "Evento",
    [eventos],
  );

  const manejarError = useCallback((e: unknown, setter: (m: string) => void) => {
    if (e instanceof PromocionesApiError && e.status === 401) {
      setEstadoSesion("sin_sesion");
      return;
    }
    if (e instanceof PromocionesApiError && e.status === 403) {
      setSinPermiso(true);
      return;
    }
    setter(e instanceof Error ? e.message : "Ocurrió un error inesperado.");
  }, []);

  const cargar = useCallback(
    async (silencioso = false) => {
      if (!silencioso) setCargando(true);
      try {
        setPromociones(await listarPromociones());
        setError(null);
      } catch (e) {
        manejarError(e, setError);
      } finally {
        setCargando(false);
      }
    },
    [manejarError],
  );

  // 1) Sesión con Auth (a través de Promociones)
  useEffect(() => {
    obtenerSesion()
      .then((u) => {
        setUsuario(u);
        setEstadoSesion(u ? "ok" : "sin_sesion");
      })
      .catch((e) => {
        setEstadoSesion("ok");
        setError(e instanceof Error ? e.message : "No fue posible verificar tu sesión.");
      });
    // Eventos para elegir: los del organizador (Panel Organizador) y los publicados en Catálogo.
    // Si alguno falla se usan los que respondan; si ninguno, se pide el identificador a mano.
    Promise.allSettled([obtenerMisEventos(), buscarEventos()]).then(([mios, catalogo]) => {
      const mapa = new Map<string, string>();
      const agregar = (lista: unknown) => {
        if (!Array.isArray(lista)) return;
        for (const e of lista as Array<{ id_evento?: string; nombre_evento?: string }>) {
          if (e?.id_evento && !mapa.has(e.id_evento)) mapa.set(e.id_evento, e.nombre_evento || e.id_evento);
        }
      };
      if (mios.status === "fulfilled") agregar(mios.value);
      if (catalogo.status === "fulfilled") agregar(catalogo.value);
      setEventos([...mapa].map(([id, nombre]) => ({ id, nombre })));
    });
  }, []);

  // 2) Listado + refresco automático (canjes informados por Pagos vía broker)
  useEffect(() => {
    if (estadoSesion !== "ok" || sinPermiso) return;
    cargar();
    const t = setInterval(() => cargar(true), REFRESCO_MS);
    return () => clearInterval(t);
  }, [estadoSesion, sinPermiso, cargar]);

  const toggleActiva = async (p: Promocion) => {
    try {
      const actualizada = await actualizarPromocion(p._id, { activo: !p.activo });
      setPromociones((ps) => ps.map((x) => (x._id === p._id ? actualizada : x)));
      setAviso(`Promoción ${actualizada.nombre_codigo} ${actualizada.activo ? "activada" : "desactivada"}.`);
    } catch (e) {
      manejarError(e, setError);
    }
  };

  const guardar = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const fechaLimite = String(f.get("fechaLimite") || "");
    // El input tiene "min", pero la fecha se puede escribir a mano: se valida también aquí
    if (!fechaLimite || fechaLimite < hoyISO()) {
      setErrorForm("La fecha límite no puede ser una fecha pasada.");
      return;
    }
    const fechaFin = new Date(`${fechaLimite}T23:59:59`).toISOString();
    setGuardando(true);
    setErrorForm(null);
    try {
      if (editando) {
        const cambios: Partial<Promocion> = { fecha_fin: fechaFin, cantidad_codigos: Number(f.get("stock")) };
        if (editando.usos_actuales === 0) cambios.porcentaje_descuento = Number(f.get("valor"));
        const p = await actualizarPromocion(editando._id, cambios);
        setPromociones((ps) => ps.map((x) => (x._id === p._id ? p : x)));
        setAviso(`Promoción ${p.nombre_codigo} actualizada.`);
      } else {
        const idEvento = String(f.get("evento") || "").trim();
        const p = await crearPromocion({
          nombre_codigo: String(f.get("codigo")).trim().toUpperCase(),
          id_evento: idEvento,
          porcentaje_descuento: Number(f.get("valor")),
          fecha_inicio: new Date().toISOString(),
          fecha_fin: fechaFin,
          cantidad_codigos: Number(f.get("stock")),
          minimo_entradas: Number(f.get("minimo")) || 1,
          max_usos_por_cuenta: Number(f.get("maxUsos")) || 1,
        });
        setPromociones((ps) => [p, ...ps]);
        setAviso(`Promoción ${p.nombre_codigo} creada.`);
      }
      setModalAbierto(false);
      setEditando(null);
    } catch (err) {
      manejarError(err, setErrorForm);
    } finally {
      setGuardando(false);
    }
  };

  const ordenadas = useMemo(() => promociones, [promociones]);

  // ------------------------------------------------------------------ vistas sin acceso
  if (estadoSesion === "cargando") {
    return <div className="modulo-promociones p-6 text-ticket-secondary">Cargando…</div>;
  }
  if (estadoSesion === "sin_sesion") {
    return (
      <div className="modulo-promociones max-w-[480px] mx-auto mt-10 bg-white border border-ticket-border rounded-xl p-6 text-center">
        <h2 className="text-xl font-bold mb-2">Gestión de Promociones</h2>
        <p className="text-ticket-secondary mb-5">Inicia sesión con tu cuenta de Ticket-U para gestionar las promociones de tus eventos.</p>
        <a href={urlLogin()} className="inline-block bg-ticket-primary hover:bg-ticket-hover text-white font-semibold px-5 py-2.5 rounded-lg no-underline">
          Iniciar sesión
        </a>
      </div>
    );
  }
  if (sinPermiso) {
    return (
      <div className="modulo-promociones max-w-[520px] mx-auto mt-10 bg-ticket-peligro-bg border border-ticket-peligro/30 rounded-xl p-6 text-center">
        <h2 className="text-xl font-bold mb-2">Gestión de Promociones</h2>
        <p className="text-ticket-peligro">Tu usuario no tiene permisos para gestionar promociones. Esta sección es para organizadores.</p>
      </div>
    );
  }

  // ------------------------------------------------------------------ panel
  const fechaDefecto = editando ? new Date(editando.fecha_fin).toISOString().slice(0, 10) : "";

  return (
    <div className="modulo-promociones max-w-[1100px] mx-auto">
      <div className="bg-ticket-banner border border-ticket-border rounded-xl p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <p className="text-xs font-bold text-ticket-secondary uppercase tracking-wider m-0 mb-1">Panel de organizador</p>
          <h1 className="text-2xl font-bold">Gestión de Promociones</h1>
          <p className="text-xs text-ticket-secondary m-0 mt-1">
            Los canjes se actualizan solos cuando se confirma cada pago.
            {usuario ? ` Sesión: ${usuario.rol_usuario}.` : ""}
          </p>
        </div>
        <button
          onClick={() => { setEditando(null); setErrorForm(null); setModalAbierto(true); }}
          className="bg-ticket-primary hover:bg-ticket-hover text-white border-0 px-5 py-2.5 rounded-lg text-sm font-semibold"
        >
          + Nueva Promoción
        </button>
      </div>

      {aviso && (
        <div className="mb-4 p-3 bg-ticket-exito-bg border border-ticket-exito/30 rounded-lg text-ticket-exito text-sm flex justify-between">
          <span>{aviso}</span>
          <button onClick={() => setAviso(null)} className="bg-transparent border-0 text-ticket-exito" aria-label="Cerrar aviso">✕</button>
        </div>
      )}
      {error && (
        <div className="mb-4 p-3 bg-ticket-peligro-bg border border-ticket-peligro/30 rounded-lg text-ticket-peligro text-sm flex justify-between gap-3">
          <span>{error}</span>
          <button onClick={() => cargar()} className="bg-transparent border-0 text-ticket-peligro font-semibold underline">Reintentar</button>
        </div>
      )}

      {cargando && promociones.length === 0 && <p className="text-center text-ticket-secondary py-8">Cargando promociones…</p>}
      {!cargando && !error && promociones.length === 0 && (
        <p className="text-center text-ticket-secondary py-8">Aún no hay promociones. Crea la primera con “Nueva Promoción”.</p>
      )}

      <div className="flex flex-col gap-4">
        {ordenadas.map((p) => {
          const total = p.cantidad_codigos + p.usos_actuales;
          const pct = total > 0 ? Math.round((p.usos_actuales / total) * 100) : 0;
          return (
            <article
              key={p._id}
              className={`bg-white border border-ticket-border rounded-xl p-5 flex flex-col md:flex-row gap-5 ${p.activo ? "" : "opacity-70"}`}
              style={{ boxShadow: "0 1px 3px rgba(0,0,0,0.08)" }}
            >
              <div className="md:w-[160px] shrink-0 flex flex-col items-center justify-center bg-ticket-banner rounded-lg p-4">
                <span className="text-3xl font-bold text-ticket-primary">{p.porcentaje_descuento}%</span>
                <span className="text-xs text-ticket-secondary">de descuento</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <h3 className="text-lg font-bold">{p.nombre_codigo}</h3>
                  <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${p.activo ? "bg-ticket-exito-bg text-ticket-exito" : "bg-ticket-inactivo-bg text-ticket-secondary"}`}>
                    {p.activo ? "Activa" : "Inactiva"}
                  </span>
                </div>
                <p className="text-sm text-ticket-secondary m-0">
                  {nombreEvento(p.id_evento)} · válida hasta {fechaCorta(p.fecha_fin)} · mínimo {p.minimo_entradas} entrada(s) · {p.max_usos_por_cuenta} uso(s) por cuenta
                </p>
                <div className="mt-3">
                  <div className="flex justify-between text-xs text-ticket-secondary mb-1">
                    <span>Canjeados</span>
                    <span className="font-semibold text-ticket-primary">{p.usos_actuales} de {total}</span>
                  </div>
                  <div className="h-2 bg-ticket-inactivo-bg rounded-full overflow-hidden">
                    <div className="h-full bg-ticket-primary" style={{ width: `${pct}%` }} />
                  </div>
                </div>
              </div>
              <div className="flex md:flex-col gap-2 justify-end">
                <button
                  onClick={() => { setEditando(p); setErrorForm(null); setModalAbierto(true); }}
                  className="bg-white border border-ticket-border text-ticket-primary px-4 py-2 rounded-lg text-sm font-semibold"
                >
                  Editar
                </button>
                <button
                  onClick={() => toggleActiva(p)}
                  className={`border-0 px-4 py-2 rounded-lg text-sm font-semibold ${p.activo ? "bg-ticket-peligro-bg text-ticket-peligro" : "bg-ticket-exito-bg text-ticket-exito"}`}
                >
                  {p.activo ? "Desactivar" : "Activar"}
                </button>
              </div>
            </article>
          );
        })}
      </div>

      {modalAbierto && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <form onSubmit={guardar} className="bg-white rounded-xl w-full max-w-[520px] overflow-hidden" style={{ boxShadow: "0 8px 24px rgba(0,0,0,0.15)" }}>
            <div className="flex items-center justify-between p-5 border-b border-ticket-border">
              <h2 className="text-lg font-bold">{editando ? `Editar ${editando.nombre_codigo}` : "Crear Nueva Promoción"}</h2>
              <button type="button" onClick={() => setModalAbierto(false)} className="bg-transparent border-0 text-ticket-secondary text-lg" aria-label="Cerrar">✕</button>
            </div>

            <div className="p-5 flex flex-col gap-4 max-h-[70vh] overflow-y-auto">
              {!editando && (
                <label className="flex flex-col gap-1.5 text-sm font-semibold text-ticket-primary">
                  Evento
                  {eventos.length > 0 ? (
                    <select name="evento" required defaultValue="" className="h-10 px-3 rounded-lg border border-ticket-border bg-white">
                      <option value="">-- Elige un evento --</option>
                      {eventos.map((ev) => <option key={ev.id} value={ev.id}>{ev.nombre}</option>)}
                    </select>
                  ) : (
                    <>
                      <input name="evento" required placeholder="Identificador del evento" className="h-10 px-3 rounded-lg border border-ticket-border" />
                      <span className="text-xs font-normal text-ticket-secondary">No se pudo cargar el catálogo de eventos.</span>
                    </>
                  )}
                </label>
              )}

              <div className="flex gap-4">
                {!editando && (
                  <label className="flex-1 flex flex-col gap-1.5 text-sm font-semibold text-ticket-primary">
                    Código
                    <input name="codigo" required pattern="[A-Za-z0-9_\-]{3,30}" title="3 a 30 letras, números, - o _" placeholder="Ej. PROMO20" className="h-10 px-3 rounded-lg border border-ticket-border uppercase" />
                  </label>
                )}
                <label className="flex-1 flex flex-col gap-1.5 text-sm font-semibold text-ticket-primary">
                  Fecha límite
                  <input type="date" name="fechaLimite" required min={hoyISO()} defaultValue={fechaDefecto} className="h-10 px-3 rounded-lg border border-ticket-border" />
                </label>
              </div>

              <div className="flex gap-4">
                <label className="flex-1 flex flex-col gap-1.5 text-sm font-semibold text-ticket-primary">
                  Descuento (%)
                  <input
                    type="number" name="valor" required min={1} max={100}
                    defaultValue={editando?.porcentaje_descuento}
                    disabled={Boolean(editando && editando.usos_actuales > 0)}
                    className="h-10 px-3 rounded-lg border border-ticket-border disabled:bg-ticket-inactivo-bg"
                  />
                  {editando && editando.usos_actuales > 0 && (
                    <span className="text-xs font-normal text-ticket-secondary">No se puede cambiar: el código ya fue usado.</span>
                  )}
                </label>
                <label className="flex-1 flex flex-col gap-1.5 text-sm font-semibold text-ticket-primary">
                  Cupones disponibles
                  <input type="number" name="stock" required min={0} defaultValue={editando?.cantidad_codigos} className="h-10 px-3 rounded-lg border border-ticket-border" />
                </label>
              </div>

              {!editando && (
                <div className="flex gap-4 p-4 bg-ticket-banner rounded-lg">
                  <label className="flex-1 flex flex-col gap-1.5 text-sm font-semibold text-ticket-primary">
                    Mínimo de entradas
                    <input type="number" name="minimo" min={1} defaultValue={1} className="h-9 px-3 rounded-md border border-ticket-border" />
                  </label>
                  <label className="flex-1 flex flex-col gap-1.5 text-sm font-semibold text-ticket-primary">
                    Usos por persona
                    <input type="number" name="maxUsos" min={1} defaultValue={1} className="h-9 px-3 rounded-md border border-ticket-border" />
                  </label>
                </div>
              )}

              {errorForm && (
                <div className="p-3 bg-ticket-peligro-bg border border-ticket-peligro/30 rounded-lg text-ticket-peligro text-sm">{errorForm}</div>
              )}
            </div>

            <div className="p-5 border-t border-ticket-border flex justify-end gap-3 bg-ticket-card">
              <button type="button" onClick={() => setModalAbierto(false)} className="bg-transparent border-0 px-4 py-2 text-sm font-semibold text-ticket-secondary">
                Cancelar
              </button>
              <button type="submit" disabled={guardando} className="bg-ticket-primary hover:bg-ticket-hover disabled:opacity-60 text-white border-0 px-5 py-2 rounded-lg text-sm font-semibold">
                {guardando ? "Guardando…" : editando ? "Guardar cambios" : "Guardar Promoción"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
}
