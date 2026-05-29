export function ProgressBar({ value, color = 'accent' }: { value: number; color?: string }) {
  const colors: Record<string, string> = { accent: 'from-accent to-accent-light', green: 'from-success to-emerald-400', yellow: 'from-warning to-amber-400', red: 'from-danger to-orange-400' };
  return (
    <div className="progress-track">
      <div
        className={`progress-fill bg-gradient-to-r ${colors[color] || colors.accent}`}
        style={{ width: `${Math.min(100, value * 100)}%` }}
      />
    </div>
  );
}
