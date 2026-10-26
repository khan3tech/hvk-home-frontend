import { describe, expect, it } from "vitest";
import { confidentFaceCount, monitoringSignal } from "@/lib/exam/monitoring";
import { exitExamFullscreen } from "@/lib/exam/fullscreen";

describe("exam face monitoring signals", () => {
  it("ignores low-confidence detections", () => {
    expect(confidentFaceCount([{ probability: 0.4 }, { probability: 0.9 }])).toBe(1);
    expect(monitoringSignal([{ probability: 0.4 }, { probability: 0.9 }])).toBeNull();
  });

  it("reports no face and multiple faces", () => {
    expect(monitoringSignal([])).toBe("NO_FACE");
    expect(monitoringSignal([{ probability: 0.9 }, { probability: 0.8 }])).toBe("MULTIPLE_FACE");
  });

  it("treats the confidence boundary as a face", () => {
    expect(confidentFaceCount([{ probability: 0.65 }])).toBe(1);
    expect(monitoringSignal([{ probability: 0.649 }])).toBe("NO_FACE");
  });

  it("exits fullscreen after submission and tolerates browser denial", async () => {
    let calls = 0;
    expect(await exitExamFullscreen({ fullscreenElement: document.createElement("div"), exitFullscreen: async () => { calls += 1; } })).toBe(true);
    expect(calls).toBe(1);
    expect(await exitExamFullscreen({ fullscreenElement: document.createElement("div"), exitFullscreen: async () => { throw new Error("denied"); } })).toBe(false);
    expect(await exitExamFullscreen({ fullscreenElement: null, exitFullscreen: async () => undefined })).toBe(false);
  });
});
