import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import OfflineBanner from "@/components/OfflineBanner";
import SWRegister from "@/components/SWRegister";

const inter = Inter({ subsets: ["latin"] });

export const viewport = {
  themeColor: "#fdb813",
};

export const metadata: Metadata = {
  manifest: "/manifest.webmanifest",
  icons: {
    icon: [
      { url: "/icons/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" }
    ],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180", type: "image/png" }]
  },
  title: "SIGEA System - Gestión Empresarial",
  description: "Sistema Integral de Gestión Empresarial Adaptativa",
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
        <SWRegister />
        {children}
      </body>
    </html>
  );
}
