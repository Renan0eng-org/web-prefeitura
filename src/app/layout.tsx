import { ServiceWorkerRegister } from '@/components/serviceWorkerRegister';
import { Nunito } from '@next/font/google';
import { Analytics } from "@vercel/analytics/react";
import type { Metadata } from "next";
import "./globals.css";

const nunito = Nunito({
  subsets: ['latin'],
  weight: ["200", "400", "600", "700"],
});

export const metadata: Metadata = {
  title: "PVAI SEM DOR - Gerenciamento de Dores Crônicas",
  description: "Sistema de gerenciamento de saúde pública de Paranavai para dores crônicas",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <head>
        <link rel="manifest" href="/manifest.json" />
      </head>
      <body className={`${nunito.className} antialiased`}>
        <ServiceWorkerRegister />
        {children}
        <Analytics />
      </body>
    </html>
  );
}
