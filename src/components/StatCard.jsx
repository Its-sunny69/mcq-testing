export function StatCard({ label, value, highlight = false }) {
  return (
    <div className={`rounded-xl border px-4 py-3 ${highlight ? 'border-brand-200 bg-brand-50' : 'border-slate-200 bg-white'}`}>
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{label}</p>
      <p className={`mt-1 text-2xl font-bold ${highlight ? 'text-brand-700' : 'text-slate-900'}`}>{value}</p>
    </div>
  );
}