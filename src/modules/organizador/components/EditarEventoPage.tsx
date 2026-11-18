"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { obtenerEvento, editarEvento, ApiError } from "../api";
import { useSesion } from "./SesionContext";
import BadgeEstado from "./BadgeEstado";
import Boton from "./Boton";
import FormularioEvento from "./FormularioEvento";
import styles from "./EditarEventoPage.module.css";

export default function EditarEventoPage() {
  const params = useParams();
  const idEvento = params?.idEvento as string;
  const router = useRouter();
  const { actualizarEventoLocal } = useSesion();

  const [evento, setEvento] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [errorCarga, setErrorCarga] = useState<{
    type: string;
    msg: string;
  } | null>(null);

  useEffect(() => {
    const abortCtrl = new AbortController();
    const fetchEvento = async () => {
      try {
        setLoading(true);
        if (!idEvento) return;
        const data = await obtenerEvento(idEvento, abortCtrl.signal);
        setEvento(data);
      } catch (err: any) {
        if (err.name === "AbortError") return;
        if (err instanceof ApiError) {
          if (err.codigo === "EVENT_NOT_OWNED" || err.status === 403) {
            setErrorCarga({ type: "403", msg: "Este evento no te pertenece." });
          } else if (err.status === 404) {
            setErrorCarga({ type: "404", msg: "Evento no encontrado." });
          } else {
            setErrorCarga({ type: "generic", msg: err.message });
          }
        } else {
          setErrorCarga({ type: "generic", msg: "Error al cargar el evento." });
        }
      } finally {
        setLoading(false);
      }
    };
    fetchEvento();
    return () => abortCtrl.abort();
  }, [idEvento]);

  if (loading) {
    return <div className={styles.mensajeEstado}>Cargando evento...</div>;
  }

  if (errorCarga) {
    return (
      <div className={styles.mensajeEstado}>
        <h2>
          Error{" "}
          {errorCarga.type === "403"
            ? "403"
            : errorCarga.type === "404"
            ? "404"
            : ""}
        </h2>
        <div className={styles.errorTexto}>{errorCarga.msg}</div>
        <Boton variante="primario" onClick={() => router.push("/organizador")}>
          Volver a Mis eventos
        </Boton>
      </div>
    );
  }

  if (!evento) return null;

  const noEditable =
    evento.estado_gestion !== "BORRADOR" &&
    evento.estado_gestion !== "PUBLICADO";

  const avisoBloqueo = noEditable
    ? `Este evento está ${evento.estado_gestion.toLowerCase()} y ya no puede modificarse.`
    : "";

  async function guardarCambios(payload: any) {
    const actualizado = await editarEvento(evento.id_evento, payload);
    actualizarEventoLocal(actualizado);
    router.push(
      `/organizador?aviso=${encodeURIComponent(
        `Cambios guardados en "${actualizado.nombre_evento}".`
      )}`
    );
  }

  return (
    <div className={styles.editarEventoPage}>
      <div className={styles.encabezado}>
        <h1>Editar evento</h1>
        <BadgeEstado estado={evento.estado_gestion} />
      </div>
      <p className={styles.descripcion}>
        Modifica los datos del evento. Si ya está publicado, los cambios se
        verán de inmediato en el catálogo.
      </p>

      <FormularioEvento
        modo="editar"
        eventoInicial={evento}
        textoBoton="Guardar cambios"
        onGuardar={guardarCambios}
        onCancelar={() => router.push("/organizador")}
        deshabilitado={noEditable}
        avisoBloqueo={avisoBloqueo}
      />
    </div>
  );
}
