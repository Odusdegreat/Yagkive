import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";
import { Toaster } from "sonner";
import { TooltipProvider } from "@/components/ui/tooltip";

export const metadata: Metadata = {
  title: "YAGKIVE — Technical Archive Storefront",
  description:
    "Field-tested, archive-grade utility garments. Catalogue 04 now open.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body><TooltipProvider delayDuration={200}>{children}<Toaster theme="dark" position="bottom-right" richColors closeButton /></TooltipProvider></body>
    </html>
  );
}
