"use client";

import { useEffect, useRef, useState } from "react";
import { detectarPerforaciones } from "../lib/yolo";
import { paint } from "../lib/recuadros";
import { FRAME_REGION, detectionPoints } from "../lib/mapa-botella";
import BottleMap from "./bottle-map";

const REGION_CONTROLS = [
  ["top", "Parte superior", "bottom", false],
  ["bottom", "Base", "top", true],
  ["left", "Borde izquierdo", "right", false],
  ["right", "Borde derecho", "left", true],
];

const SAMPLE_GROUPS = [
  { id: "perforadas", label: "Botella perforada", prefix: "perforada", count: 8 },
  { id: "intactas", label: "Botella intacta", prefix: "intacta", count: 5 },
].map(group => ({
  ...group,
  items: Array.from({ length: group.count }, (_, index) => ({
    id: `${group.prefix}-${index + 1}`,
    label: `Vista ${index + 1}`,
    title: `${group.label} · vista ${index + 1}`,
    type: "sample",
    url: `/muestras/${group.prefix}-${index + 1}.jpg`,
  })),
}));

export default function Inspection() {
  const canvas = useRef(null);
  const fileInput = useRef(null);
  const lastStill = useRef(null);
  const confidenceRef = useRef(25);
  const [confidence, setConfidence] = useState(25);
  const [source, setSource] = useState(SAMPLE_GROUPS[0].items[0]);
  const [result, setResult] = useState(null);
  const [selected, setSelected] = useState(null);
  const [region, setRegion] = useState(FRAME_REGION);
  const activeResult = result?.source === source ? result : null;

  useEffect(() => {
    let cancelled = false;
    let objectUrl;
    let errorMessage = "No se pudo leer la imagen. Prueba con un archivo JPG o PNG.";

    async function inspect() {
      const image = new Image();
      if (source.type === "file") objectUrl = URL.createObjectURL(source.file);
      image.src = objectUrl ?? source.url;
      await image.decode();
      if (cancelled) return;

      errorMessage = "No se pudo ejecutar YOLO. Selecciona otra muestra para reintentar.";
      const snapshot = document.createElement("canvas");
      const scale = Math.min(1, 1600 / Math.max(image.naturalWidth, image.naturalHeight));
      snapshot.width = Math.max(1, Math.round(image.naturalWidth * scale));
      snapshot.height = Math.max(1, Math.round(image.naturalHeight * scale));
      snapshot.getContext("2d").drawImage(image, 0, 0, snapshot.width, snapshot.height);

      const modelInput = document.createElement("canvas");
      const boxes = await detectarPerforaciones(snapshot, modelInput, () => !cancelled);
      if (cancelled) return;
      lastStill.current = { source, snapshot, boxes };
      const visible = paint(canvas.current, snapshot, boxes, confidenceRef.current);
      setResult({ source, points: detectionPoints(visible, snapshot) });
    }

    inspect().catch(error => {
      if (cancelled) return;
      console.error(error);
      setResult({ source, error: errorMessage });
    });
    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [source]);

  function redraw(value, selectedPoint, bounds) {
    const still = lastStill.current;
    if (still?.source !== source) return;
    const visible = paint(canvas.current, still.snapshot, still.boxes, value, {
      selected: selectedPoint,
      region: bounds === FRAME_REGION ? null : bounds,
    });
    setResult({ source, points: detectionPoints(visible, still.snapshot) });
  }

  function changeConfidence(event) {
    const value = Number(event.target.value);
    confidenceRef.current = value;
    setConfidence(value);
    setSelected(null);
    redraw(value, null, region);
  }

  function chooseSource(next) {
    if (next === source) return;
    setSelected(null);
    setRegion(FRAME_REGION);
    setSource(next);
  }

  function upload(event) {
    const [file] = event.target.files;
    if (file) chooseSource({ type: "file", file });
    event.target.value = "";
  }

  function selectPoint(id) {
    const next = selected === id ? null : id;
    setSelected(next);
    redraw(confidence, next, region);
  }

  function changeRegion(bounds) {
    setRegion(bounds);
    redraw(confidence, selected, bounds);
  }

  const sourceLabel = source.title ?? source.file.name;
  const isReady = activeResult && !activeResult.error;
  const status = activeResult?.error ?? "Analizando imagen con YOLO…";

  return (
    <>
      <div className="workbench">
        <section className="viewer" id="visor" aria-label="Vista de inspección">
          <div className="viewer-bar">
            <h2>Vista de inspección</h2>
            <span title={sourceLabel}>{sourceLabel}</span>
          </div>
          <div className="stage">
            <canvas ref={canvas} hidden={!isReady} aria-label="Imagen inspeccionada con recuadros" role="img" />
            {!isReady && <p className="stage-message" role="status">{status}</p>}
          </div>
        </section>
        <aside className="panel" aria-label="Controles y detecciones">
          <div className="panel-section">
            <h2>Foto</h2>
            <div className="source-buttons">
              <input ref={fileInput} type="file" accept="image/*" onChange={upload} hidden />
              <button className="primary" type="button" onClick={() => fileInput.current.click()}>Abrir una foto</button>
            </div>
          </div>
          <div className="panel-section">
            <div className="range-label">
              <label htmlFor="confidence">Confianza mínima</label>
              <output htmlFor="confidence">{confidence} %</output>
            </div>
            <input id="confidence" type="range" min="10" max="75" value={confidence}
              aria-valuetext={`${confidence} %`} onChange={changeConfidence} />
          </div>
          <div className="panel-section" id="resultado">
            <h2>Resultado de la foto</h2>
            <p className="count" aria-live="polite">
              <strong>{isReady ? activeResult.points.length : "—"}</strong>
              {isReady && activeResult.points.length === 1 ? " detección" : " detecciones"}
            </p>
            {isReady && (
              <BottleMap points={activeResult.points} region={region} selected={selected} onSelect={selectPoint} />
            )}
            {isReady && (
              <details className="bottle-calibration">
                <summary>Ajustar encuadre de la botella</summary>
                <p className="note">Alinea el recuadro azul con la botella para ubicar mejor los puntos.</p>
                {REGION_CONTROLS.map(([key, label, opposite, isEnd]) => (
                  <label key={key}>{label}
                    <input type="range" min={isEnd ? Math.round(region[opposite] * 100) + 10 : 0}
                      max={isEnd ? 100 : Math.round(region[opposite] * 100) - 10}
                      value={Math.round(region[key] * 100)}
                      onFocus={() => {
                        if (region === FRAME_REGION) changeRegion({ ...FRAME_REGION });
                      }}
                      onChange={event => changeRegion({ ...region, [key]: Number(event.target.value) / 100 })} />
                  </label>
                ))}
                <button type="button" onClick={() => changeRegion(FRAME_REGION)}>Restablecer encuadre</button>
              </details>
            )}
            <p className="note">El piloto puede pasar por alto perforaciones. Una vista sin recuadros no confirma que la botella esté intacta.</p>
          </div>
        </aside>
      </div>
        <section className="samples" id="muestras" aria-labelledby="samples-title">
          <div className="samples-header">
            <h2 id="samples-title">Fotos de la prueba</h2>
            <a href="#visor">Ver imagen analizada ↑</a>
          </div>
          {SAMPLE_GROUPS.map(group => (
            <section className="sample-group" key={group.id} aria-labelledby={group.id}>
              <h3 id={group.id}>{group.label}</h3>
              <div className="sample-grid">
                {group.items.map(item => (
                  <button type="button" className="sample" key={item.id}
                    aria-label={item.title} aria-pressed={source === item} onClick={() => chooseSource(item)}>
                    <img src={item.url} alt="" width="120" height="96" loading="lazy" />
                    <span>{item.label}</span>
                  </button>
                ))}
              </div>
            </section>
          ))}
        </section>
    </>
  );
}
