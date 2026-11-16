import Camera from "./camera";
import Link from "next/link";

export default function Page() {
  return (
    <>
      <section className="hero" aria-labelledby="home-title">
        <div className="hero-copy">
          <p className="model-tag"><span aria-hidden="true" /> YOLO11n · Modelo piloto v3</p>
          <h1 id="home-title">Inspección de <em>botellas</em></h1>
          <p>Detecta perforaciones en plástico con tu cámara o con las fotos del laboratorio.</p>
          <Link href="/fotos/" className="hero-link">Explorar fotos de prueba <span aria-hidden="true" /></Link>
        </div>
        <div className="hero-visual" aria-hidden="true">
          <div className="hero-frame" />
        </div>
      </section>
      <div className="workspace-heading">
        <h2>Detector en vivo</h2>
        <span>Procesamiento en el navegador</span>
      </div>
      <Camera />
    </>
  );
}
