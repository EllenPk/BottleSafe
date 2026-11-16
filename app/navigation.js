"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const pages = [
  { href: "/", label: "Detector en vivo", icon: "◉" },
  { href: "/fotos/", label: "Fotos y resultados", icon: "▧" },
  { href: "/proyecto/", label: "Cómo funciona", icon: "▤" },
];

export default function Navigation() {
  const pathname = usePathname().replace(/\/$/, "");
  return (
    <nav className="nav" aria-label="Secciones de BottleSafe">
      {pages.map(page => (
        <Link href={page.href} key={page.href} aria-current={pathname === page.href.replace(/\/$/, "") ? "page" : undefined}>
          <span aria-hidden="true">{page.icon}</span>{page.label}
        </Link>
      ))}
    </nav>
  );
}
