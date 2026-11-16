import Link from "next/link";

export const metadata = { title: "Cómo funciona" };

export default function ProjectPage() {
  return (
    <article className="project">
      <header className="intro">
        <h1>Cómo funciona</h1>
        <p>Inspección visual de perforaciones en botellas plásticas con un modelo YOLO11n.</p>
      </header>
      <section className="project-section" aria-labelledby="process">
        <h2 id="process">De la imagen a la detección</h2>
        <ol className="process-list">
          <li><strong>Capturar</strong><p>La página toma un fotograma de la cámara o lee una foto seleccionada.</p></li>
          <li><strong>Preparar</strong><p>Convierte la imagen a escala de grises y ajusta su tamaño para que el modelo analice la forma y los bordes del plástico.</p></li>
          <li><strong>Detectar</strong><p>YOLO11n propone recuadros y asigna una puntuación de confianza a cada posible perforación.</p></li>
          <li><strong>Mostrar</strong><p>La página dibuja los recuadros que superan el umbral elegido y muestra cuántas detecciones quedan.</p></li>
        </ol>
      </section>
      <section className="project-section" aria-labelledby="training">
        <h2 id="training">Entrenamiento y prueba</h2>
        <p>Ajustamos la versión actual del modelo con 30 fotos. Las perforaciones visibles se etiquetaron a mano. Las fotos de la botella intacta usada para el ajuste quedaron sin recuadros.</p>
        <p>En cuatro tomas reservadas de la última tanda, el modelo encuadró los cinco agujeros anotados y dio cero falsas alarmas en las dos tomas intactas. Usamos una confianza mínima del 25 %. Esta prueba mide el desempeño con ángulos nuevos de las botellas del proyecto. Para medir cómo generaliza, hace falta probar botellas físicas nuevas.</p>
      </section>
      <section className="project-section" aria-labelledby="interpretation">
        <h2 id="interpretation">Cómo leer el resultado</h2>
        <p>La confianza es la puntuación que YOLO da a un recuadro. Un umbral más bajo puede mostrar más candidatos y generar más falsas alarmas. Una imagen sin recuadros puede contener perforaciones que el modelo pasó por alto.</p>
        <p>La cámara y las fotos se procesan en tu navegador. Los fotogramas y las fotos que abres permanecen en tu dispositivo.</p>
      </section>
      <div className="project-actions">
        <Link href="/">Probar con la cámara</Link>
        <Link href="/fotos/">Ver fotos y resultados</Link>
      </div>
    </article>
  );
}
