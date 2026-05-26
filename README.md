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

## Email result delivery

When the user finishes a test, the app sends the result in the background to `ranjeetyadav31638@gmail.com` through the backend API at `/api/send-result`.

Keep real credentials in a local-only file named `.env.local` at the project root. Do not commit that file. The tracked `.env.example` stays as a template only.

This uses free Gmail SMTP, so you do not need a paid email service. Create a free Gmail account, turn on 2-step verification, then create an App Password in your Google Account security settings. Use that app password as `SMTP_PASS` inside `.env.local`.

Set these environment variables before running the backend:

- `SMTP_PORT`
- `SMTP_USER`
- `SMTP_PASS`
- `SMTP_HOST` - optional, defaults to `smtp.gmail.com`
- `SMTP_FROM` - optional, defaults to `SMTP_USER`
- `RESULT_RECIPIENT_EMAIL` - optional, defaults to `ranjeetyadav31638@gmail.com`

In development, `npm run dev` starts both Vite and the email backend.
