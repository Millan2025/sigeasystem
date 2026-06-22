import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SIGEA System v2",
  description: "Sistema Integral de Gestion Empresarial Adaptativa",
  manifest: "/manifest.json",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es"><head><link rel="icon" href="/favicon.ico" /><link rel="apple-touch-icon" href="/favicon.ico" /><meta name="mobile-web-app-capable" content="yes" /><meta name="application-name" content="SIGEA" /></head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        
        {children}
      </body>
    </html>
  );
}








