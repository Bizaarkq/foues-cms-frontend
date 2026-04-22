/**
 * DefaultLayout — standard page wrapper with Navbar and Footer.
 * Used for layout: "default" pages (centered content, max-width container).
 */

import type { NavbarData, FooterData } from "@/types/page";
import { Navbar } from "./Navbar";
import { Footer } from "./Footer";

interface DefaultLayoutProps {
  navbar: NavbarData;
  footer: FooterData;
  children: React.ReactNode;
}

export function DefaultLayout({ navbar, footer, children }: DefaultLayoutProps) {
  return (
    <>
      <Navbar navbar={navbar} />
      <main className="flex-1 mx-auto w-full max-w-7xl px-4 py-8">
        {children}
      </main>
      <Footer footer={footer} />
    </>
  );
}
