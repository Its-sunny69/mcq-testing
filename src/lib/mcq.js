export const MCQ_FILE_PATH = '/mcq-data.json';
export const MAX_QUESTIONS = 50;

export const PHASES = {
  loading: 'loading',
  intro: 'intro',
  test: 'test',
  result: 'result',
  error: 'error'
};

export function validateMcqData(raw) {
  if (!raw || typeof raw !== 'object') throw new Error('JSON root must be an object.');
  if (!Array.isArray(raw.questions)) throw new Error('`questions` must be an array.');
  if (raw.questions.length === 0) throw new Error('`questions` cannot be empty.');
  if (raw.questions.length > MAX_QUESTIONS) throw new Error(`Maximum ${MAX_QUESTIONS} questions allowed.`);

  raw.questions.forEach((question, index) => {
    if (typeof question.id !== 'string' || !question.id.trim()) throw new Error(`Question ${index + 1}: id is required.`);
    if (typeof question.question !== 'string' || !question.question.trim()) throw new Error(`Question ${index + 1}: question text is required.`);
    if (!Array.isArray(question.options) || question.options.length !== 4) throw new Error(`Question ${index + 1}: exactly 4 options are required.`);

    question.options.forEach((option, optionIndex) => {
      if (typeof option.key !== 'string' || !option.key.trim()) throw new Error(`Question ${index + 1}, option ${optionIndex + 1}: key is required.`);
      if (typeof option.text !== 'string' || !option.text.trim()) throw new Error(`Question ${index + 1}, option ${optionIndex + 1}: text is required.`);
    });

    if (typeof question.correctOptionKey !== 'string' || !question.correctOptionKey.trim()) throw new Error(`Question ${index + 1}: correctOptionKey is required.`);
    if (!question.options.some((option) => option.key === question.correctOptionKey)) throw new Error(`Question ${index + 1}: correctOptionKey must match one option key.`);
    if (typeof question.explanation !== 'string' || !question.explanation.trim()) throw new Error(`Question ${index + 1}: explanation is required.`);
  });

  return raw;
}