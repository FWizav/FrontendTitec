"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { CheckCircle2, ArrowLeft, Check, Trash2, Edit3 } from "lucide-react";
import { eliminarEvento, obtenerEvento, publicarEvento, ApiError } from "../api";
import { useSesion } from "./SesionContext";
import Boton from "./Boton";
import BadgeEstado from "./BadgeEstado";
import Modal from "./Modal";
import styles from "./EventoDetallePage.module.css";

export default function EventoDetallePage() {
  const params = useParams();
  const idEvento = params?.idEvento as string;
  const router = useRouter();
  const searchParams = useSearchParams();
  const { actualizarEventoLocal, quitarEventoLocal } = useSesion();

  const [evento, setEvento] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<{ type: string; msg: string } | null>(null);
  const [aviso, setAviso] = useState<string>("");

  const [modalPublicar, setModalPublicar] = useState(false);
  const [publicando, setPublicando] = useState(false);
  const [modalEliminar, setModalEliminar] = useState(false);
  const [eliminando, setEliminando] = useState(false);
  const [errorModal, setErrorModal] = useState("");

  useEffect(() => {
    const avisoParam = searchParams.get("aviso");
    if (avisoParam) setAviso(avisoParam);
  }, [searchParams]);

  useEffect(() => {
    const abortCtrl = new AbortController();
    const fetchDetalle = async () => {
      try {
        setLoading(true);
        if (!idEvento) return;
        const data = await obtenerEvento(idEvento, abortCtrl.signal);
        setEvento(data);
      } catch (err: any) {
        if (err.name === "AbortError") return;
        if (err instanceof ApiError) {
          if (err.codigo === "EVENT_NOT_OWNED" || err.status === 403) {
            setError({ type: "403", msg: "Este evento no te pertenece." });
          } else if (err.status === 404) {
            setError({ type: "404", msg: "Evento no encontrado." });
          } else {
            setError({ type: "generic", msg: err.message });
          }
        } else {
          setError({ type: "generic", msg: "Error al cargar el evento." });
        }
      } finally {
        setLoading(false);
      }
    };
    fetchDetalle();
    return () => abortCtrl.abort();
  }, [idEvento]);

  async function confirmarPublicar() {
    if (!evento) return;
    setPublicando(true);
    setErrorModal("");
    try {
      const publicado = await publicarEvento(evento.id_evento);
      setEvento((prev: any) => ({ ...prev, ...publicado }));
      actualizarEventoLocal({ ...evento, ...publicado });
      setAviso(
        `Evento "${publicado.nombre_evento}" publicado exitosamente. Ya es visible en el catálogo público.`
      );
      setModalPublicar(false);
    } catch (err: any) {
      setErrorModal(err.message || "No se pudo publicar el evento.");
    } finally {
      setPublicando(false);
    }
  }

  async function confirmarEliminar() {
    if (!evento) return;
    setEliminando(true);
    setErrorModal("");
    try {
      const res = await eliminarEvento(evento.id_evento);
      if (res?.resultado === "CANCELADO") {
        setEvento((prev: any) => ({ ...prev, ...res.evento }));
        actualizarEventoLocal(res.evento);
        setAviso(
          `El evento "${evento.nombre_evento}" tiene entradas vendidas, así que se canceló en vez de eliminarse.`
        );
        setModalEliminar(false);
      } else {
        quitarEventoLocal(evento.id_evento);
        router.push(
          `/organizador?aviso=${encodeURIComponent(
            `Evento "${evento.nombre_evento}" eliminado.`
          )}`
        );
      }
    } catch (err: any) {
      if (err?.codigo === "ENTRADAS_UNAVAILABLE" || err?.status === 503) {
        setErrorModal(
          "No se pudo consultar el stock. El evento no se eliminó; intenta más tarde."
        );
      } else if (err?.codigo === "EVENT_NOT_OWNED" || err?.status === 403) {
        setErrorModal("No tienes permiso sobre este evento.");
      } else if (err?.status === 401) {
        setErrorModal("Tu sesión no es válida o expiró.");
      } else {
        setErrorModal(err?.message || "No se pudo eliminar el evento.");
      }
    } finally {
      setEliminando(false);
    }
  }

  if (loading) {
    return (
      <div className={styles.mensajeEstado}>
        <p>Cargando información del evento...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.mensajeEstado}>
        <h2>
          Error {error.type === "403" ? "403" : error.type === "404" ? "404" : ""}
        </h2>
        <div className={styles.errorTexto}>{error.msg}</div>
        <Boton variante="primario" onClick={() => router.push("/organizador")}>
          Volver a Mis eventos
        </Boton>
      </div>
    );
  }

  if (!evento) return null;

  const esBorrador = evento.estado_gestion === "BORRADOR";
  const esEditable =
    evento.estado_gestion === "BORRADOR" || evento.estado_gestion === "PUBLICADO";
  const esEliminable =
    evento.estado_gestion === "BORRADOR" || evento.estado_gestion === "PUBLICADO";

  return (
    <div className={styles.detallePage}>
      {aviso && (
        <div role="status" className={styles.avisoExito}>
          <CheckCircle2 size={18} strokeWidth={2} />
          <span>{aviso}</span>
        </div>
      )}

      <div className={styles.topBar}>
        <div className={styles.tituloGrupo}>
          <Boton
            variante="secundario"
            onClick={() => router.push("/organizador")}
          >
            <ArrowLeft size={16} strokeWidth={2} style={{ marginRight: 4 }} />
            Volver
          </Boton>
          <h2>{evento.nombre_evento}</h2>
          <BadgeEstado estado={evento.estado_gestion} />
        </div>
        <div className={styles.botonera}>
          <Boton
            variante="secundario"
            disabled={!esEditable}
            title={
              esEditable
                ? "Editar evento"
                : "Sólo un evento en Borrador o Publicado puede editarse"
            }
            onClick={() => router.push(`/organizador/${evento.id_evento}/editar`)}
          >
            <Edit3 size={15} strokeWidth={2} style={{ marginRight: 4 }} />
            Editar
          </Boton>
          <Boton
            variante="primario"
            disabled={!esBorrador}
            title={
              esBorrador
                ? "Publicar evento en el catálogo"
                : "Sólo un evento en Borrador puede publicarse"
            }
            onClick={() => setModalPublicar(true)}
          >
            <Check size={15} strokeWidth={2} style={{ marginRight: 4 }} />
            Publicar
          </Boton>
          <Boton
            variante="peligro"
            disabled={!esEliminable}
            title={
              esEliminable
                ? "Eliminar evento"
                : "Sólo un evento en Borrador o Publicado puede eliminarse"
            }
            onClick={() => setModalEliminar(true)}
          >
            <Trash2 size={15} strokeWidth={2} style={{ marginRight: 4 }} />
            Eliminar
          </Boton>
        </div>
      </div>

      <div className={styles.tarjetaDetalles}>
        <h3>Detalles del evento</h3>
        <div className={styles.gridCampos}>
          <div className={styles.columnaDatos}>
            <p>
              <strong>Descripción:</strong> {evento.descripcion}
            </p>
            <p>
              <strong>Ubicación:</strong> {evento.direccion_evento}
            </p>
            <p>
              <strong>Fecha:</strong> {evento.fecha_evento}
            </p>
            <p>
              <strong>Horario:</strong> {evento.hora_evento}{" "}
              {evento.hora_fin_evento ? `hasta ${evento.hora_fin_evento}` : ""}
            </p>
            <p>
              <strong>Categoría:</strong> {evento.categoria || "Sin categoría"}
            </p>
          </div>
          <div className={styles.columnaDatos}>
            <p>
              <strong>ID Evento:</strong> <code>{evento.id_evento}</code>
            </p>
            <p>
              <strong>Tipo de entrada:</strong>{" "}
              {evento.tipo_entrada === "PAGADA" ? "Pagada" : "Gratuita"}
            </p>
            {evento.tipo_entrada === "PAGADA" && (
              <p>
                <strong>Precio:</strong> ${evento.precio} CLP
              </p>
            )}
            <p>
              <strong>Capacidad / Entradas:</strong>{" "}
              {evento.cantidad_entradas ?? "No especificado"}
            </p>
            <p>
              <strong>Fecha de creación:</strong>{" "}
              {new Date(evento.fecha_creacion).toLocaleDateString()}
            </p>
            <p>
              <strong>Última actualización:</strong>{" "}
              {new Date(evento.fecha_actualizacion).toLocaleDateString()}
            </p>
          </div>
        </div>
        {evento.imagen && (
          <div className={styles.imagenContenedor}>
            <p>
              <strong>Imagen del evento:</strong>
            </p>
            <img
              src={evento.imagen}
              alt={evento.nombre_evento}
              className={styles.imagen}
            />
          </div>
        )}
      </div>

      {modalPublicar && (
        <Modal
          titulo="¿Publicar este evento?"
          onCerrar={() => {
            setModalPublicar(false);
            setErrorModal("");
          }}
          acciones={
            <>
              <Boton
                variante="secundario"
                onClick={() => {
                  setModalPublicar(false);
                  setErrorModal("");
                }}
                disabled={publicando}
              >
                Cancelar
              </Boton>
              <Boton
                variante="primario"
                onClick={confirmarPublicar}
                disabled={publicando}
              >
                {publicando ? "Publicando..." : "Publicar"}
              </Boton>
            </>
          }
        >
          <p>¿Publicar este evento? Será visible en el catálogo público para todos los compradores.</p>
          <p>
            <strong>{evento.nombre_evento}</strong>
          </p>
          {errorModal && <p className={styles.errorTexto}>{errorModal}</p>}
        </Modal>
      )}

      {modalEliminar && (
        <Modal
          titulo={`¿Eliminar «${evento.nombre_evento}»?`}
          onCerrar={() => {
            setModalEliminar(false);
            setErrorModal("");
          }}
          acciones={
            <>
              <Boton
                variante="secundario"
                onClick={() => {
                  setModalEliminar(false);
                  setErrorModal("");
                }}
                disabled={eliminando}
              >
                Cancelar
              </Boton>
              <Boton
                variante="peligro"
                onClick={confirmarEliminar}
                disabled={eliminando}
              >
                {eliminando ? "Eliminando..." : "Eliminar"}
              </Boton>
            </>
          }
        >
          <p>
            Si el evento es un borrador o no tiene entradas vendidas, se eliminará permanentemente.
            Si ya vendió entradas, se cancelará automáticamente para resguardar a los compradores.
          </p>
          {errorModal && <p className={styles.errorTexto}>{errorModal}</p>}
        </Modal>
      )}
    </div>
  );
}
