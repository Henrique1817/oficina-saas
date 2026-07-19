import type { Metadata } from "next";
import { DM_Sans, IBM_Plex_Sans } from "next/font/google";
import "./globals.css";

const dmSans = DM_Sans({
  subsets: ["latin"],
  variable: "--font-dm-sans",
  display: "swap",
});

const ibmPlex = IBM_Plex_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-ibm-plex",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Oficina Console",
  description: "Painel administrativo da plataforma Oficina",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${dmSans.variable} ${ibmPlex.variable}`}>
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
