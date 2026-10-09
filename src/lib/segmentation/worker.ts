import {
  AutoImageProcessor,
  AutoModelForSemanticSegmentation,
  RawImage,
} from "@huggingface/transformers";
import { summariseLogits } from "./logits";
import type { DetectRequest, DetectResponse, SegmentationDevice } from "./protocol";

// SegFormer-B0 trained on ADE20K, which has a "floor" class.
const MODEL = "Xenova/segformer-b0-finetuned-ade-512-512";
const FLOOR_LABEL = "floor";

type Segmenter = {
  model: Awaited<ReturnType<typeof AutoModelForSemanticSegmentation.from_pretrained>>;
  processor: Awaited<ReturnType<typeof AutoImageProcessor.from_pretrained>>;
  device: SegmentationDevice;
  labels: readonly string[];
  floorClass: number;
};

// The project compiles against the DOM types, so describe the worker scope by hand.
type WorkerScope = {
  postMessage(message: DetectResponse, transfer?: Transferable[]): void;
  addEventListener(type: "message", listener: (event: MessageEvent<DetectRequest>) => void): void;
};
const scope = self as unknown as WorkerScope;

const segmenters = new Map<SegmentationDevice | "auto", Promise<Segmenter>>();

async function hasWebGPU(): Promise<boolean> {
  const gpu: unknown = Reflect.get(navigator, "gpu");
  if (typeof gpu !== "object" || gpu === null) return false;
  const requestAdapter: unknown = Reflect.get(gpu, "requestAdapter");
  if (typeof requestAdapter !== "function") return false;
  try {
    const adapter: unknown = await requestAdapter.call(gpu);
    return adapter !== null && adapter !== undefined;
  } catch {
    return false;
  }
}

function readLabels(id2label: unknown): string[] {
  if (typeof id2label !== "object" || id2label === null) return [];
  const labels: string[] = [];
  for (const [id, label] of Object.entries(id2label)) {
    if (typeof label === "string") labels[Number(id)] = label;
  }
  return labels;
}

async function loadOn(device: SegmentationDevice): Promise<Segmenter> {
  const [model, processor] = await Promise.all([
    // Full precision on the GPU; the smaller 8-bit model on the CPU.
    AutoModelForSemanticSegmentation.from_pretrained(MODEL, {
      device,
      dtype: device === "webgpu" ? "fp32" : "q8",
    }),
    AutoImageProcessor.from_pretrained(MODEL),
  ]);
  // The label map is in the model's config file but not in the library's types.
  const labels = readLabels(Reflect.get(model.config, "id2label"));
  const floorClass = labels.indexOf(FLOOR_LABEL);
  if (floorClass < 0) throw new Error(`Model has no "${FLOOR_LABEL}" class`);
  return { model, processor, device, labels, floorClass };
}

async function load(device: SegmentationDevice | undefined): Promise<Segmenter> {
  if (device) return loadOn(device);
  if (await hasWebGPU()) {
    try {
      return await loadOn("webgpu");
    } catch {
      // Fall through to WASM: an adapter exists but the model could not start on it.
    }
  }
  return loadOn("wasm");
}

function toRawImage(photo: ImageBitmap): RawImage {
  const canvas = new OffscreenCanvas(photo.width, photo.height);
  const context = canvas.getContext("2d");
  if (!context) throw new Error("2D canvas is unavailable in the worker");
  context.drawImage(photo, 0, 0);
  const { data, width, height } = context.getImageData(0, 0, photo.width, photo.height);
  return new RawImage(data, width, height, 4);
}

async function detect({ id, photo, device }: DetectRequest): Promise<void> {
  const key = device ?? "auto";
  try {
    const loadStart = performance.now();
    let loading = segmenters.get(key);
    const alreadyLoaded = loading !== undefined;
    if (!loading) {
      loading = load(device);
      segmenters.set(key, loading);
    }
    const segmenter = await loading;
    const loadMs = alreadyLoaded ? 0 : performance.now() - loadStart;

    const inferenceStart = performance.now();
    const inputs = await segmenter.processor(toRawImage(photo));
    const { logits } = await segmenter.model(inputs);
    // Shape is [1, classes, height, width]; the model outputs a quarter of its input size.
    const [, classCount = 0, maskHeight = 0, maskWidth = 0] = logits.dims;
    const { probability, classes } = summariseLogits(
      logits.data,
      classCount,
      segmenter.floorClass,
      (index) => segmenter.labels[index] ?? `class ${index}`,
    );
    const inferenceMs = performance.now() - inferenceStart;

    scope.postMessage(
      {
        id,
        ok: true,
        mask: probability,
        maskWidth,
        maskHeight,
        device: segmenter.device,
        loadMs,
        inferenceMs,
        classes,
      },
      [probability.buffer],
    );
  } catch (error) {
    // A failed model load should be retried on the next request.
    segmenters.delete(key);
    scope.postMessage({ id, ok: false, error: error instanceof Error ? error.message : String(error) });
  } finally {
    photo.close();
  }
}

scope.addEventListener("message", (event) => {
  void detect(event.data);
});
