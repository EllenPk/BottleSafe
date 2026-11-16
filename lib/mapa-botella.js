export const FRAME_REGION = { left: 0, top: 0, right: 1, bottom: 1 };

// Contorno de la ilustración en porcentajes del área visible.
const BOTTLE_PROFILE = [
  [0, 19], [1, 22], [8, 22], [9, 19], [10, 22], [11, 19], [16, 21],
  [22, 30], [29, 44], [33, 47], [38, 48], [44, 48], [71, 44],
  [79, 44], [90, 47], [94, 46], [97, 42], [99, 35],
];
const outline = side => BOTTLE_PROFILE.map(([top, halfWidth]) => `${50 + side * halfWidth}% ${top}%`);
const base = ["21% 99.4%", "27% 99%", "35% 98.2%", "49% 99.4%", "65% 98.2%", "76% 99.4%", "81% 99.4%"];
export const BOTTLE_OUTLINE = `polygon(${[...outline(-1), ...base, ...outline(1).reverse()].join(", ")})`;

export function detectionPoints(boxes, { width, height }) {
  return boxes.map(({ x1, x2, y1, y2, confidence }, index) => ({
    id: index + 1,
    x: (x1 + x2) / (2 * width),
    y: (y1 + y2) / (2 * height),
    confidence,
  }));
}

export function locatePoint(point, region) {
  const x = (point.x - region.left) / (region.right - region.left);
  const y = (point.y - region.top) / (region.bottom - region.top);
  if (x < 0 || x > 1 || y < 0 || y > 1) return null;
  const zone = y < .28 ? "Parte superior" : y < .73 ? "Cuerpo" : "Base";
  const top = 11 + y * 86;
  const row = BOTTLE_PROFILE.findIndex(([height]) => height >= top);
  const [start, startWidth] = BOTTLE_PROFILE[row - 1];
  const [end, endWidth] = BOTTLE_PROFILE[row];
  const halfWidth = startWidth + (endWidth - startWidth) * (top - start) / (end - start);
  return { zone, left: 50 + (x * 2 - 1) * halfWidth * .82, top };
}
