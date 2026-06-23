import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "SIGEA System - Gestión Empresarial",
  description: "Sistema Integral de Gestión Empresarial Adaptativa",
  icons: {
    icon: "/favicon-v4.ico",
    shortcut: "/favicon-v4.ico",
    apple: "/favicon-v4.ico",
  },
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    title: "SIGEA",
    statusBarStyle: "default",
  },
  applicationName: "SIGEA",
  formatDetection: {
    telephone: false,
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <head>
        <link rel="icon" href="/favicon-v4.ico" />
        <link rel="shortcut icon" href="/favicon-v4.ico" />
        <link rel="apple-touch-icon" href="/favicon-v4.ico" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-title" content="SIGEA" />
        <meta name="application-name" content="SIGEA" />
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body className={inter.className}>
        {children}
      </body>
    </html>
  );
}

