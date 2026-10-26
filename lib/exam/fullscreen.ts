export async function exitExamFullscreen(documentLike: Pick<Document, "fullscreenElement" | "exitFullscreen"> | undefined = typeof document === "undefined" ? undefined : document): Promise<boolean> {
  if (!documentLike?.fullscreenElement || typeof documentLike.exitFullscreen !== "function") return false;
  try {
    await documentLike.exitFullscreen();
    return true;
  } catch {
    return false;
  }
}
