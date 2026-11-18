"use client";

import { QrCode, KeyRound } from "./icons";

interface SelectionProps {
  onSelectQR: () => void;
  onSelectCode?: () => void;
}

export default function SelectionView({ onSelectQR, onSelectCode }: SelectionProps) {
  return (
    <div className="selection-container">
      <style dangerouslySetInnerHTML={{ __html: `
        .selection-container {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          background-color: #F8F9FA;
          flex-grow: 1;
          width: 100%;
          min-height: 75vh;
          color: #2F4374;
          padding: max(32px, env(safe-area-inset-top)) 20px max(32px, env(safe-area-inset-bottom));
          font-family: 'Inter', sans-serif;
          box-sizing: border-box;
        }
        .selection-wrapper {
          width: 100%;
          max-width: 540px;
          display: flex;
          flex-direction: column;
          gap: 20px;
          margin: 0 auto;
        }
        .selection-title {
          text-align: center;
          margin-bottom: 24px;
          font-size: clamp(24px, 3.5vw, 32px);
          font-family: 'Poppins', sans-serif;
          font-weight: 700;
          color: #2F4374;
          line-height: 1.25;
        }
        .selection-btn {
          background-color: #2F4374;
          color: #FFFFFF;
          min-height: 64px;
          border-radius: 12px;
          border: none;
          font-size: clamp(15px, 2vw, 17px);
          font-family: 'Inter', sans-serif;
          font-weight: 600;
          cursor: pointer;
          text-align: center;
          width: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 14px;
          padding: 18px 24px;
          box-shadow: 0 4px 14px rgba(47, 67, 116, 0.18);
          transition: all 0.2s ease-in-out;
          box-sizing: border-box;
          text-decoration: none;
        }
        .selection-btn:hover:not(:disabled) {
          background-color: #24355D;
          transform: translateY(-2px);
          box-shadow: 0 6px 20px rgba(47, 67, 116, 0.28);
        }
        .selection-btn:active:not(:disabled) {
          transform: translateY(0);
          box-shadow: 0 2px 8px rgba(47, 67, 116, 0.2);
        }
        .selection-btn:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }
        @media (min-width: 768px) {
          .selection-wrapper {
            max-width: 580px;
            gap: 22px;
          }
          .selection-btn {
            min-height: 70px;
          }
        }
      `}} />

      <div className="selection-wrapper">
        <h1 className="selection-title">Método de Identificación</h1>

        {/* Opción 1: QR */}
        <button
          type="button"
          className="selection-btn"
          onClick={onSelectQR}
        >
          <QrCode size={22} color="#FFFFFF" />
          <span>Ingreso por QR</span>
        </button>

        {/* Opción 2: Código secreto */}
        <button
          type="button"
          className="selection-btn"
          onClick={onSelectCode}
          disabled={!onSelectCode}
        >
          <KeyRound size={22} color="#FFFFFF" />
          <span>Ingreso por código secreto</span>
        </button>
      </div>
    </div>
  );
}
