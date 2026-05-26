export function AppShell({ children }) {
  return (
    <div className="min-h-screen app-bg px-4 py-12">
      <div className="mx-auto mb-6 flex max-w-5xl items-center justify-between rounded-2xl border border-white/70 bg-white/70 px-5 py-3 shadow-sm backdrop-blur">
        <div className="flex items-center gap-3">
          <img src="/logo.svg" alt="MCQ Testing Platform logo" className="h-10 w-10 shrink-0 rounded-xl bg-white p-1 shadow-sm ring-1 ring-slate-200" />
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-brand-600">Testing Platform</p>
            <h1 className="text-lg font-bold text-slate-900">MCQ Assessment Studio</h1>
          </div>
        </div>
        <span className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-medium text-slate-600">Single JSON Powered</span>
      </div>
      <div className="mx-auto max-w-5xl">{children}</div>
    </div>
  );
}