import { buildActivityEmailPayload, createTransporter } from '../server/email.js';

export default async function handler(request, response) {
  if (request.method !== 'POST') {
    response.setHeader('Allow', 'POST');
    return response.status(405).json({ error: 'Method not allowed.' });
  }

  const { eventType, recipientEmail, testTitle, testDescription, scoreData, timestamp, attemptedCount, questions } = request.body || {};

  if (eventType === 'started') {
    if (!Array.isArray(questions)) {
      return response.status(400).json({ error: 'Invalid start payload.' });
    }
  } else if (!scoreData || typeof scoreData.correct !== 'number' || typeof scoreData.total !== 'number' || !Array.isArray(scoreData.details)) {
    return response.status(400).json({ error: 'Invalid score payload.' });
  }

  const transporter = createTransporter();
  if (!transporter) {
    return response.status(503).json({ error: 'SMTP configuration is missing.' });
  }

  const emailPayload = buildActivityEmailPayload({
    eventType,
    recipientEmail,
    testTitle,
    testDescription,
    scoreData,
    timestamp,
    attemptedCount,
    questions
  });

  await transporter.sendMail(emailPayload);

  return response.status(202).json({ ok: true });
}