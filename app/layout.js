import Link from "next/link";
import Navigation from "./navigation";
import "./globals.css";

export const metadata = {
  title: { default: "BottleSafe | Inspección de botellas", template: "%s | BottleSafe" },
  description: "BottleSafe es un prototipo universitario de inspección visual de botellas con fotos y cámara.",
  icons: { icon: "/bottlesafe-icon.png" },
};

export default function Layout({ children }) {
  return (
    <html lang="es">
      <body>
        <header className="site-header">
          <div className="header-inner">
            <Link className="brand" href="/">
              <img className="brand-mark" src="/bottlesafe-icon.png" alt="" width="46" height="46" />
              <span>Bottle<strong>Safe</strong></span>
            </Link>
            <Navigation />
          </div>
        </header>
        <main className="content">{children}</main>
      </body>
    </html>
  );
}
