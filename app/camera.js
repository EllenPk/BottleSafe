"use client";

import { useEffect, useRef, useState } from "react";
import { detectarPerforaciones, prepararModelo } from "../lib/yolo";
import { paint } from "../lib/recuadros";
import { detectionPoints } from "../lib/mapa-botella";
import BottleMap from "./bottle-map";

const INTERVAL_MS = 125;
const MAX_CAPTURE_SIDE = 768;

export default function Camera() {
  const videoRef = useRef(null);
  const overlayRef = useRef(null);
  const confidenceRef = useRef(25);
  const [confidence, setConfidence] = useState(25);
  const [cameraOn, setCameraOn] = useState(false);
  const [ready, setReady] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [preparing, setPreparing] = useState(false);
  const [cameraError, setCameraError] = useState("");
  const [modelError, setModelError] = useState("");
  const [points, setPoints] = useState(null);
  const count = points?.length ?? null;

  useEffect(() => {
    if (!cameraOn) return;
    let cancelled = false;
    let stream;
    const video = videoRef.current;
    const stopStream = () => stream?.getTracks().forEach(track => track.stop());

    function lostCamera() {
      if (cancelled) return;
      setCameraError("Se desconectó la cámara. Puedes volver a encenderla.");
      setReady(false);
      setAnalyzing(false);
      setCameraOn(false);
    }

    async function connect() {
      if (!navigator.mediaDevices?.getUserMedia) {
        throw new Error("La cámara requiere HTTPS o localhost.");
      }
      stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: "environment" }, width: { ideal: 960 }, height: { ideal: 720 } },
        audio: false,
      });
      if (cancelled) {
        stopStream();
        return;
      }
      stream.getVideoTracks().forEach(track => track.addEventListener("ended", lostCamera));
      video.srcObject = stream;
      await video.play();
      if (!cancelled) setReady(true);
    }

    connect().catch(error => {
      if (cancelled) return;
      setCameraError(!navigator.mediaDevices?.getUserMedia
        ? error.message
        : "No se pudo abrir la cámara. Revisa los permisos del navegador.");
      setCameraOn(false);
    });

    return () => {
      cancelled = true;
      stream?.getVideoTracks().forEach(track => track.removeEventListener("ended", lostCamera));
      stopStream();
      video.srcObject = null;
    };
  }, [cameraOn]);

  useEffect(() => {
    if (!ready) return;
    let cancelled = false;
    // The browser can play video while the inference session is loading.
    prepararModelo().catch(error => console.error(error)).finally(() => {
      if (!cancelled) setPreparing(false);
    });
    return () => { cancelled = true; };
  }, [ready]);

  useEffect(() => {
    if (!ready || !analyzing) return;
    let cancelled = false;
    let timer;
    const video = videoRef.current;
    const snapshot = document.createElement("canvas");
    const input = document.createElement("canvas");
    const snapshotContext = snapshot.getContext("2d");

    async function inspect() {
      if (cancelled) return;
      try {
        if (video.readyState >= 2 && video.videoWidth && video.videoHeight) {
          const scale = Math.min(1, MAX_CAPTURE_SIDE / Math.max(video.videoWidth, video.videoHeight));
          const width = Math.max(1, Math.round(video.videoWidth * scale));
          const height = Math.max(1, Math.round(video.videoHeight * scale));
          if (snapshot.width !== width || snapshot.height !== height) {
            snapshot.width = width;
            snapshot.height = height;
          }
          snapshotContext.drawImage(video, 0, 0, width, height);
          const boxes = await detectarPerforaciones(snapshot, input, () => !cancelled);
          if (cancelled) return;
          const visible = paint(overlayRef.current, snapshot, boxes, confidenceRef.current, { overlay: true });
          setPoints(detectionPoints(visible, snapshot));
        }
        timer = setTimeout(inspect, INTERVAL_MS);
      } catch (error) {
        if (cancelled) return;
        console.error(error);
        setModelError("No se pudo ejecutar YOLO. Pulsa Iniciar detección para reintentar.");
        setAnalyzing(false);
      }
    }

    void inspect();
    return () => {
      cancelled = true;
      clearTimeout(timer);
      const overlay = overlayRef.current;
      overlay?.getContext("2d").clearRect(0, 0, overlay.width, overlay.height);
    };
  }, [ready, analyzing]);

  function openCamera() {
    setCameraError("");
    setModelError("");
    setPreparing(true);
    setCameraOn(true);
  }

  function closeCamera() {
    setCameraOn(false);
    setReady(false);
    setAnalyzing(false);
    setPoints(null);
    setModelError("");
  }

  function toggleAnalysis() {
    setModelError("");
    setPoints(null);
    setAnalyzing(!analyzing);
  }

  function changeConfidence(event) {
    const value = Number(event.target.value);
    confidenceRef.current = value;
    setConfidence(value);
  }

  const previewStatus = cameraError || (cameraOn ? "Abriendo cámara…" : "Enciende la cámara para comenzar.");
  let detectionStatus = "Centra la botella, con la tapa y la base visibles, y pulsa Iniciar detección.";
  if (!ready) detectionStatus = "La cámara debe estar encendida.";
  else if (modelError) detectionStatus = modelError;
  else if (preparing) detectionStatus = "Preparando el modelo YOLO…";
  else if (analyzing && count === null) detectionStatus = "Analizando el primer fotograma…";
  else if (analyzing) detectionStatus = "El conteo se actualiza con cada fotograma analizado.";

  return (
    <div className="workbench">
      <section className="viewer" aria-label="Vista de inspección">
        <div className="viewer-bar">
          <h2>Vista de inspección</h2>
          <span className={ready ? "camera-status is-live" : "camera-status"}>{ready ? "Cámara en vivo" : "Cámara apagada"}</span>
        </div>
        <div className="stage camera-stage">
          <video ref={videoRef} muted playsInline autoPlay hidden={!ready} aria-label="Vista en vivo de la cámara" />
          <canvas ref={overlayRef} hidden={!ready || !analyzing || count === null} aria-hidden="true" />
          {!ready && (
            <div className="camera-empty">
              <div className="viewfinder" aria-hidden="true"><span className="camera-glyph" /></div>
              <p className="stage-message" role="status">{previewStatus}</p>
            </div>
          )}
        </div>
      </section>
      <aside className="panel" aria-label="Controles y detecciones">
        <div className="panel-section">
          <h2>Cámara</h2>
          <div className="source-buttons">
            {!cameraOn ? (
              <button className="primary" type="button" onClick={openCamera}>Encender cámara</button>
            ) : (
              <>
                {ready && <button className="primary" type="button" onClick={toggleAnalysis}>
                  {analyzing ? "Pausar detección" : "Iniciar detección"}
                </button>}
                <button type="button" onClick={closeCamera}>{ready ? "Cerrar cámara" : "Cancelar apertura"}</button>
              </>
            )}
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
        <div className="panel-section">
          <h2>Detecciones por fotograma</h2>
          {analyzing && count !== null && <p className="count">
            <strong>{count}</strong>{count === 1 ? " detección" : " detecciones"}
          </p>}
          <p className="note" role="status">{detectionStatus}</p>
          {analyzing && points !== null && <BottleMap points={points} />}
        </div>
      </aside>
    </div>
  );
}
