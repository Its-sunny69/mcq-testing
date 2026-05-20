import { useEffect, useMemo, useState } from 'react';

const MCQ_FILE_PATH = '/mcq-data.json';
const MAX_QUESTIONS = 50;

const PHASES = {
  loading: 'loading',
  intro: 'intro',
  test: 'test',
  result: 'result',
  error: 'error'
};

function validateMcqData(raw) {
  if (!raw || typeof raw !== 'object') throw new Error('JSON root must be an object.');
  if (!Array.isArray(raw.questions)) throw new Error('`questions` must be an array.');
  if (raw.questions.length === 0) throw new Error('`questions` cannot be empty.');
  if (raw.questions.length > MAX_QUESTIONS) throw new Error(`Maximum ${MAX_QUESTIONS} questions allowed.`);

  raw.questions.forEach((q, idx) => {
    if (typeof q.id !== 'string' || !q.id.trim()) throw new Error(`Question ${idx + 1}: id is required.`);
    if (typeof q.question !== 'string' || !q.question.trim()) throw new Error(`Question ${idx + 1}: question text is required.`);
    if (!Array.isArray(q.options) || q.options.length !== 4) throw new Error(`Question ${idx + 1}: exactly 4 options are required.`);
    q.options.forEach((opt, optionIdx) => {
      if (typeof opt.key !== 'string' || !opt.key.trim()) throw new Error(`Question ${idx + 1}, option ${optionIdx + 1}: key is required.`);
      if (typeof opt.text !== 'string' || !opt.text.trim()) throw new Error(`Question ${idx + 1}, option ${optionIdx + 1}: text is required.`);
    });
    if (typeof q.correctOptionKey !== 'string' || !q.correctOptionKey.trim()) throw new Error(`Question ${idx + 1}: correctOptionKey is required.`);
    if (!q.options.some((opt) => opt.key === q.correctOptionKey)) throw new Error(`Question ${idx + 1}: correctOptionKey must match one option key.`);
    if (typeof q.explanation !== 'string' || !q.explanation.trim()) throw new Error(`Question ${idx + 1}: explanation is required.`);
  });

  return raw;
}

