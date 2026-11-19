import type { ReactNode } from "react";
import { SesionProvider } from "@/modules/organizador/components/SesionContext";

export const metadata = {
  title: "Panel Organizador — TicketU",
  description: "Gestión de cartelera y eventos para organizadores",
};

export default function OrganizadorLayout({
  children,
}: {
  children: ReactNode;
}) {
  return <SesionProvider>{children}</SesionProvider>;
}
