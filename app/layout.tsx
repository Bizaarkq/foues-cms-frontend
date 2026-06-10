import type { Metadata } from "next";
import "./globals.css";
import { ThemeVars } from "@/components/ThemeVars";
import { ThemeToggle } from "@/components/ThemeToggle";
import { SessionProviderWrapper } from "@/components/SessionProviderWrapper";

export const metadata: Metadata = {
  title: "FOUES",
  description: "Facultad de Odontología — Universidad de El Salvador",
};

// Pre-paint script (FR-04 / NFR-02): runs synchronously before first paint,
// reads the persisted preference and sets data-foues-theme='dark' so dark mode
// shows with no flash. try/catch swallows SSR / private-browsing errors.
const PREPAINT =
  "(function(){try{var t=localStorage.getItem('foues-theme');if(t==='dark')document.documentElement.dataset.fouesTheme='dark'}catch(e){}})()";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      data-theme="cerberus"
      className="h-full"
      suppressHydrationWarning
    >
      <head>
        {/* Order (FR-04): pre-paint script first (sets dark attribute before
            paint), then ThemeVars (defines the CSS vars for both palettes). */}
        <script
          dangerouslySetInnerHTML={{ __html: PREPAINT }}
          suppressHydrationWarning
        />
        <ThemeVars />
      </head>
      <body className="min-h-full flex flex-col bg-[var(--color-foues-surface)]">
        <SessionProviderWrapper>
          {children}
        </SessionProviderWrapper>
        <ThemeToggle />
      </body>
    </html>
  );
}
