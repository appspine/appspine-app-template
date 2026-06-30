export default function Page() {
  return (
    <div className="flex flex-col gap-4 md:gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold tracking-tight">Dashboard</h1>
      </div>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {/* Placeholder cards to show layout structure */}
        <div className="rounded-xl border bg-card p-6 text-card-foreground shadow-sm">
          <div className="flex flex-row items-center justify-between space-y-0 pb-2">
            <h3 className="text-sm font-medium tracking-tight">Overview</h3>
          </div>
          <div className="text-2xl font-bold">Welcome</div>
          <p className="text-xs text-muted-foreground mt-1">
            This is your new blank template.
          </p>
        </div>
      </div>
    </div>
  );
}
