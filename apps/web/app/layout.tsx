import type { Metadata } from "next";
import { DM_Sans, Oswald } from "next/font/google";
import "./globals.css";

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
  display: "swap",
});

const oswald = Oswald({
  subsets: ["latin"],
  variable: "--font-oswald",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Oficina — Gestão para oficinas mecânicas",
  description:
    "Ordens de serviço, estoque, orçamentos e equipe em um só lugar. 14 dias grátis.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${dmSans.variable} ${oswald.variable}`}>
      <body>{children}</body>
    </html>
  );
}
