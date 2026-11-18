"use client";

import { useMemo, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Calendar, CheckCircle2 } from "lucide-react";
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
          `El evento "${modal.evento.nombre_evento}" tiene entradas vendidas, por lo que fue cancelado en vez de eliminarse.`
        );
      } else {
        quitarEventoLocal(modal.evento.id_evento);
        setAviso(`Evento "${modal.evento.nombre_evento}" eliminado correctamente.`);
      }
      setModal(null);
    } catch (err: any) {
      if (err?.codigo === "ENTRADAS_UNAVAILABLE" || err?.status === 503) {
        setErrorModal(
          "No se pudo consultar el inventario de entradas. El evento no se eliminó; inténtalo nuevamente más tarde."
        );
      } else if (err?.codigo === "EVENT_NOT_OWNED" || err?.status === 403) {
        setErrorModal("No tienes permisos sobre este evento.");
      } else if (err?.status === 401) {
        setErrorModal("Tu sesión no es válida o ha expirado.");
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
        `Evento "${publicado.nombre_evento}" publicado exitosamente. Ya se encuentra disponible en el catálogo público.`
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
          <CheckCircle2 size={18} strokeWidth={2} />
          <span>{aviso}</span>
        </div>
      )}

      <div className={styles.encabezado}>
        <div>
          <h1>Mis eventos</h1>
          <p className={styles.descripcion}>
            Gestiona los eventos de tu cartelera. Publica eventos para que sean visibles
            en el catálogo y consulta su detalle en tiempo real.
          </p>
        </div>
        <Boton
          variante="secundario"
          className={styles.btnNuevo}
          disabled
          title="Disponible en la entrega final"
        >
          + Nuevo evento (Disponible en la entrega final)
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
          <div className={styles.vacioIcono}>
            <Calendar size={48} strokeWidth={1.5} />
          </div>
          {eventos.length === 0 ? (
            <>
              <h3 className={styles.vacioTitulo}>Aún no tienes eventos registrados</h3>
              <p className={styles.vacioTexto}>
                Tu cartelera está vacía en este momento. Cuando se habilite la creación
                en la entrega final, podrás crear y publicar tus eventos desde aquí.
              </p>
            </>
          ) : (
            <>
              <h3 className={styles.vacioTitulo}>No se encontraron eventos</h3>
              <p className={styles.vacioTexto}>
                No hay eventos que coincidan con el filtro o término de búsqueda seleccionado.
                Prueba cambiando el estado o limpiando el buscador.
              </p>
            </>
          )}
        </div>
      ) : (
        <div className={styles.lista}>
          {eventosFiltrados.map((evento) => (
            <TarjetaEvento
              key={evento.id_evento}
              evento={evento}
              onPublicar={(e) => setModal({ tipo: "publicar", evento: e })}
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
          <p>¿Publicar este evento? Será visible de inmediato en el catálogo público para todos los compradores.</p>
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
            Si el evento es un borrador o no tiene entradas vendidas, se eliminará permanentemente.
            Si ya tiene entradas vendidas, se cancelará automáticamente para proteger a los compradores.
          </p>
          {errorModal && <p className={styles.errorTexto}>{errorModal}</p>}
        </Modal>
      )}
    </div>
  );
}
