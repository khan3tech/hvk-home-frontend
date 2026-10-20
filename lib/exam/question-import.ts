export const questionJsonHint = `{
  "questions": [
    {
      "id": "q1",
      "prompt": "What is 2 + 2?",
      "marks": 1,
      "options": [
        { "id": "q1-o1", "label": "3", "isCorrect": false },
        { "id": "q1-o2", "label": "4", "isCorrect": true }
      ]
    }
  ]
}`;

export function parseQuestionJson(value: string) {
  if (/&#x20;|&#32;|&nbsp;/i.test(value)) {
    throw new Error("The JSON contains HTML-encoded spaces. Replace them with normal spaces and paste the JSON again.");
  }
  const cleaned = value.trim().replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "").trim();
  const parsed: unknown = JSON.parse(cleaned);
  const raw = Array.isArray(parsed) ? parsed : typeof parsed === "object" && parsed !== null ? (parsed as { questions?: unknown }).questions : null;
  if (!Array.isArray(raw) || raw.length === 0) throw new Error("JSON must contain a non-empty questions array.");
  const questionIds = new Set<string>();
  return raw.map((item: unknown, questionIndex: number) => {
    const question = (typeof item === "object" && item !== null ? item : {}) as Record<string, unknown>;
    const number = questionIndex + 1;
    const id = String(question.id || `q-import-${number}`).trim();
    const prompt = String(question.prompt || "").trim();
    const options = (Array.isArray(question.options) ? question.options : []).map((rawOption: unknown, optionIndex: number) => {
      const option = (typeof rawOption === "object" && rawOption !== null ? rawOption : {}) as Record<string, unknown>;
      const optionId = String(option.id || `${id}-o${optionIndex + 1}`).trim();
      return { id: optionId, label: String(option.label || "").trim(), isCorrect: option.isCorrect === true || option.id === question.correctOptionId };
    });
    if (!id || questionIds.has(id) || !prompt || options.length < 2 || options.some((option) => !option.id || !option.label) || options.filter((option) => option.isCorrect).length !== 1) {
      throw new Error(`Question ${number} must have a unique ID, text, at least two options, and exactly one correct answer.`);
    }
    questionIds.add(id);
    const marks = Number(question.marks ?? 1);
    if (!Number.isFinite(marks) || marks <= 0) throw new Error(`Question ${number} must have positive marks.`);
    return { id, prompt, marks, options };
  });
}
