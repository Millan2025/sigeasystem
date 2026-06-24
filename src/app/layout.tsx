import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "SIGEA System",
  description: "Sistema Integral de Gestion Empresarial",
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
        <link rel="shortcut icon" href="/favicon.ico" />
        <link rel="apple-touch-icon" href="/favicon.ico" />
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
