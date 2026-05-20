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
        setError(err instanceof Error ? err.message : 'Unable to load test file.');
        setPhase(PHASES.error);
      }
    }

    loadMcqFile();
  }, []);

  const questions = testData?.questions || [];
  const currentQuestion = questions[currentIndex];
  const selectedOptionKey = currentQuestion ? answers[currentQuestion.id] : null;

  const scoreData = useMemo(() => {
    if (!questions.length) return { correct: 0, total: 0, details: [] };

    const details = questions.map((question) => {
      const selectedKey = answers[question.id] || null;
      const isCorrect = selectedKey === question.correctOptionKey;
      return { ...question, selectedKey, isCorrect };
    });

    const correct = details.filter((detail) => detail.isCorrect).length;
    return { correct, total: questions.length, details };
  }, [answers, questions]);

  const attemptedCount = Object.keys(answers).length;
  const progress = questions.length ? Math.round(((currentIndex + 1) / questions.length) * 100) : 0;

  const startTest = () => {
    setCurrentIndex(0);
    setAnswers({});
    setPhase(PHASES.test);
  };

  const finishTest = () => setPhase(PHASES.result);
  const goToStart = () => setPhase(PHASES.intro);

  const handleSelect = (questionId, optionKey) => {
    setAnswers((previousAnswers) => ({ ...previousAnswers, [questionId]: optionKey }));
  };

  if (phase === PHASES.loading) {
    return (
      <MainLayout>
        <Panel title="Loading test">
          <p className="text-sm text-slate-600">Loading questions from /public/mcq-data.json...</p>
          <ShimmerBar />
        </Panel>
      </MainLayout>
    );
  }

  if (phase === PHASES.error) {
    return (
      <MainLayout>
        <Panel title="Configuration Error" subtitle="The MCQ data file could not be loaded">
          <p className="rounded-xl border border-red-200 bg-red-50 p-3 text-red-700">{error}</p>
          <p className="mt-4 text-sm text-slate-600">Expected JSON path: /public/mcq-data.json</p>
        </Panel>
      </MainLayout>
    );
  }

  if (phase === PHASES.intro) {
    return (
      <MainLayout>
        <Panel title={testData?.title || 'MCQ Test Platform'} subtitle="Practice confidently with instant feedback">
          <p className="text-slate-700">
            {testData?.description || 'Choose the best answer for each question and review detailed explanations at the end.'}
          </p>

          <div className="mt-6 grid gap-3 sm:grid-cols-3">
            <StatCard label="Questions" value={questions.length} />
            <StatCard label="Options / question" value="4" />
            <StatCard label="Max supported" value={MAX_QUESTIONS} />
          </div>

          <ul className="mt-6 space-y-2 text-sm text-slate-600">
            <li>Navigate between questions with Previous and Next.</li>
            <li>Submit when ready and review all correct and wrong answers.</li>
            <li>Every question includes an explanation for learning.</li>
          </ul>

          <button
            onClick={startTest}
            className="mt-8 rounded-lg bg-gradient-to-r from-brand-400 to-brand-600 px-5 py-3 font-semibold text-white shadow-soft-lg btn-smooth hover:from-brand-500 hover:to-brand-700"
          >
            Start Test
          </button>
        </Panel>
      </MainLayout>
    );
  }

  if (phase === PHASES.result) {
    return (
      <MainLayout>
        <Panel title="Test Completed" subtitle="Performance summary with explanations">
          <div className="grid gap-3 sm:grid-cols-3">
            <StatCard label="Score" value={`${scoreData.correct}/${scoreData.total}`} highlight />
            <StatCard label="Correct" value={scoreData.correct} />
            <StatCard label="Incorrect" value={scoreData.total - scoreData.correct} />
          </div>

          <div className="mt-7 space-y-4">
            {scoreData.details.map((item, index) => {
              const correctOption = item.options.find((option) => option.key === item.correctOptionKey);
              const selectedOption = item.options.find((option) => option.key === item.selectedKey);

              return (
                <div
                  key={item.id}
                  className={`rounded-2xl border p-5 ${item.isCorrect ? 'border-emerald-200 bg-emerald-50/70' : 'border-rose-200 bg-rose-50/70'}`}
                >
                  <div className="flex items-start justify-between gap-4">
                    <p className="font-semibold text-slate-900">
                      Q{index + 1}. {item.question}
                    </p>
                    <span className={`rounded-full px-3 py-1 text-xs font-bold ${item.isCorrect ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                      {item.isCorrect ? 'Correct' : 'Wrong'}
                    </span>
                  </div>
                  <p className="mt-3 text-sm text-slate-700">
                    Your answer: <span className="font-medium">{selectedOption ? `${selectedOption.key}. ${selectedOption.text}` : 'Not answered'}</span>
                  </p>
                  <p className="mt-1 text-sm text-slate-700">
                    Correct answer: <span className="font-medium">{correctOption.key}. {correctOption.text}</span>
                  </p>
                  <p className="mt-2 rounded-lg bg-white/80 p-3 text-sm text-slate-700">
                    <span className="font-semibold">Explanation:</span> {item.explanation}
                  </p>
                </div>
              );
            })}
          </div>

          <div className="mt-6 flex gap-3">
            <button onClick={startTest} className="rounded-lg bg-slate-900 px-4 py-2 font-medium text-white hover:bg-slate-700 btn-smooth">
              Retake Test
            </button>
            <button onClick={goToStart} className="rounded-lg border border-slate-200 px-4 py-2 font-medium text-slate-900 hover:shadow-soft-lg btn-smooth">
              Go to Start
            </button>
          </div>
        </Panel>
      </MainLayout>
    );
  }

  if (!currentQuestion) {
    return null;
  }

  return (
    <MainLayout>
      <Panel title={`Question ${currentIndex + 1} of ${questions.length}`} subtitle="Read carefully and select one option">
        <div className="mb-5">
          <div className="mb-2 flex items-center justify-between text-xs font-semibold uppercase tracking-wide text-slate-500">
            <span>Progress</span>
            <span>{progress}%</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
            <div className="h-full rounded-full bg-gradient-to-r from-brand-400 to-brand-600" style={{ width: `${progress}%` }} />
          </div>
          <p className="mt-2 text-sm text-slate-600">
            Answered: {attemptedCount} / {questions.length}
          </p>
        </div>

        <p className="text-xl font-semibold text-slate-900">{currentQuestion.question}</p>

        <div className="mt-5 space-y-3">
          {currentQuestion.options.map((option) => (
            <button
              key={option.key}
              onClick={() => handleSelect(currentQuestion.id, option.key)}
              className={`w-full rounded-xl border px-4 py-3 text-left transition btn-smooth shadow-sm focus-ring ${
                selectedOptionKey === option.key
                  ? 'border-brand-600 bg-brand-50 ring-2 ring-brand-200'
                  : 'border-slate-300 bg-white hover:border-brand-300 hover:shadow-md'
              }`}
            >
              <span className="mr-2 font-bold text-slate-900">{option.key}.</span>
              <span className="text-slate-700">{option.text}</span>
            </button>
          ))}
        </div>

        <div className="mt-6 flex items-center justify-between">
          <button
            onClick={() => setCurrentIndex((previousIndex) => Math.max(0, previousIndex - 1))}
            disabled={currentIndex === 0}
            className="rounded-lg border border-slate-300 px-4 py-2 font-medium text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Previous
          </button>

          {currentIndex === questions.length - 1 ? (
            <button onClick={finishTest} className="rounded-lg bg-gradient-to-r from-brand-400 to-brand-600 px-4 py-2 font-semibold text-white shadow-soft-lg btn-smooth hover:from-brand-500 hover:to-brand-700">
              Finish Test
            </button>
          ) : (
            <button onClick={() => setCurrentIndex((previousIndex) => previousIndex + 1)} className="rounded-lg bg-gradient-to-r from-brand-400 to-brand-600 px-4 py-2 font-semibold text-white shadow-soft-lg btn-smooth hover:from-brand-500 hover:to-brand-700">
              Next
            </button>
          )}
        </div>
      </Panel>
    </MainLayout>
  );
}

function MainLayout({ children }) {
  return (
    <div className="min-h-screen app-bg px-4 py-12">
      <div className="mx-auto mb-6 flex max-w-5xl items-center justify-between rounded-2xl border border-white/70 bg-white/70 px-5 py-3 shadow-sm backdrop-blur">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-600">Testing Platform</p>
          <h1 className="text-lg font-bold text-slate-900">MCQ Assessment Studio</h1>
        </div>
        <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600">Single JSON Powered</span>
      </div>
      <div className="mx-auto max-w-5xl">{children}</div>
    </div>
  );
}

function Panel({ title, subtitle, children }) {
  return (
    <div className="rounded-3xl border border-white/70 bg-white/80 p-6 shadow-xl shadow-slate-200/70 backdrop-blur sm:p-8">
      <h2 className="text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">{title}</h2>
      {subtitle ? <p className="mt-1 text-sm text-slate-600">{subtitle}</p> : null}
      <div className="mt-5">{children}</div>
    </div>
  );
}

function StatCard({ label, value, highlight = false }) {
  return (
    <div className={`rounded-xl border px-4 py-3 ${highlight ? 'border-brand-200 bg-brand-50' : 'border-slate-200 bg-white'}`}>
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className={`mt-1 text-2xl font-bold ${highlight ? 'text-brand-700' : 'text-slate-900'}`}>{value}</p>
    </div>
  );
}

function ShimmerBar() {
  return (
    <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-slate-200">
      <div className="h-full w-1/3 animate-pulse rounded-full bg-brand-500" />
    </div>
  );
}
