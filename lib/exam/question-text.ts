/**
 * Turns plain question-bank text (typed, or extracted from a PDF) into the same JSON shape the bulk
 * import accepts. Expected layout, repeated for every question:
 *
 *   1. Which declaration identifies an HTML5 document?
 *   A. <!DOCTYPE html>
 *   B. <html5>
 *   C. ...
 *   D. ...
 *   Correct answer: A — optional explanation
 *
 * Headings (for example a course name) and page footers between questions are ignored.
 */
export interface ParsedQuestion {
  id: string;
  prompt: string;
  marks: number;
  options: { id: string; label: string; isCorrect: boolean }[];
}

const QUESTION = /^(\d+)\s*[.)]\s+(.*)$/;
const OPTION = /^\(?([A-Ha-h])[.)]\s+(.*)$/;
const ANSWER = /^(?:correct\s+)?(?:answer|ans)\s*[:\-]\s*\(?([A-Ha-h])\b/i;
const NOISE = /^(?:page\s+\d+(?:\s+of\s+\d+)?|\d+\s*\/\s*\d+)$/i;

export function parseQuestionText(text: string): { questions: ParsedQuestion[]; problems: string[] } {
  const questions: ParsedQuestion[] = [];
  const problems: string[] = [];
  let current: { number: number; prompt: string; options: { letter: string; label: string }[]; answer: string | null } | null = null;
  // Where continuation lines (wrapped text) are appended: the prompt, the last option, or nowhere after the answer.
  let target: "prompt" | "option" | "none" = "none";

  const finish = () => {
    if (!current) return;
    const label = `Question ${current.number} ("${current.prompt.slice(0, 40)}")`;
    if (current.options.length < 2) problems.push(`${label} has fewer than two options.`);
    else if (!current.answer) problems.push(`${label} has no "Correct answer: X" line.`);
    else if (!current.options.some((o) => o.letter === current!.answer)) problems.push(`${label}: answer ${current.answer} is not one of the options.`);
    else {
      const id = `q-import-${questions.length + 1}`;
      questions.push({
        id,
        prompt: current.prompt,
        marks: 1,
        options: current.options.map((o, i) => ({ id: `${id}-o${i + 1}`, label: o.label, isCorrect: o.letter === current!.answer })),
      });
    }
    current = null;
    target = "none";
  };

  for (const raw of text.split(/\r?\n/)) {
    const line = raw.replace(/\s+/g, " ").trim();
    if (!line || NOISE.test(line)) continue;

    const answer = ANSWER.exec(line);
    if (answer && current) {
      current.answer = answer[1]!.toUpperCase();
      target = "none";
      continue;
    }
    const question = QUESTION.exec(line);
    if (question) {
      finish();
      current = { number: Number(question[1]), prompt: question[2]!.trim(), options: [], answer: null };
      target = "prompt";
      continue;
    }
    const option = OPTION.exec(line);
    if (option && current && !current.answer) {
      current.options.push({ letter: option[1]!.toUpperCase(), label: option[2]!.trim() });
      target = "option";
      continue;
    }
    if (current && target === "prompt") current.prompt += ` ${line}`;
    else if (current && target === "option") current.options[current.options.length - 1]!.label += ` ${line}`;
    // Anything else (headings, footers, explanations) is ignored.
  }
  finish();
  return { questions, problems };
}
