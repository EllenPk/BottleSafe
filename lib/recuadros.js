export function formatConfidence(value) {
  return `${Math.round(value * 100)} %`;
}

export function paint(canvas, frame, boxes, confidence, { overlay = false, selected = null, region = null } = {}) {
  const { width, height } = frame;
  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width;
    canvas.height = height;
  }
  const ctx = canvas.getContext("2d");
  if (overlay) ctx.clearRect(0, 0, width, height);
  else ctx.drawImage(frame, 0, 0);
  if (region) {
    ctx.save();
    ctx.setLineDash([12, 8]);
    ctx.strokeStyle = "#75baff";
    ctx.lineWidth = Math.max(3, width / 300);
    ctx.strokeRect(region.left * width, region.top * height,
      (region.right - region.left) * width, (region.bottom - region.top) * height);
    ctx.restore();
  }
  const visible = boxes.filter(box => box.confidence >= confidence / 100);
  const fontSize = Math.max(17, Math.round(Math.max(width, height) * .022));
  ctx.font = `bold ${fontSize}px system-ui`;
  ctx.textBaseline = "top";
  for (const [index, box] of visible.entries()) {
    const { x1, y1, x2, y2 } = box;
    ctx.strokeStyle = "#281019";
    ctx.lineWidth = 6;
    ctx.strokeRect(x1, y1, x2 - x1, y2 - y1);
    const active = selected === index + 1;
    const accent = active ? "#75dfff" : "#ffc68b";
    ctx.strokeStyle = accent;
    ctx.lineWidth = active ? 6 : 3;
    ctx.strokeRect(x1, y1, x2 - x1, y2 - y1);
    const label = `#${index + 1} · ${formatConfidence(box.confidence)}`;
    const labelY = Math.max(0, y1 - fontSize - 8);
    ctx.fillStyle = accent;
    ctx.fillRect(x1, labelY, ctx.measureText(label).width + 12, fontSize + 8);
    ctx.fillStyle = "#281019";
    ctx.fillText(label, x1 + 6, labelY + 4);
  }
  return visible;
}
