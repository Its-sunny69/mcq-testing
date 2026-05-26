export function ProgressBar({ progress, attemptedCount, totalQuestions }) {
  return (
    <div className="mb-5">
      <div className="mb-2 flex items-center justify-between text-xs font-semibold uppercase tracking-wide text-slate-500">
        <span>Progress</span>
        <span>{progress}%</span>
      </div>
      <div className="h-2 w-full overflow-hidden rounded-full bg-slate-200">
        <div className="h-full rounded-full bg-gradient-to-r from-brand-400 to-brand-600" style={{ width: `${progress}%` }} />
      </div>
      <p className="mt-2 text-sm text-slate-600">
        Answered: {attemptedCount} / {totalQuestions}
      </p>
    </div>
  );
}