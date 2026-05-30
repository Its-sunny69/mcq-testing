import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildActivityEmailPayload, createTransporter } from './email.js';

dotenv.config({ path: ['.env.local', '.env'] });

const app = express();
const port = Number(process.env.PORT || 3001);

app.use(cors());
app.use(express.json({ limit: '1mb' }));

app.post('/api/send-result', async (request, response) => {
  const { eventType, recipientEmail: targetEmail, testTitle, testDescription, scoreData, timestamp, attemptedCount, questions } = request.body || {};

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
    recipientEmail: targetEmail,
    testTitle,
    testDescription,
    scoreData,
    timestamp,
    attemptedCount,
    questions
  });

  await transporter.sendMail({
    ...emailPayload
  });

  return response.status(202).json({ ok: true });
});

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const distPath = path.join(__dirname, '..', 'dist');

if (fs.existsSync(distPath)) {
  app.use(express.static(distPath));
  app.get('*', (request, response, next) => {
    if (request.path.startsWith('/api/')) {
      return next();
    }

    return response.sendFile(path.join(distPath, 'index.html'));
  });
}

app.listen(port, () => {
  console.log(`Email result server running on http://localhost:${port}`);
});