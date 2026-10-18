import { describe, expect, it } from "vitest";
import { confidentFaceCount, monitoringSignal } from "@/lib/exam/monitoring";

describe("exam face monitoring signals", () => {
  it("ignores low-confidence detections", () => {
    expect(confidentFaceCount([{ probability: 0.4 }, { probability: 0.9 }])).toBe(1);
    expect(monitoringSignal([{ probability: 0.4 }, { probability: 0.9 }])).toBeNull();
  });

  it("reports no face and multiple faces", () => {
    expect(monitoringSignal([])).toBe("NO_FACE");
    expect(monitoringSignal([{ probability: 0.9 }, { probability: 0.8 }])).toBe("MULTIPLE_FACE");
  });
});
