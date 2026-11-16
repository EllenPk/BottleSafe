import Inspection from "../inspection";

export const metadata = { title: "Fotos y resultados" };

export default function PhotosPage() {
  return (
    <>
      <div className="intro">
        <h1>Fotos y resultados</h1>
        <p>Selecciona una muestra o abre una foto para ver los recuadros y la confianza de cada detección.</p>
      </div>
      <Inspection />
    </>
  );
}
