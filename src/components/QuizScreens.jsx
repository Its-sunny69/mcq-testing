import { Panel } from './Panel';
import { StatCard } from './StatCard';
import { ProgressBar } from './ProgressBar';
import { EXAMPLE_MCQ_FILE_PATH } from '../lib/mcq';

export function LoadingState() {
  return (
    <>
      <p className="text-sm text-slate-600">Loading questions from /public/mcq-data.json...</p>
      <ShimmerBar />
    </>
  );
}

export function ErrorState({ error }) {
  return (
    <>
      <p className="rounded-xl border border-red-200 bg-red-50 p-3 text-red-700">{error}</p>
      <p className="mt-4 text-sm text-slate-600">Expected JSON path: /public/mcq-data.json</p>
    </>
  );
}

export function IntroScreen({ title, description, questionCount, maxQuestions, uploadMessage, activeSource, onStart, onUploadFile }) {
  return (
    <Panel title={title} subtitle="Practice confidently with instant feedback">
      <p className="text-slate-700">{description}</p>

      <div className="mt-6 rounded-2xl border border-dashed border-slate-300 bg-slate-50 p-4">
        <p className="text-sm font-semibold text-slate-900">If you want to give test of your own quiz upload the json file.</p>
        <p className="mt-1 text-sm text-slate-600">When no file is uploaded, the default quiz stays selected automatically.</p>

        <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
          <label className="inline-flex cursor-pointer items-center justify-center rounded-lg bg-slate-900 px-4 py-2 font-medium text-white transition hover:bg-slate-700 btn-smooth">
            Upload JSON file
            <input
              type="file"
              accept="application/json,.json"
              className="hidden"
              onChange={(event) => {
                onUploadFile(event.target.files?.[0] || null);
                event.target.value = '';
              }}
            />
          </label>

          <a href={EXAMPLE_MCQ_FILE_PATH} download="example.json" className="inline-flex items-center justify-center rounded-lg border border-slate-300 px-4 py-2 font-medium text-slate-700 transition hover:bg-slate-100 btn-smooth">
            Download example.json
          </a>
        </div>

        <p className="mt-3 text-sm text-slate-600">
          Current quiz source: <span className="font-medium text-slate-900">{activeSource === 'default' ? 'Default questions' : activeSource}</span>
        </p>
        {uploadMessage ? <p className="mt-2 text-sm text-brand-700">{uploadMessage}</p> : null}
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-3">
        <StatCard label="Questions" value={questionCount} />
        <StatCard label="Options / question" value="4" />
        <StatCard label="Max supported" value={maxQuestions} />
      </div>

      <ul className="mt-6 space-y-2 text-sm text-slate-600">
        <li>Navigate between questions with Previous and Next.</li>
        <li>Submit when ready and review all correct and wrong answers.</li>
        <li>Every question includes an explanation for learning.</li>
      </ul>

      <button
        onClick={onStart}
        className="mt-8 rounded-lg bg-gradient-to-r from-brand-400 to-brand-600 px-5 py-3 font-semibold text-white shadow-soft-lg btn-smooth hover:from-brand-500 hover:to-brand-700"
      >
        Start Test
      </button>
    </Panel>
  );
}

export function TestScreen({
  questions,
  currentIndex,
  currentQuestion,
  selectedOptionKey,
  progress,
  attemptedCount,
  onSelect,
  onPrevious,
  onNext,
  onFinish
}) {
  const isLastQuestion = currentIndex === questions.length - 1;

  return (
    <Panel title={`Question ${currentIndex + 1} of ${questions.length}`} subtitle="Read carefully and select one option">
      <ProgressBar progress={progress} attemptedCount={attemptedCount} totalQuestions={questions.length} />

      <p className="text-xl font-semibold text-slate-900">{currentQuestion.question}</p>

      <div className="mt-5 space-y-3">
        {currentQuestion.options.map((option) => (
          <button
            key={option.key}
            onClick={() => onSelect(currentQuestion.id, option.key)}
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
          onClick={onPrevious}
          disabled={currentIndex === 0}
          className="rounded-lg border border-slate-300 px-4 py-2 font-medium text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Previous
        </button>

        {isLastQuestion ? (
          <button onClick={onFinish} className="rounded-lg bg-gradient-to-r from-brand-400 to-brand-600 px-4 py-2 font-semibold text-white shadow-soft-lg btn-smooth hover:from-brand-500 hover:to-brand-700">
            Finish Test
          </button>
        ) : (
          <button onClick={onNext} className="rounded-lg bg-gradient-to-r from-brand-400 to-brand-600 px-4 py-2 font-semibold text-white shadow-soft-lg btn-smooth hover:from-brand-500 hover:to-brand-700">
            Next
          </button>
        )}
      </div>
    </Panel>
  );
}

export function ResultScreen({ scoreData, onRetake, onGoToStart }) {
  return (
    <Panel title="Test Completed" subtitle="Performance summary with explanations">
      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard label="Score" value={`${scoreData.correct}/${scoreData.total}`} highlight />
        <StatCard label="Correct" value={scoreData.correct} />
        <StatCard label="Incorrect" value={scoreData.total - scoreData.correct} />
      </div>

      <div className="mt-7 space-y-4">
        {scoreData.details.map((item, index) => (
          <ResultItem key={item.id} item={item} questionNumber={index + 1} />
        ))}
      </div>

      <div className="mt-6 flex gap-3">
        <button onClick={onRetake} className="rounded-lg bg-slate-900 px-4 py-2 font-medium text-white hover:bg-slate-700 btn-smooth">
          Retake Test
        </button>
        <button onClick={onGoToStart} className="rounded-lg border border-slate-200 px-4 py-2 font-medium text-slate-900 hover:shadow-soft-lg btn-smooth">
          Go to Start
        </button>
      </div>
    </Panel>
  );
}

function ResultItem({ item, questionNumber }) {
  const correctOption = item.options.find((option) => option.key === item.correctOptionKey);
  const selectedOption = item.options.find((option) => option.key === item.selectedKey);

  return (
    <div className={`rounded-2xl border p-5 ${item.isCorrect ? 'border-emerald-200 bg-emerald-50/70' : 'border-rose-200 bg-rose-50/70'}`}>
      <div className="flex items-start justify-between gap-4">
        <p className="font-semibold text-slate-900">
          Q{questionNumber}. {item.question}
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
}

function ShimmerBar() {
  return (
    <div className="mt-4 h-2 w-full overflow-hidden rounded-full bg-slate-200">
      <div className="h-full w-1/3 animate-pulse rounded-full bg-brand-500" />
    </div>
  );
}