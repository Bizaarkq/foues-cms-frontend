import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "FOUES",
  description: "Facultad Multidisciplinaria Oriental — Universidad de El Salvador",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" data-theme="cerberus" className="h-full">
      <body className="min-h-full flex flex-col bg-white">{children}</body>
    </html>
  );
}
