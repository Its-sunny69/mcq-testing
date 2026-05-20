# MCQ Testing Platform

A React + Tailwind web app for MCQ tests loaded from a single JSON file.

## JSON format (max 50 questions)

Place one file at:

`public/mcq-data.json`

```json
{
  "title": "Test title",
  "description": "Optional short description",
  "questions": [
    {
      "id": "q1",
      "question": "Question text",
      "options": [
        { "key": "A", "text": "Option 1" },
        { "key": "B", "text": "Option 2" },
        { "key": "C", "text": "Option 3" },
        { "key": "D", "text": "Option 4" }
      ],
      "correctOptionKey": "B",
      "explanation": "Why option B is correct"
    }
  ]
}
```

## Rules validated by app

- `questions` required and length must be 1 to 50.
- Every question must have exactly 4 options.
- `correctOptionKey` must match one option key.
- Explanation required for each question.

## Run locally

```bash
npm install
npm run dev
```

Then open the local URL printed by Vite.
