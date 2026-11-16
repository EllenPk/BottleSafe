const SIZE = 512;
const STRIDE = 32;
const MIN_CONFIDENCE = 0.1;
const IOU_THRESHOLD = 0.7;

let sessionPromise;
let inferenceQueue = Promise.resolve();

function loadModel() {
  sessionPromise ??= import("onnxruntime-web/wasm").then(async ort => {
    ort.env.wasm.numThreads = 1;
    const assetRoot = new URL("/ort/", window.location.href);
    ort.env.wasm.wasmPaths = {
      mjs: new URL("ort-wasm-simd-threaded.mjs", assetRoot).href,
      wasm: new URL("ort-wasm-simd-threaded.wasm", assetRoot).href,
    };
    const session = await ort.InferenceSession.create("/modelo/botellas_piloto_v3.onnx", {
      executionProviders: ["wasm"],
    });
    return { session, Tensor: ort.Tensor };
  }).catch(error => {
    sessionPromise = undefined;
    throw error;
  });
  return sessionPromise;
}

export async function prepararModelo() {
  await loadModel();
}

function overlap(a, b) {
  const w = Math.max(0, Math.min(a.x2, b.x2) - Math.max(a.x1, b.x1));
  const h = Math.max(0, Math.min(a.y2, b.y2) - Math.max(a.y1, b.y1));
  const area = box => (box.x2 - box.x1) * (box.y2 - box.y1);
  return w * h / (area(a) + area(b) - w * h);
}

function decode(tensor, scale, padX, padY, width, height) {
  const [, fields, count] = tensor.dims;
  if (fields !== 5) throw new Error("Unexpected YOLO output shape");
  const raw = tensor.data;
  const boxes = [];
  for (let i = 0; i < count; i++) {
    const confidence = raw[4 * count + i];
    if (confidence < MIN_CONFIDENCE || !Number.isFinite(confidence)) continue;
    const x = raw[i];
    const y = raw[count + i];
    const halfW = raw[2 * count + i] / 2;
    const halfH = raw[3 * count + i] / 2;
    const box = { x1: x - halfW, x2: x + halfW, y1: y - halfH, y2: y + halfH, confidence };
    if (box.x2 > box.x1 && box.y2 > box.y1) boxes.push(box);
  }

  const selected = [];
  const clamp = (value, max) => Math.max(0, Math.min(max, value));
  for (const box of boxes.sort((a, b) => b.confidence - a.confidence)) {
    if (selected.some(previous => overlap(previous, box) > IOU_THRESHOLD)) continue;
    selected.push(box);
    if (selected.length === 300) break;
  }
  return selected.map(({ x1, y1, x2, y2, confidence }) => ({
    x1: clamp((x1 - padX) / scale, width),
    y1: clamp((y1 - padY) / scale, height),
    x2: clamp((x2 - padX) / scale, width),
    y2: clamp((y2 - padY) / scale, height),
    confidence,
  })).filter(box => box.x2 > box.x1 && box.y2 > box.y1);
}

async function predict(frame, inputCanvas) {
  const { session, Tensor } = await loadModel();
  const { width, height } = frame;
  const scale = SIZE / Math.max(width, height);
  const scaledWidth = Math.max(1, Math.round(width * scale));
  const scaledHeight = Math.max(1, Math.round(height * scale));
  const inputWidth = Math.ceil(scaledWidth / STRIDE) * STRIDE;
  const inputHeight = Math.ceil(scaledHeight / STRIDE) * STRIDE;
  const padX = Math.floor((inputWidth - scaledWidth) / 2);
  const padY = Math.floor((inputHeight - scaledHeight) / 2);
  if (inputCanvas.width !== inputWidth || inputCanvas.height !== inputHeight) {
    inputCanvas.width = inputWidth;
    inputCanvas.height = inputHeight;
  }

  const context = inputCanvas.getContext("2d", { willReadFrequently: true });
  context.fillStyle = "#727272";
  context.fillRect(0, 0, inputWidth, inputHeight);
  context.drawImage(frame, padX, padY, scaledWidth, scaledHeight);
  const { data } = context.getImageData(0, 0, inputWidth, inputHeight);
  const pixels = inputWidth * inputHeight;
  const input = new Float32Array(3 * pixels);
  for (let i = 0; i < pixels; i++) {
    const index = 4 * i;
    const gray = Math.round(.299 * data[index] + .587 * data[index + 1] + .114 * data[index + 2]) / 255;
    input[i] = input[i + pixels] = input[i + 2 * pixels] = gray;
  }

  const tensor = new Tensor("float32", input, [1, 3, inputHeight, inputWidth]);
  let outputs;
  try {
    outputs = await session.run({ [session.inputNames[0]]: tensor });
    return decode(outputs[session.outputNames[0]], scale, padX, padY, width, height);
  } finally {
    tensor.dispose();
    if (outputs) Object.values(outputs).forEach(output => output.dispose());
  }
}

export function detectarPerforaciones(frame, inputCanvas, isCurrent) {
  const result = inferenceQueue.then(() => isCurrent() ? predict(frame, inputCanvas) : []);
  inferenceQueue = result.catch(() => {});
  return result;
}
