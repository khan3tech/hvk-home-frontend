# Question and Marking Model

## Release-one question type

`SINGLE_CHOICE`: one question, two or more options, exactly one correct option, and one candidate-selected option or null.

The model should include a `type` field and versioned answer representation so future types can be added without changing existing attempt records.

## Public and private data

Candidate question payload:

```json
{
  "questionId": "q_123",
  "position": 1,
  "type": "SINGLE_CHOICE",
  "prompt": "...",
  "options": [{"id": "o_a", "label": "..."}]
}
```

The public payload must not include `isCorrect`, answer keys, marks awarded, or trusted qualification data. The backend retains the answer key privately.

## Ordering

At attempt creation, generate and persist a question order and option order. Do not reshuffle on refresh, reconnect, or answer retrieval. The persisted order supports reproducibility and audit.

## Marking

- No negative marking in release one.
- Correct selected option receives the question mark value.
- Incorrect or unanswered receives zero.
- There is no partial credit.
- Score is the sum of awarded marks.
- Passing is based on the exam's configured passing marks or percentage.

## Future extensibility

Reserve types for multiple-choice, true/false, numerical, short-answer, and long-answer questions. Subjective answers should have separate evaluation states (`PENDING`, `IN_REVIEW`, `EVALUATED`) and must not be silently treated as zero.