export default function App() {
  const [phase, setPhase] = useState(PHASES.loading);
  const [testData, setTestData] = useState(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState({});
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadMcqFile() {
      try {
        const response = await fetch(MCQ_FILE_PATH, { cache: 'no-store' });
        if (!response.ok) {
          throw new Error(`Could not load ${MCQ_FILE_PATH}. Please place your JSON file in /public as mcq-data.json.`);
        }
        const data = await response.json();
        const validData = validateMcqData(data);
        setTestData(validData);
        setPhase(PHASES.intro);
      } catch (err) {
        setError(err.message || 'Unable to load test file.');
        setPhase(PHASES.error);
      }
    }

    loadMcqFile();
  }, []);

  const questions = testData?.questions || [];
  const currentQuestion = questions[currentIndex];
  const selectedOptionKey = answers[currentQuestion?.id];

  const scoreData = useMemo(() => {
    if (!questions.length) return { correct: 0, total: 0, details: [] };
    const details = questions.map((q) => {
      const selectedKey = answers[q.id] || null;
      const isCorrect = selectedKey === q.correctOptionKey;
      return { ...q, selectedKey, isCorrect };
    });
    const correct = details.filter((d) => d.isCorrect).length;
    return { correct, total: questions.length, details };
  }, [answers, questions]);

  const handleSelect = (questionId, optionKey) => {
    setAnswers((prev) => ({ ...prev, [questionId]: optionKey }));
  };

  const startTest = () => {
    setCurrentIndex(0);
    setAnswers({});
    setPhase(PHASES.test);
  };

  const finishTest = () => setPhase(PHASES.result);

  if (phase === PHASES.loading) {
    return <MainLayout><Panel title="Loading">Loading your MCQ JSON file...</Panel></MainLayout>;
  }

  if (phase === PHASES.error) {
    return (
      <MainLayout>
        <Panel title="Configuration Error">
          <p className="text-red-700">{error}</p>
          <p className="mt-2 text-sm text-slate-600">Expected JSON path: <code>/public/mcq-data.json</code></p>
        </Panel>
      </MainLayout>
    );
  }

  if (phase === PHASES.intro) {
    return (
      <MainLayout>
        <Panel title={testData.title || 'MCQ Test'}>
          <p className="text-slate-700">{testData.description || 'Read each question and choose one answer.'}</p>
          <ul className="mt-4 list-disc space-y-1 pl-5 text-sm text-slate-700">
            <li>Total questions: {questions.length}</li>
            <li>Each question has exactly 4 options.</li>
            <li>Results show right/wrong answers with explanations.</li>
          </ul>
          <button onClick={startTest} className="mt-6 rounded-lg bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700">Start Test</button>
        </Panel>
      </MainLayout>
    );
  }

  if (phase === PHASES.result) {
    return (
      <MainLayout>
        <Panel title="Test Result">
          <p className="text-lg font-semibold">Score: {scoreData.correct} / {scoreData.total}</p>
          <div className="mt-6 space-y-4">
            {scoreData.details.map((item, idx) => {
              const correctOption = item.options.find((op) => op.key === item.correctOptionKey);
              const selectedOption = item.options.find((op) => op.key === item.selectedKey);
              return (
                <div key={item.id} className={`rounded-xl border p-4 ${item.isCorrect ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'}`}>
                  <p className="font-semibold">Q{idx + 1}. {item.question}</p>
                  <p className="mt-2 text-sm">Your answer: <span className="font-medium">{selectedOption ? `${selectedOption.key}. ${selectedOption.text}` : 'Not answered'}</span></p>
                  <p className="mt-1 text-sm">Correct answer: <span className="font-medium">{correctOption.key}. {correctOption.text}</span></p>
                  <p className="mt-2 text-sm text-slate-700"><span className="font-medium">Explanation:</span> {item.explanation}</p>
                </div>
              );
            })}
          </div>
          <button onClick={startTest} className="mt-6 rounded-lg bg-slate-900 px-4 py-2 font-medium text-white hover:bg-slate-700">Retake Test</button>
        </Panel>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <Panel title={`Question ${currentIndex + 1} of ${questions.length}`}>
        <p className="text-lg font-semibold text-slate-900">{currentQuestion.question}</p>
        <div className="mt-5 space-y-3">
          {currentQuestion.options.map((option) => (
            <button
              key={option.key}
              onClick={() => handleSelect(currentQuestion.id, option.key)}
              className={`w-full rounded-lg border px-4 py-3 text-left transition ${
                selectedOptionKey === option.key
                  ? 'border-blue-600 bg-blue-50 ring-2 ring-blue-200'
                  : 'border-slate-300 bg-white hover:border-blue-300'
              }`}
            >
              <span className="font-semibold">{option.key}.</span> {option.text}
            </button>
          ))}
        </div>

        <div className="mt-6 flex items-center justify-between">
          <button
            onClick={() => setCurrentIndex((prev) => Math.max(0, prev - 1))}
            disabled={currentIndex === 0}
            className="rounded-lg border border-slate-300 px-4 py-2 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Previous
          </button>

          {currentIndex === questions.length - 1 ? (
            <button onClick={finishTest} className="rounded-lg bg-green-600 px-4 py-2 font-medium text-white hover:bg-green-700">Finish Test</button>
          ) : (
            <button onClick={() => setCurrentIndex((prev) => prev + 1)} className="rounded-lg bg-blue-600 px-4 py-2 font-medium text-white hover:bg-blue-700">Next</button>
          )}
        </div>
      </Panel>
    </MainLayout>
  );
}

function MainLayout({ children }) {
  return (
    <div className="min-h-screen bg-slate-100 px-4 py-8">
      <div className="mx-auto max-w-4xl">{children}</div>
    </div>
  );
}

function Panel({ title, children }) {
  return (
    <div className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200">
      <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
      <div className="mt-4">{children}</div>
    </div>
  );
}
