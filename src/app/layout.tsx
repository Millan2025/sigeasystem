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
  title: "SIGEA System",
  description: "Sistema Integral de Gestion Empresarial Adaptativa",
  manifest: "/manifest.json",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es"><head><link rel="icon" href="/logoBlanco-sigea.png" /><link rel="apple-touch-icon" href="/logoBlanco-sigea.png" /><meta name="apple-mobile-web-app-capable" content="yes" /><meta name="apple-mobile-web-app-title" content="SIGEA" /></head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        
        {children}
      </body>
    </html>
  );
}


