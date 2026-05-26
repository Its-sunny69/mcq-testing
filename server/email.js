import nodemailer from 'nodemailer';

export const DEFAULT_RECIPIENT_EMAIL = 'ranjeetyadav31638@gmail.com';

export function createTransporter() {
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

export function buildResultEmailPayload({
  recipientEmail,
  testTitle,
  testDescription,
  scoreData,
  timestamp,
  attemptedCount,
  questions
}) {
  const totalQuestions = scoreData.total;
  const subject = `MCQ result: ${scoreData.correct}/${totalQuestions} - ${testTitle || 'MCQ Test Platform'}`;
  const rows = (questions || scoreData.details).map(formatQuestionLine).join('');
  const attempted = attemptedCount ?? scoreData.details.filter((item) => item.selectedKey).length;

  const html = `
    <div style="font-family:Arial,sans-serif;color:#0f172a;line-height:1.5;">
      <h2 style="margin:0 0 12px;">${escapeHtml(testTitle || 'MCQ Test Platform')} result</h2>
      ${testDescription ? `<p style="margin:0 0 12px;color:#475569;">${escapeHtml(testDescription)}</p>` : ''}
      <p style="margin:0 0 8px;"><strong>Score:</strong> ${scoreData.correct}/${totalQuestions}</p>
      <p style="margin:0 0 8px;"><strong>Attempted:</strong> ${escapeHtml(attempted)}</p>
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
        <tbody>${rows}</tbody>
      </table>
    </div>
  `;

  const text = [
    `${testTitle || 'MCQ Test Platform'} result`,
    testDescription || '',
    `Score: ${scoreData.correct}/${totalQuestions}`,
    `Attempted: ${attempted}`,
    `Finished at: ${timestamp || new Date().toISOString()}`,
    '',
    ...scoreData.details.map((question, index) => `${index + 1}. ${question.question} | selected: ${question.selectedKey || 'Not answered'} | correct: ${question.correctOptionKey} | ${question.isCorrect ? 'Correct' : 'Wrong'}`)
  ].filter(Boolean).join('\n');

  return {
    to: recipientEmail || DEFAULT_RECIPIENT_EMAIL,
    subject,
    text,
    html,
    from: process.env.SMTP_FROM || process.env.SMTP_USER
  };
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