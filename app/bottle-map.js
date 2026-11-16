"use client";

import { BOTTLE_OUTLINE, FRAME_REGION, locatePoint } from "../lib/mapa-botella";
import { formatConfidence } from "../lib/recuadros";

export default function BottleMap({
  points,
  region = FRAME_REGION,
  selected = null,
  onSelect,
  empty = "Sin perforaciones detectadas.",
}) {
  const map = points.map(point => ({ ...point, location: locatePoint(point, region) }));
  return (
    <div className="bottle-map">
      <h2>Mapa de perforaciones</h2>
      <div className="bottle-layout">
        <div className="bottle-shape">
          <div className="bottle-art" style={{ clipPath: BOTTLE_OUTLINE }} aria-hidden="true">
            <span className="bottle-scan" />
          </div>
          {map.map(({ id, location, confidence }) => {
            if (!location) return null;
            const style = { left: `${location.left}%`, top: `${location.top}%` };
            const label = `Perforación ${id}, ${location.zone.toLowerCase()}, confianza ${formatConfidence(confidence)}`;
            return onSelect
              ? <button type="button" className="bottle-marker" key={id} style={style}
                  aria-label={label} aria-pressed={selected === id} onClick={() => onSelect(id)}>{id}</button>
              : <span className="bottle-marker" key={id} style={style} aria-hidden="true">{id}</span>;
          })}
        </div>
        <div className="bottle-zones" aria-hidden="true"><span>Superior</span><span>Cuerpo</span><span>Base</span></div>
      </div>
      {map.length ? (
        <ol className="bottle-results">
          {map.map(({ id, location, confidence }) => {
            const details = <><span>#{id} · {location?.zone ?? "Fuera del encuadre"}</span><strong>{formatConfidence(confidence)}</strong></>;
            return (
              <li key={id}>
                {onSelect
                  ? <button type="button" aria-pressed={selected === id} onClick={() => onSelect(id)}>{details}</button>
                  : <div>{details}</div>}
              </li>
            );
          })}
        </ol>
      ) : <p className="note">{empty}</p>}
      <p className="note bottle-note">Posición aproximada del lado visible.</p>
    </div>
  );
}
