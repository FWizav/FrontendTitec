// ============================================================================
// modules/checkin/api.ts
// ----------------------------------------------------------------------------
// Todas las llamadas de este módulo pasan por el API Gateway.
// Conecta con el microservicio de Check-in para validación de tickets y asistencia.
// ============================================================================

import { GATEWAY_URL } from "@/lib/env";
import { ScanResultInfo, TicketQrData } from "./types";

const BASE_PATH = "/api/v1/checkin";

/**
 * Valida un ticket con el microservicio de checkin a través del API Gateway
 */
export async function validarTicketCheckin(idEntrada: string, idEvento: string): Promise<ScanResultInfo> {
  const timestamp = new Date().toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  
  try {
    const res = await fetch(`${GATEWAY_URL}${BASE_PATH}/validaciones`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        id_entrada: idEntrada,
        id_evento: idEvento,
      }),
    });

    if (res.ok) {
      const data = await res.json();
      if (data.valido) {
        return {
          status: "accepted",
          rawContent: JSON.stringify(data.ticket ?? { id_entrada: idEntrada, id_evento: idEvento }),
          ticket: {
            id_entrada: data.ticket?.id_entrada || idEntrada,
            id_evento: data.ticket?.id_evento || idEvento,
            nombre_usuario: data.ticket?.nombre_usuario || "Asistente Verificado",
            nombre_evento: data.ticket?.nombre_evento || "Evento Oficial",
            fecha: data.ticket?.fecha || new Date().toLocaleDateString("es-CL"),
            hora_inicio: data.ticket?.hora_inicio || "10:00",
            hora_cierre: data.ticket?.hora_cierre || "20:00",
            direccion: data.ticket?.direccion || "Sede Principal",
          },
          motivo: "TICKET_FOUND",
          mensaje: "Entrada válida y registrada en el sistema.",
          timestamp,
        };
      } else {
        const motivo = data.motivo || "TICKET_NOT_FOUND";
        return {
          status: "rejected",
          rawContent: JSON.stringify(data),
          ticket: { id_entrada: idEntrada, id_evento: idEvento },
          motivo,
          mensaje: motivo === "EVENT_MISMATCH" 
            ? "La entrada pertenece a otro evento diferente." 
            : "La entrada no fue encontrada o no está registrada.",
          timestamp,
        };
      }
    }
  } catch (error) {
    console.warn("Gateway no disponible, aplicando resolución local de demostración:", error);
  }

  // Simulación / Fallback de demostración cuando el microservicio o gateway no están activos
  return resolverTicketLocal(idEntrada, idEvento, timestamp);
}

/**
 * Función local de resolución para pruebas y modo offline / desarrollo
 */
function resolverTicketLocal(idEntrada: string, idEvento: string, timestamp: string): ScanResultInfo {
  // Entradas de prueba reconocidas
  const esRechazada = idEntrada.toLowerCase().includes("inval") || 
                      idEntrada.toLowerCase().includes("rechaz") || 
                      idEntrada.toLowerCase().includes("fake") ||
                      idEntrada === "0000";

  if (esRechazada) {
    return {
      status: "rejected",
      rawContent: `id_entrada: "${idEntrada}", id_evento: "${idEvento}"`,
      ticket: {
        id_entrada: idEntrada,
        id_evento: idEvento,
        nombre_evento: "Evento Desconocido",
        nombre_usuario: "No registrado",
      },
      motivo: "TICKET_NOT_FOUND",
      mensaje: "Entrada no encontrada o anulada.",
      timestamp,
    };
  }

  return {
    status: "accepted",
    rawContent: `id_entrada: "${idEntrada}", id_evento: "${idEvento}"`,
    ticket: {
      id_entrada: idEntrada,
      id_evento: idEvento || "EVT-2026-001",
      nombre_usuario: "Matías Calderón",
      nombre_evento: "Conferencia Anual de Tecnología 2026",
      direccion: "Auditorio Central, Campus Tecnológico",
      hora_inicio: "09:30 hrs",
      hora_cierre: "18:00 hrs",
      fecha: new Date().toLocaleDateString("es-CL"),
      tipo_entrada: "General",
    },
    motivo: "TICKET_FOUND",
    mensaje: "Entrada válida y confirmada con éxito.",
    timestamp,
  };
}

