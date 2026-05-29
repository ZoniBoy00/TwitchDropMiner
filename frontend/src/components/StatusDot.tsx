export function StatusDot({ status }: { status: string }) {
  const c = status === 'Connected'
    ? 'bg-success shadow-[0_0_8px_rgba(0,184,148,0.6)]'
    : status === 'Connecting' ? 'bg-warning animate-pulse' : 'bg-dark-400';
  return <span className={`w-2 h-2 rounded-full ${c} transition-colors duration-300`} />;
}
