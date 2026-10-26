import { parseQuestionJson } from "./question-import";
import { parseQuestionText } from "./question-text";

/** Largest file the admin page will read (a 120-question PDF is about 60 KB). */
export const MAX_QUESTION_FILE_BYTES = 5 * 1024 * 1024;
export const QUESTION_FILE_ACCEPT = ".pdf,.txt,.json,application/pdf,text/plain,application/json";

/** Reads a PDF, text or JSON file into validated questions; throws a readable Error if it cannot. */
export async function questionsFromFile(file: File) {
  if (file.size > MAX_QUESTION_FILE_BYTES) throw new Error("That file is too large. Use a file under 5 MB.");
  const name = file.name.toLowerCase();

  if (name.endsWith(".json")) return parseQuestionJson(await file.text());

  let text: string;
  if (name.endsWith(".pdf")) {
    const { pdfToText } = await import("./pdf-text");
    try {
      text = await pdfToText(await file.arrayBuffer());
    } catch {
      throw new Error("That PDF could not be read. Scanned or image-only PDFs are not supported; use a text PDF or paste JSON.");
    }
  } else if (name.endsWith(".txt")) {
    text = await file.text();
  } else {
    throw new Error("Use a PDF, TXT or JSON file.");
  }

  const { questions, problems } = parseQuestionText(text);
  if (questions.length === 0) {
    throw new Error(problems[0] ?? 'No questions found. Each question needs "1. text", options "A. …" to "D. …" and a "Correct answer: X" line.');
  }
  if (problems.length > 0) {
    throw new Error(`${problems.length} question${problems.length === 1 ? "" : "s"} could not be read, so nothing was imported. First problem: ${problems[0]}`);
  }
  return parseQuestionJson(JSON.stringify({ questions }));
}
