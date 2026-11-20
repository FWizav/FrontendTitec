"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import jsQR from "jsqr";
import { ArrowLeft, Camera, RefreshCw, AlertCircle } from "./icons";
import { ScanResultInfo } from "../types";
import { procesarLecturaQR } from "../api";

interface ScannerProps {
  onBack: () => void;
  onScan: (result: ScanResultInfo) => void;
  availableAt?: number;
}

export default function ScannerView({ onBack, onScan, availableAt = 0 }: ScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const scannerControlsRef = useRef<{ stop: () => void } | null>(null);
  const decodedRef = useRef(false);
  const onScanRef = useRef(onScan);
  useEffect(() => { onScanRef.current = onScan; }, [onScan]);
  const [waitSeconds, setWaitSeconds] = useState(() => Math.max(0, Math.ceil((availableAt - Date.now()) / 1000)));
  useEffect(() => {
    const update = () => setWaitSeconds(Math.max(0, Math.ceil((availableAt - Date.now()) / 1000)));
    update();
    const timer = window.setInterval(update, 200);
    return () => window.clearInterval(timer);
  }, [availableAt]);

  const [hasCameraPermission, setHasCameraPermission] = useState<boolean | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [attempt, setAttempt] = useState(0);

  // Detener la cámara y el intervalo
  const stopCamera = useCallback(() => {
    scannerControlsRef.current?.stop();
    scannerControlsRef.current = null;
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setIsScanning(false);
  }, []);

  // Procesar código leído
  const handleDecodedQR = useCallback(
    async (qrContent: string) => {
      if (decodedRef.current) return;
      decodedRef.current = true;
      // Detener cámara al leer exitosamente
      stopCamera();
      setIsValidating(true);

      // Haptic feedback si está disponible
      if (typeof navigator !== "undefined" && navigator.vibrate) {
        try {
          navigator.vibrate(100);
        } catch {
          // Ignorar si el navegador bloquea la vibración
        }
      }

      try {
        const result = await procesarLecturaQR(qrContent);
        onScanRef.current(result);
      } finally {
        setIsValidating(false);
      }
    },
    [stopCamera]
  );

  // Inicializar cámara y lector
  useEffect(() => {
    let cancelled = false;

    async function initCamera() {
      decodedRef.current = false;
      setCameraError(null);
      setHasCameraPermission(null);

      // Verificación de contexto seguro (HTTPS o localhost)
      if (typeof window !== "undefined" && !window.isSecureContext && window.location.hostname !== "localhost") {
        setCameraError("Para utilizar la cámara se requiere una conexión segura (HTTPS).");
        setHasCameraPermission(false);
        return;
      }

      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        setCameraError("Tu navegador o dispositivo no admite acceso a la cámara.");
        setHasCameraPermission(false);
        return;
      }

      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: { ideal: "environment" },
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
          audio: false,
        });

        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        streamRef.current = stream;
        const video = videoRef.current;
        if (!video) throw new Error("No se pudo iniciar el visor de la cámara.");

        video.srcObject = stream;
        await video.play();
        if (cancelled) {
          stream.getTracks().forEach((track) => track.stop());
          return;
        }

        // Un solo bucle por montaje. La pausa no reinicia ni desmonta la cámara.
        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d", { willReadFrequently: true });
        if (!context) throw new Error("No se pudo iniciar el detector QR.");
        let timer: number | undefined;
        let stopped = false;
        scannerControlsRef.current = {
          stop: () => {
            stopped = true;
            if (timer !== undefined) window.clearTimeout(timer);
          },
        };
        const scanFrame = () => {
          if (cancelled || stopped || decodedRef.current) return;
          let content: string | undefined;
          if (Date.now() >= availableAt && video.readyState >= 2 && video.videoWidth > 0) {
            canvas.width = video.videoWidth;
            canvas.height = video.videoHeight;
            context.drawImage(video, 0, 0, canvas.width, canvas.height);
            try {
              const pixels = context.getImageData(0, 0, canvas.width, canvas.height);
              content = jsQR(pixels.data, pixels.width, pixels.height, { inversionAttempts: "attemptBoth" })?.data;
            } catch {
              // Un fotograma sin QR legible no es un fallo de la cámara.
            }
          }
          if (content) {
            void handleDecodedQR(content);
            return;
          }
          timer = window.setTimeout(scanFrame, 250);
        };
        setHasCameraPermission(true);
        setIsScanning(true);
        scanFrame();
      } catch (err: unknown) {
        if (cancelled) return;
        stopCamera();
        setHasCameraPermission(false);
        const errorText = err instanceof Error ? err.message : String(err);
        if (/NotAllowedError|permission|denied/i.test(errorText)) {
          setCameraError("Permiso de cámara denegado. Permite el acceso a la cámara en el navegador y reintenta.");
        } else if (/NotFoundError|device|not found/i.test(errorText)) {
          setCameraError("No se encontró ninguna cámara disponible en este dispositivo.");
        } else {
          setCameraError("No se pudo iniciar la cámara o el lector QR: " + errorText);
        }
      }
    }

    initCamera();

    return () => {
      cancelled = true;
      stopCamera();
    };
  }, [attempt, availableAt, handleDecodedQR, stopCamera]);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        backgroundColor: "#111827",
        minHeight: "75vh",
        padding: "20px 16px",
        fontFamily: "'Inter', sans-serif",
        color: "#FFFFFF",
      }}
    >
      <div
        style={{
          width: "100%",
          maxWidth: "480px",
          display: "flex",
          flexDirection: "column",
          gap: "16px",
        }}
      >
        {/* Barra superior con volver */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <button
            type="button"
            onClick={() => {
              stopCamera();
              onBack();
            }}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              backgroundColor: "rgba(255, 255, 255, 0.12)",
              color: "#FFFFFF",
              border: "1px solid rgba(255, 255, 255, 0.2)",
              borderRadius: "8px",
              padding: "8px 16px",
              fontSize: "14px",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            <ArrowLeft size={16} />
            <span>Volver</span>
          </button>

          <span
            style={{
              fontSize: "12px",
              fontWeight: 600,
              backgroundColor: "#2F4374",
              padding: "4px 10px",
              borderRadius: "999px",
            }}
          >
            Lector QR en vivo
          </span>
        </div>

        {/* Contenedor del video / visor de cámara */}
        <div
          style={{
            position: "relative",
            width: "100%",
            height: "380px",
            backgroundColor: "#000000",
            borderRadius: "12px",
            overflow: "hidden",
            boxShadow: "0 8px 24px rgba(0, 0, 0, 0.4)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          {/* Elemento de video */}
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
            }}
          />

          {/* Cuadro de enfoque / retícula animada cuando la cámara funciona */}
          {hasCameraPermission && isScanning && (
            <div
              style={{
                position: "absolute",
                width: "220px",
                height: "220px",
                border: "2px solid rgba(255, 255, 255, 0.4)",
                borderRadius: "16px",
                boxShadow: "0 0 0 9999px rgba(0, 0, 0, 0.45)",
                pointerEvents: "none",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              {/* Esquinas decorativas estilo escáner */}
              <div
                style={{
                  position: "absolute",
                  top: -2,
                  left: -2,
                  width: 24,
                  height: 24,
                  borderTop: "4px solid #FFFFFF",
                  borderLeft: "4px solid #FFFFFF",
                  borderTopLeftRadius: "12px",
                }}
              />
              <div
                style={{
                  position: "absolute",
                  top: -2,
                  right: -2,
                  width: 24,
                  height: 24,
                  borderTop: "4px solid #FFFFFF",
                  borderRight: "4px solid #FFFFFF",
                  borderTopRightRadius: "12px",
                }}
              />
              <div
                style={{
                  position: "absolute",
                  bottom: -2,
                  left: -2,
                  width: 24,
                  height: 24,
                  borderBottom: "4px solid #FFFFFF",
                  borderLeft: "4px solid #FFFFFF",
                  borderBottomLeftRadius: "12px",
                }}
              />
              <div
                style={{
                  position: "absolute",
                  bottom: -2,
                  right: -2,
                  width: 24,
                  height: 24,
                  borderBottom: "4px solid #FFFFFF",
                  borderRight: "4px solid #FFFFFF",
                  borderBottomRightRadius: "12px",
                }}
              />

              {/* Línea animada de escaneo */}
              <div
                style={{
                  position: "absolute",
                  width: "100%",
                  height: "2px",
                  backgroundColor: "#60A5FA",
                  boxShadow: "0 0 8px #60A5FA",
                  animation: "scanPulse 2s ease-in-out infinite",
                }}
              />
            </div>
          )}

          {/* Estado de error o carga de cámara */}
          {hasCameraPermission === false && (
            <div
              style={{
                position: "absolute",
                padding: "24px",
                textAlign: "center",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "12px",
                maxWidth: "340px",
              }}
            >
              <AlertCircle size={40} color="#F87171" />
              <div style={{ fontSize: "14px", color: "#FCA5A5", lineHeight: 1.5 }}>
                {cameraError || "No se pudo acceder a la cámara."}
              </div>
              <button
                type="button"
                onClick={() => setAttempt((v) => v + 1)}
                style={{
                  backgroundColor: "#2F4374",
                  color: "#FFFFFF",
                  border: "none",
                  borderRadius: "8px",
                  padding: "8px 16px",
                  fontSize: "13px",
                  fontWeight: 600,
                  cursor: "pointer",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                }}
              >
                <RefreshCw size={14} />
                <span>Reintentar cámara</span>
              </button>
            </div>
          )}

          {hasCameraPermission === null && (
            <div
              style={{
                position: "absolute",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "10px",
              }}
            >
              <Camera size={36} color="#9CA3AF" />
              <span style={{ fontSize: "13px", color: "#D1D5DB" }}>{waitSeconds > 0 ? `Siguiente lectura en ${waitSeconds} s. Retira el QR anterior.` : isValidating ? "Validando entrada..." : "Iniciando cámara..."}</span>
            </div>
          )}
        </div>

        {/* Guía informativa */}
        <p
          style={{
            textAlign: "center",
            fontSize: "13px",
            color: "#9CA3AF",
            margin: "0 0 8px 0",
          }}
        >
          {waitSeconds > 0
            ? `Siguiente lectura en ${waitSeconds} s. Retira el QR anterior.`
            : isValidating
              ? "Validando entrada..."
              : "Apunta la cámara al código QR de la entrada para leerlo automáticamente."}
        </p>
      </div>

      {/* Estilo para animación de línea de escáner */}
      <style>{`
        @keyframes scanPulse {
          0% { top: 0%; opacity: 0.3; }
          50% { top: 50%; opacity: 1; }
          100% { top: 100%; opacity: 0.3; }
        }
      `}</style>
    </div>
  );
}
