export function PageLoading() {
  return (
    <div className="animate-pulse space-y-6" aria-busy="true" aria-label="Carregando">
      <div className="h-8 w-48 rounded-lg bg-muted" />
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="h-24 rounded-lg bg-muted" />
        <div className="h-24 rounded-lg bg-muted" />
        <div className="h-24 rounded-lg bg-muted" />
        <div className="h-24 rounded-lg bg-muted" />
      </div>
      <div className="h-48 rounded-lg bg-muted" />
    </div>
  );
}
