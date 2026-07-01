export default function Page() {
  return (
    <div className="flex flex-col gap-4 md:gap-6">
      <div className="flex items-center justify-between">
        <h1 className="font-bold text-3xl tracking-tight">Dashboard</h1>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Placeholder cards to show layout structure */}
        <div className="rounded-xl border bg-card p-6 text-card-foreground shadow-sm">
          <div className="flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="font-medium text-sm tracking-tight">Overview</h3>
          </div>
          <div className="font-bold text-2xl">Welcome</div>
          <p className="mt-1 text-muted-foreground text-xs">This is your new blank template.</p>
        </div>
      </div>
    </div>
  );
}
