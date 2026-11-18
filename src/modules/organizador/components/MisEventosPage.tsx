"use client";

import { useMemo, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { eliminarEvento, publicarEvento } from "../api";
import Modal from "./Modal";
import { useSesion } from "./SesionContext";
import PestanasPantalla from "./PestanasPantalla";
import FiltrosEventos from "./FiltrosEventos";
import TarjetaEvento from "./TarjetaEvento";
import Boton from "./Boton";
import styles from "./MisEventosPage.module.css";

/** HU-05 — Ver mis eventos. */
export default function MisEventosPage() {
  const { eventos, actualizarEventoLocal, quitarEventoLocal } = useSesion();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [filtro, setFiltro] = useState("TODOS");
  const [busqueda, setBusqueda] = useState("");
  const [modal, setModal] = useState<{
    tipo: "publicar" | "eliminar" | "sprint";
    evento: any;
    mensaje?: string;
  } | null>(null);

  const [aviso, setAviso] = useState<string>("");
  const [publicando, setPublicando] = useState(false);
  const [eliminando, setEliminando] = useState(false);
  const [errorModal, setErrorModal] = useState("");

  useEffect(() => {
    const avisoParam = searchParams.get("aviso");
    if (avisoParam) {
      setAviso(avisoParam);
    }
  }, [searchParams]);

  const cerrarModal = () => {
    setModal(null);
    setErrorModal("");
  };

  async function confirmarEliminar() {
    if (!modal?.evento) return;
    setEliminando(true);
    setErrorModal("");
    try {
      const res = await eliminarEvento(modal.evento.id_evento);
      if (res?.resultado === "CANCELADO") {
        actualizarEventoLocal(res.evento);
        setAviso(
          `El evento "${modal.evento.nombre_evento}" tiene entradas vendidas, así que se canceló en vez de eliminarse.`
        );
      } else {
        quitarEventoLocal(modal.evento.id_evento);
        setAviso(`Evento "${modal.evento.nombre_evento}" eliminado.`);
      }
      setModal(null);
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

  async function confirmarPublicar() {
    if (!modal?.evento) return;
    setPublicando(true);
    setErrorModal("");
    try {
      const publicado = await publicarEvento(modal.evento.id_evento);
      actualizarEventoLocal({ ...modal.evento, ...publicado });
      setAviso(
        `Evento "${publicado.nombre_evento}" publicado. Ya es visible en el catálogo público.`
      );
      setModal(null);
    } catch (err: any) {
      setErrorModal(err.message || "No se pudo publicar el evento.");
    } finally {
      setPublicando(false);
    }
  }

  const eventosFiltrados = useMemo(() => {
    return eventos.filter((e) => {
      const coincideEstado = filtro === "TODOS" || e.estado_gestion === filtro;
      const coincideBusqueda = e.nombre_evento
        ?.toLowerCase()
        .includes(busqueda.toLowerCase());
      return coincideEstado && coincideBusqueda;
    });
  }, [eventos, filtro, busqueda]);

  return (
    <div className={styles.misEventosPage}>
      {aviso && (
        <div role="status" className={styles.avisoExito}>
          {aviso}
        </div>
      )}

      <div className={styles.encabezado}>
        <div>
          <h1>Mis eventos</h1>
          <p className={styles.descripcion}>
            Crea y publica los eventos de tu cartelera. Los cambios se reflejan en
            el catálogo público.
          </p>
        </div>
        <Boton
          variante="primario"
          onClick={() => router.push("/organizador/nuevo")}
        >
          + Nuevo evento
        </Boton>
      </div>

      <PestanasPantalla activa="listado" />

      <FiltrosEventos
        eventos={eventos}
        filtroActivo={filtro}
        onCambiarFiltro={setFiltro}
        busqueda={busqueda}
        onCambiarBusqueda={setBusqueda}
        enfocarBuscador={searchParams.get("buscar") === "true"}
      />

      {eventosFiltrados.length === 0 ? (
        <div className={styles.vacio}>
          <p>No hay eventos que coincidan con este filtro.</p>
        </div>
      ) : (
        <div className={styles.lista}>
          {eventosFiltrados.map((evento) => (
            <TarjetaEvento
              key={evento.id_evento}
              evento={evento}
              onPublicar={(e) => setModal({ tipo: "publicar", evento: e })}
              onEditar={(e) => router.push(`/organizador/${e.id_evento}/editar`)}
              onEliminar={(e) => setModal({ tipo: "eliminar", evento: e })}
            />
          ))}
        </div>
      )}

      {modal?.tipo === "publicar" && (
        <Modal
          titulo="¿Publicar este evento?"
          onCerrar={cerrarModal}
          acciones={
            <>
              <Boton
                variante="secundario"
                onClick={cerrarModal}
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
          <p>¿Publicar este evento? Será visible en el catálogo público.</p>
          <p>
            <strong>{modal.evento.nombre_evento}</strong>
          </p>
          {errorModal && <p className={styles.errorTexto}>{errorModal}</p>}
        </Modal>
      )}

      {modal?.tipo === "eliminar" && (
        <Modal
          titulo={`¿Eliminar «${modal.evento.nombre_evento}»?`}
          onCerrar={cerrarModal}
          acciones={
            <>
              <Boton
                variante="secundario"
                onClick={cerrarModal}
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
            Si es un borrador o no tiene entradas vendidas, se elimina. Si ya
            vendió entradas, se cancela y se avisa a los compradores.
          </p>
          {errorModal && <p className={styles.errorTexto}>{errorModal}</p>}
        </Modal>
      )}

      {modal?.tipo === "sprint" && (
        <Modal
          titulo="Disponible en un próximo sprint"
          onCerrar={cerrarModal}
          acciones={
            <Boton variante="primario" onClick={cerrarModal}>
              Entendido
            </Boton>
          }
        >
          <p>{modal.mensaje}</p>
        </Modal>
      )}
    </div>
  );
}
