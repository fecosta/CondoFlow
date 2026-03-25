import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";
import { Toaster } from "@/components/ui/sonner";

const inter = localFont({
  src: "../fonts/Inter-VariableFont_slnt,wght.ttf",
  variable: "--font-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "GCR — Gestão de Condomínios",
  description: "Plataforma de gestão condominial",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className={inter.variable}>
      <body className="font-sans antialiased">
        {children}
        <Toaster richColors />
      </body>
    </html>
  );
}