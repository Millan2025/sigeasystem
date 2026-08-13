import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import OfflineBanner from "@/components/OfflineBanner";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "SIGEA System - Gestión Empresarial",
  description: "Sistema Integral de Gestión Empresarial Adaptativa",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    title: "SIGEA",
    statusBarStyle: "default",
  },
  applicationName: "SIGEA",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <head>
        <link rel="icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/icon-192.png" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-title" content="SIGEA" />
        <meta name="application-name" content="SIGEA" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="theme-color" content="#10B981" />
      </head>
      <body className={inter.className}>
        <OfflineBanner />
        {children}
      </body>
    </html>
  );
}
