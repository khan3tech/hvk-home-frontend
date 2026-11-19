import { monitoringSignal } from "./monitoring";

/**
 * Browser pieces of a proctored course or domain exam (QA item 8): camera with on-device face checks, a shared
 * entire screen, and fullscreen. Nothing is recorded or uploaded. Kept in one object so tests can replace it.
 */
export interface FaceDetector {
  /** "NO_FACE", "MULTIPLE_FACE" or null when exactly one face is seen. */
  check(video: HTMLVideoElement): Promise<"NO_FACE" | "MULTIPLE_FACE" | null>;
}

export const proctoring = {
  async requestCamera(): Promise<MediaStream> {
    if (!navigator.mediaDevices?.getUserMedia) throw new Error("This browser has no camera access. Use Chrome or Edge on a computer.");
    return navigator.mediaDevices.getUserMedia({ video: { facingMode: "user" }, audio: false });
  },

  /** Asks to share the screen; only the entire screen is accepted. */
  async requestScreen(): Promise<MediaStream> {
    if (!navigator.mediaDevices?.getDisplayMedia) throw new Error("This browser cannot share the screen. Use Chrome or Edge on a computer.");
    const stream = await navigator.mediaDevices.getDisplayMedia({ video: { displaySurface: "monitor" } as MediaTrackConstraints, audio: false });
    const surface = (stream.getVideoTracks()[0]?.getSettings() as { displaySurface?: string } | undefined)?.displaySurface;
    if (surface && surface !== "monitor") {
      stream.getTracks().forEach((t) => t.stop());
      throw new Error('Please choose "Entire screen" when sharing, not a window or a tab.');
    }
    return stream;
  },

  async loadFaceDetector(): Promise<FaceDetector> {
    const tf = await import("@tensorflow/tfjs-core");
    await import("@tensorflow/tfjs-backend-webgl");
    await import("@tensorflow/tfjs-backend-cpu");
    await tf.setBackend("webgl").catch(() => tf.setBackend("cpu"));
    await tf.ready();
    const { load } = await import("@tensorflow-models/blazeface");
    const model = await load();
    return { check: async (video) => monitoringSignal(await model.estimateFaces(video, false)) };
  },

  async enterFullscreen(): Promise<void> {
    if (!document.documentElement.requestFullscreen) throw new Error("This browser cannot open fullscreen.");
    await document.documentElement.requestFullscreen();
  },

  async exitFullscreen(): Promise<void> {
    if (document.fullscreenElement) await document.exitFullscreen().catch(() => undefined);
  },

  isFullscreen(): boolean {
    return Boolean(document.fullscreenElement);
  },

  stop(stream: MediaStream | null | undefined): void {
    stream?.getTracks().forEach((t) => t.stop());
  },
};

/** Face warnings allowed before the exam is ended. */
export const MAX_FACE_WARNINGS = 3;
