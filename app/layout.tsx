import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Archivo_Black, Inter, Space_Mono, Geist } from "next/font/google";
import "./globals.css";
import { cn } from "@/lib/utils";

const geist = Geist({subsets:['latin'],variable:'--font-sans'});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const archivo = Archivo_Black({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-archivo",
  display: "swap",
});

const spaceMono = Space_Mono({
  weight: ["400", "700"],
  subsets: ["latin"],
  variable: "--font-space-mono",
  display: "swap",
});

export const metadata: Metadata = {
  title: "YAGKIVE — Technical Archive Storefront",
  description:
    "Field-tested, archive-grade utility garments. Catalogue 04 now open.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={cn("font-sans", geist.variable)}>
      <body
        className={`${inter.variable} ${archivo.variable} ${spaceMono.variable}`}
      >
        {children}
      </body>
    </html>
  );
}
