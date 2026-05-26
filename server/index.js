import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import nodemailer from 'nodemailer';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

dotenv.config({ path: ['.env.local', '.env'] });

const app = express();
const port = Number(process.env.PORT || 3001);
const recipientEmail = process.env.RESULT_RECIPIENT_EMAIL || 'ranjeetyadav31638@gmail.com';

app.use(cors());
app.use(express.json({ limit: '1mb' }));

function createTransporter() {
  const host = process.env.SMTP_HOST || 'smtp.gmail.com';
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    return null;
  }

  const portValue = Number(process.env.SMTP_PORT || 587);
  const secure = process.env.SMTP_SECURE === 'true' || portValue === 465;

  return nodemailer.createTransport({
    host,
    port: portValue,
    secure,
    auth: {
      user,
      pass
    }
  });
}

function formatQuestionLine(question) {
  const outcome = question.isCorrect ? 'Correct' : 'Wrong';
  return `<tr><td style="padding:8px;border:1px solid #e2e8f0;">${escapeHtml(question.question)}</td><td style="padding:8px;border:1px solid #e2e8f0;">${escapeHtml(question.selectedKey || 'Not answered')}</td><td style="padding:8px;border:1px solid #e2e8f0;">${escapeHtml(question.correctOptionKey)}</td><td style="padding:8px;border:1px solid #e2e8f0;">${outcome}</td></tr>`;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

app.post('/api/send-result', async (request, response) => {
  const { recipientEmail: targetEmail, testTitle, testDescription, scoreData, timestamp, attemptedCount, questions } = request.body || {};

  if (!scoreData || typeof scoreData.correct !== 'number' || typeof scoreData.total !== 'number' || !Array.isArray(scoreData.details)) {
    return response.status(400).json({ error: 'Invalid score payload.' });
  }

  const transporter = createTransporter();
  if (!transporter) {
    return response.status(503).json({ error: 'SMTP configuration is missing.' });
  }

  const totalQuestions = scoreData.total;
  const subject = `MCQ result: ${scoreData.correct}/${totalQuestions} - ${testTitle || 'MCQ Test Platform'}`;

  const htmlQuestions = (questions || scoreData.details).map(formatQuestionLine).join('');
  const html = `
    <div style="font-family:Arial,sans-serif;color:#0f172a;line-height:1.5;">
      <h2 style="margin:0 0 12px;">${escapeHtml(testTitle || 'MCQ Test Platform')} result</h2>
      ${testDescription ? `<p style="margin:0 0 12px;color:#475569;">${escapeHtml(testDescription)}</p>` : ''}
      <p style="margin:0 0 8px;"><strong>Score:</strong> ${scoreData.correct}/${totalQuestions}</p>
      <p style="margin:0 0 8px;"><strong>Attempted:</strong> ${escapeHtml(attemptedCount ?? scoreData.details.filter((item) => item.selectedKey).length)}</p>
      <p style="margin:0 0 16px;"><strong>Finished at:</strong> ${escapeHtml(timestamp || new Date().toISOString())}</p>
      <table style="border-collapse:collapse;width:100%;max-width:900px;">
        <thead>
          <tr>
            <th style="padding:8px;border:1px solid #e2e8f0;text-align:left;">Question</th>
            <th style="padding:8px;border:1px solid #e2e8f0;text-align:left;">Selected</th>
            <th style="padding:8px;border:1px solid #e2e8f0;text-align:left;">Correct</th>
            <th style="padding:8px;border:1px solid #e2e8f0;text-align:left;">Status</th>
          </tr>
        </thead>
        <tbody>${htmlQuestions}</tbody>
      </table>
    </div>
  `;

  const text = [
    `${testTitle || 'MCQ Test Platform'} result`,
    testDescription || '',
    `Score: ${scoreData.correct}/${totalQuestions}`,
    `Attempted: ${attemptedCount ?? scoreData.details.filter((item) => item.selectedKey).length}`,
    `Finished at: ${timestamp || new Date().toISOString()}`,
    '',
    ...scoreData.details.map((question, index) => `${index + 1}. ${question.question} | selected: ${question.selectedKey || 'Not answered'} | correct: ${question.correctOptionKey} | ${question.isCorrect ? 'Correct' : 'Wrong'}`)
  ].filter(Boolean).join('\n');

  await transporter.sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to: targetEmail || recipientEmail,
    subject,
    text,
    html
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