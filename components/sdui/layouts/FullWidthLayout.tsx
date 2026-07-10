/**
 * FullWidthLayout — page wrapper with Navbar and Footer, no max-width constraint on content.
 * Used for layout: "full-width" pages (hero sections, landing pages, etc.).
 */

import type { NavbarData, FooterData } from "@/types/page";
import { Navbar } from "./Navbar";
import { Footer } from "./Footer";
import { MobileBottomNav } from "./MobileBottomNav";

interface FullWidthLayoutProps {
  navbar: NavbarData;
  footer: FooterData;
  children: React.ReactNode;
}

export function FullWidthLayout({ navbar, footer, children }: FullWidthLayoutProps) {
  return (
    <>
      <Navbar navbar={navbar} />
      <main className="flex-1 w-full">
        {children}
      </main>
      <Footer footer={footer} />
      <MobileBottomNav navbar={navbar} />
    </>
  );
}
