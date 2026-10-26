import { describe, expect, it } from "vitest";
import { questionsFromFile } from "@/lib/exam/question-file";
import { parseQuestionText } from "@/lib/exam/question-text";

const SAMPLE = `Programming & Data Science MCQ Question Bank
HTML5 — Basic to Advanced
1. Which declaration identifies an HTML5 document?
A. <!DOCTYPE html>
B. <html5>
C. <!HTML VERSION=5>
D. <DOCTYPE HTML5>
Correct answer: A — HTML5 uses the simple <!DOCTYPE html> declaration.
Page 2
2. Which HTTP method is conventionally used to retrieve a resource?
A. GET
B. POST
C. PATCH
D. DELETE
Correct answer: A — GET requests a representation.
JavaScript — Complete Course
1. What does typeof null return?
A. "null"
B. "object"
C. "undefined"
D. "number"
Correct answer: B`;

describe("parseQuestionText", () => {
  it("reads questions, options and answers across headings and page footers", () => {
    const { questions, problems } = parseQuestionText(SAMPLE);
    expect(problems).toEqual([]);
    expect(questions).toHaveLength(3);
    expect(questions[0]!.prompt).toBe("Which declaration identifies an HTML5 document?");
    expect(questions[0]!.options.map((o) => o.label)).toEqual(["<!DOCTYPE html>", "<html5>", "<!HTML VERSION=5>", "<DOCTYPE HTML5>"]);
    expect(questions.map((q) => q.options.findIndex((o) => o.isCorrect))).toEqual([0, 0, 1]);
    expect(new Set(questions.map((q) => q.id)).size).toBe(3); // numbering restarts per subject, ids stay unique
  });

  it("joins wrapped lines onto the prompt or the option", () => {
    const { questions } = parseQuestionText("1. A very long\nquestion text?\nA. first\nanswer part\nB. second\nCorrect answer: B");
    expect(questions[0]!.prompt).toBe("A very long question text?");
    expect(questions[0]!.options[0]!.label).toBe("first answer part");
  });

  it("reports questions it cannot use instead of guessing", () => {
    const missing = parseQuestionText("1. No answer line?\nA. x\nB. y");
    expect(missing.questions).toEqual([]);
    expect(missing.problems[0]).toMatch(/no "Correct answer/);
    const unknown = parseQuestionText("1. Bad letter?\nA. x\nB. y\nCorrect answer: D");
    expect(unknown.problems[0]).toMatch(/not one of the options/);
    const fewOptions = parseQuestionText("1. One option?\nA. x\nCorrect answer: A");
    expect(fewOptions.problems[0]).toMatch(/fewer than two options/);
  });
});

describe("questionsFromFile", () => {
  const file = (name: string, body: string) => new File([body], name);

  it("accepts a text file in the question-bank layout", async () => {
    const questions = await questionsFromFile(file("bank.txt", SAMPLE));
    expect(questions).toHaveLength(3);
    expect(questions[2]!.options.filter((o) => o.isCorrect)).toHaveLength(1);
  });

  it("accepts JSON files through the existing parser", async () => {
    const json = JSON.stringify({ questions: [{ id: "a", prompt: "p", options: [{ id: "a1", label: "x", isCorrect: true }, { id: "a2", label: "y" }] }] });
    expect(await questionsFromFile(file("q.json", json))).toHaveLength(1);
  });

  it("rejects unsupported and unreadable files with a clear message", async () => {
    await expect(questionsFromFile(file("q.docx", "x"))).rejects.toThrow("PDF, TXT or JSON");
    await expect(questionsFromFile(file("empty.txt", "hello"))).rejects.toThrow(/No questions found/);
    await expect(questionsFromFile(file("half.txt", `${SAMPLE}\n4. Broken?\nA. only\nCorrect answer: A`))).rejects.toThrow(/nothing was imported/);
  });
});
