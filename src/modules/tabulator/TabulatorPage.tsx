import { useTournament } from "@/context/TournamentContext";

export default function TabulatorPage(): JSX.Element {
  const { activeTournament } = useTournament();

  return (
    <div className="flex flex-col h-full">
      <header className="flex items-center justify-between px-6 py-4 border-b border-border flex-none">
        <div>
          <h1 className="text-base font-semibold text-white">Tabulator</h1>
          <p className="text-xs text-muted mt-0.5">
            {activeTournament?.name ?? "No tournament selected"}
          </p>
        </div>
      </header>

      <div className="flex-1 flex items-center justify-center text-center">
        <div>
          <p className="text-subtle font-medium">Module 4 — Not yet implemented</p>
          <p className="text-muted text-sm mt-1">
            Tabulator will be built in the next module cycle.
          </p>
        </div>
      </div>
    </div>
  );
}
