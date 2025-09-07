import type { Metadata } from "next";
import "./globals.css";
import { PrinterStateProvider } from "@/lib/printerState";

export const metadata: Metadata = {
  title: "PrintMate",
  description: "",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <PrinterStateProvider>
          {children}
        </PrinterStateProvider>
      </body>
    </html>
  );
}
