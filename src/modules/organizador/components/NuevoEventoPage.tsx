"use client";

import { useRouter } from "next/navigation";
import { crearEvento } from "../api";
import { useSesion } from "./SesionContext";
import PestanasPantalla from "./PestanasPantalla";
import FormularioEvento from "./FormularioEvento";
import styles from "./NuevoEventoPage.module.css";

export default function NuevoEventoPage() {
  const { actualizarEventoLocal } = useSesion();
  const router = useRouter();

  async function guardarNuevoEvento(payload: any) {
    const nuevoEvento = await crearEvento(payload);
    actualizarEventoLocal(nuevoEvento);
    router.push(
      `/organizador?aviso=${encodeURIComponent(
        `Evento "${nuevoEvento.nombre_evento}" creado como Borrador.`
      )}`
    );
  }

  return (
    <div className={styles.nuevoEventoPage}>
      <PestanasPantalla activa="crear" />
      <div className={styles.encabezado}>
        <h1>Nuevo evento</h1>
        <span className={styles.etiquetaBorrador}>Se guarda como borrador</span>
      </div>
      <p className={styles.descripcion}>
        Completa los datos principales. Podrás publicarlo desde “Mis eventos”
        cuando esté listo.
      </p>

      <FormularioEvento
        modo="crear"
        textoBoton="Guardar evento"
        onGuardar={guardarNuevoEvento}
        onCancelar={() => router.push("/organizador")}
      />
    </div>
  );
}
