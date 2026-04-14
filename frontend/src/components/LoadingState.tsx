export function LoadingState() {
  return (
    <div className="flex min-h-[220px] items-center justify-center rounded-3xl border border-white/10 bg-white/5 px-6 py-10">
      <div
        className="h-12 w-12 rounded-full border-4 border-sky-300/15 border-t-sky-200"
        style={{ animation: "spin 0.8s linear infinite" }}
        aria-label="Carregando"
        role="status"
      />
      <div className="sr-only">Carregando</div>
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
