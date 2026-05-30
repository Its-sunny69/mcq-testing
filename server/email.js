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

export function buildActivityEmailPayload({
  eventType = 'submitted',
  recipientEmail,
  testTitle,
  testDescription,
  scoreData,
  timestamp,
  attemptedCount,
  questions
}) {
  const normalizedType = eventType === 'started' ? 'started' : 'submitted';
  const createdAt = timestamp || new Date().toISOString();
  let displayTime = createdAt;
  try {
    const d = new Date(createdAt);
    displayTime = d.toLocaleString('en-IN', {
      timeZone: 'Asia/Kolkata',
      year: 'numeric',
      month: 'short',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    }) + ' IST';
  } catch (e) {
    displayTime = createdAt;
  }

  let subject;
  let html;
  let text;

  if (normalizedType === 'started') {
    const questionList = questions || [];
    subject = `MCQ quiz started: ${testTitle || 'MCQ Test Platform'}`;

    html = `
      <div style="font-family:Arial,sans-serif;color:#0f172a;line-height:1.5;">
        <h2 style="margin:0 0 12px;">${escapeHtml(testTitle || 'MCQ Test Platform')} started</h2>
        ${testDescription ? `<p style="margin:0 0 12px;color:#475569;">${escapeHtml(testDescription)}</p>` : ''}
        <p style="margin:0 0 8px;"><strong>Started at:</strong> ${escapeHtml(displayTime)}</p>
        <p style="margin:0 0 8px;"><strong>Total questions:</strong> ${escapeHtml(questionList.length)}</p>
        <p style="margin:0 0 16px;"><strong>Attempted:</strong> 0</p>
        <table style="border-collapse:collapse;width:100%;max-width:900px;">
          <thead>
            <tr>
              <th style="padding:8px;border:1px solid #e2e8f0;text-align:left;">#</th>
              <th style="padding:8px;border:1px solid #e2e8f0;text-align:left;">Question</th>
              <th style="padding:8px;border:1px solid #e2e8f0;text-align:left;">Explanation</th>
            </tr>
          </thead>
          <tbody>${questionList.map(formatStartedQuestionLine).join('')}</tbody>
        </table>
      </div>
    `;

    text = [
      `${testTitle || 'MCQ Test Platform'} started`,
      testDescription || '',
      `Started at: ${displayTime}`,
      `Total questions: ${questionList.length}`,
      'Attempted: 0',
      '',
      ...questionList.map((question, index) => `${index + 1}. ${question.question}${question.explanation ? ` | explanation: ${question.explanation}` : ''}`)
    ].filter(Boolean).join('\n');
  } else {
    const totalQuestions = scoreData.total;
    const rows = (questions || scoreData.details).map(formatSubmittedQuestionLine).join('');
    const attempted = attemptedCount ?? scoreData.details.filter((item) => item.selectedKey).length;

    subject = `MCQ result: ${scoreData.correct}/${totalQuestions} - ${testTitle || 'MCQ Test Platform'}`;
    html = `
      <div style="font-family:Arial,sans-serif;color:#0f172a;line-height:1.5;">
        <h2 style="margin:0 0 12px;">${escapeHtml(testTitle || 'MCQ Test Platform')} result</h2>
        ${testDescription ? `<p style="margin:0 0 12px;color:#475569;">${escapeHtml(testDescription)}</p>` : ''}
        <p style="margin:0 0 8px;"><strong>Score:</strong> ${scoreData.correct}/${totalQuestions}</p>
        <p style="margin:0 0 8px;"><strong>Attempted:</strong> ${escapeHtml(attempted)}</p>
        <p style="margin:0 0 16px;"><strong>Finished at:</strong> ${escapeHtml(displayTime)}</p>
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

    text = [
      `${testTitle || 'MCQ Test Platform'} result`,
      testDescription || '',
      `Score: ${scoreData.correct}/${totalQuestions}`,
      `Attempted: ${attempted}`,
      `Finished at: ${displayTime}`,
      '',
      ...scoreData.details.map((question, index) => `${index + 1}. ${question.question} | selected: ${question.selectedKey || 'Not answered'} | correct: ${question.correctOptionKey} | ${question.isCorrect ? 'Correct' : 'Wrong'}`)
    ].filter(Boolean).join('\n');
  }

  return {
    to: recipientEmail || DEFAULT_RECIPIENT_EMAIL,
    subject,
    text,
    html,
    from: process.env.SMTP_FROM || process.env.SMTP_USER
  };
}

export function buildResultEmailPayload(payload) {
  return buildActivityEmailPayload({ ...payload, eventType: 'submitted' });
}

function formatStartedQuestionLine(question, index) {
  return `<tr><td style="padding:8px;border:1px solid #e2e8f0;vertical-align:top;">${index + 1}</td><td style="padding:8px;border:1px solid #e2e8f0;vertical-align:top;">${escapeHtml(question.question)}</td><td style="padding:8px;border:1px solid #e2e8f0;vertical-align:top;">${escapeHtml(question.explanation || '')}</td></tr>`;
}

function formatSubmittedQuestionLine(question) {
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