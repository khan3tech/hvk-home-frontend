export const FACE_CONFIDENCE_THRESHOLD = 0.65;

export function confidentFaceCount(faces: Array<{ probability?: unknown }> = []): number {
  return faces.filter((face) => {
    const raw = face.probability;
    const probability = Array.isArray(raw) ? Number(raw[0]) : typeof raw === "number" ? raw : Number.NaN;
    return !Number.isFinite(probability) || probability >= FACE_CONFIDENCE_THRESHOLD;
  }).length;
}

export function monitoringSignal(faces: Array<{ probability?: unknown }> = []): "NO_FACE" | "MULTIPLE_FACE" | null {
  const count = confidentFaceCount(faces);
  return count === 1 ? null : count === 0 ? "NO_FACE" : "MULTIPLE_FACE";
}