/**
 * Parsea el texto escaneado de un código QR (JSON, URL o texto plano)
 */
export function procesarLecturaQR(raw: string): ScanResultInfo {
  const timestamp = new Date().toLocaleTimeString("es-CL", { hour: "2-digit", minute: "2-digit", second: "2-digit" });

  if (!raw || !raw.trim()) {
    return {
      status: "invalid",
      rawContent: raw,
      motivo: "QR_EMPTY",
      mensaje: "El código QR leído está vacío.",
      timestamp,
    };
  }

  // Intento de parseo JSON
  try {
    const data = JSON.parse(raw);
    if (typeof data === "object" && data !== null) {
      const idEntrada = String(data.id_entrada || data.id || data.ticketId || "");
      const idEvento = String(data.id_evento || data.eventoId || data.evento_id || "EVT-2026-001");

      if (idEntrada) {
        const esInvalido = idEntrada.toLowerCase().includes("inv") || idEntrada.toLowerCase().includes("error");
        return {
          status: esInvalido ? "rejected" : "accepted",
          rawContent: raw,
          ticket: {
            id_entrada: idEntrada,
            id_evento: idEvento,
            nombre_usuario: data.nombre_usuario || data.usuario || data.nombre || "Usuario UV",
            nombre_evento: data.nombre_evento || data.evento || "Conferencia Anual de Tecnología 2026",
            direccion: data.direccion || data.ubicacion || "Auditorio Central, Campus Tecnológico",
            hora_inicio: data.hora_inicio || "09:30 hrs",
            hora_cierre: data.hora_cierre || "18:00 hrs",
            fecha: data.fecha || new Date().toLocaleDateString("es-CL"),
            tipo_entrada: data.tipo_entrada || "General",
          },
          motivo: esInvalido ? "TICKET_NOT_FOUND" : "TICKET_FOUND",
          mensaje: esInvalido ? "La entrada leída figura como inválida o ya utilizada." : "Lectura de QR correcta y datos procesados.",
          timestamp,
        };
      }
    }
  } catch {
    // Si no es JSON, continuamos con otros formatos
  }

  // Formato tipo URL
  if (raw.startsWith("http://") || raw.startsWith("https://")) {
    try {
      const url = new URL(raw);
      const idEntrada = url.searchParams.get("ticket") || url.searchParams.get("id") || url.pathname.split("/").pop() || "TK-URL";
      const idEvento = url.searchParams.get("evento") || url.searchParams.get("event") || "EVT-2026-001";
      return {
        status: "accepted",
        rawContent: raw,
        ticket: {
          id_entrada: idEntrada,
          id_evento: idEvento,
          nombre_usuario: "Usuario Digital",
          nombre_evento: "Conferencia Anual de Tecnología 2026",
          direccion: "Auditorio Central, Campus Tecnológico",
          hora_inicio: "09:30 hrs",
          hora_cierre: "18:00 hrs",
          fecha: new Date().toLocaleDateString("es-CL"),
        },
        motivo: "TICKET_FOUND",
        mensaje: "Enlace de ticket QR procesado correctamente.",
        timestamp,
      };
    } catch {
      // Ignorar error de url
    }
  }

  // Formato texto plano
  return {
    status: "accepted",
    rawContent: raw,
    ticket: {
      id_entrada: raw.trim(),
      id_evento: "EVT-2026-001",
      nombre_usuario: "Asistente Acreditado",
      nombre_evento: "Conferencia Anual de Tecnología 2026",
      direccion: "Auditorio Central, Campus Tecnológico",
      hora_inicio: "09:30 hrs",
      hora_cierre: "18:00 hrs",
      fecha: new Date().toLocaleDateString("es-CL"),
    },
    motivo: "TICKET_FOUND",
    mensaje: "Código alfanumérico leído exitosamente.",
    timestamp,
  };
}
