import { useState } from "react";
import type { ModuleKey } from "@/App";
import { useTheme } from "@/context/ThemeContext";
import { getRandomFact } from "@/lib/uchicagoFacts";
import TournamentSelector from "./TournamentSelector";

interface NavItem {
  key: ModuleKey;
  label: string;
  number: string;
}

const NAV_ITEMS: NavItem[] = [
  { key: "teams", label: "Team Ingestion", number: "01" },
  { key: "pairings", label: "Pairing Engine", number: "02" },
  { key: "results", label: "Results Manager", number: "03" },
  { key: "tabulator", label: "Tabulator", number: "04" },
];

interface SidebarProps {
  activeModule: ModuleKey;
  onModuleChange: (module: ModuleKey) => void;
}

export default function Sidebar({
  activeModule,
  onModuleChange,
}: SidebarProps): JSX.Element {
  const { theme, toggle } = useTheme();
  const [fact, setFact] = useState(() => getRandomFact());

  return (
    <aside className="w-56 flex-none flex flex-col bg-surface-1 border-r border-border">
      <div className="px-4 py-5 border-b border-border">
        <span className="text-sm font-semibold tracking-widest text-accent uppercase">
          PhoenixTAB
        </span>
        <p className="text-xs text-muted mt-0.5">Moot Court Tabulation</p>
      </div>

      <TournamentSelector />

      <nav className="flex-1 px-2 py-3">
        <p className="px-2 mb-2 text-xs font-medium text-muted uppercase tracking-wider">
          Modules
        </p>
        <ul className="space-y-0.5">
          {NAV_ITEMS.map((item) => {
            const isActive = activeModule === item.key;
            return (
              <li key={item.key}>
                <button
                  onClick={() => onModuleChange(item.key)}
                  className={[
                    "w-full flex items-center gap-3 px-3 py-2 rounded text-sm transition-colors text-left",
                    isActive
                      ? "bg-accent text-white font-medium"
                      : "text-subtle hover:bg-surface-2 hover:text-subtle",
                  ].join(" ")}
                >
                  <span
                    className={[
                      "font-mono text-xs",
                      isActive ? "text-white/70" : "text-muted",
                    ].join(" ")}
                  >
                    {item.number}
                  </span>
                  {item.label}
                </button>
              </li>
            );
          })}
        </ul>
      </nav>

      <div className="px-3 py-3 border-t border-border space-y-2">
        <button
          onClick={() => setFact(getRandomFact())}
          title="Show another fact"
          className="w-full text-left group"
        >
          <p className="text-xs text-muted leading-relaxed group-hover:text-subtle transition-colors">
            {fact}
          </p>
          <p className="text-xs text-muted/40 mt-1 group-hover:text-muted transition-colors">
            tap for another fact
          </p>
        </button>

        <div className="flex items-center justify-between pt-1">
          <span className="text-xs text-muted/50">Offline — Local Only</span>
          <button
            onClick={toggle}
            title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
            className="flex items-center justify-center w-7 h-7 rounded hover:bg-surface-2 text-muted hover:text-subtle transition-colors"
          >
            {theme === "dark" ? (
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707M17.657 17.657l-.707-.707M6.343 6.343l-.707-.707M12 8a4 4 0 100 8 4 4 0 000-8z" />
              </svg>
            ) : (
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                  d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
            )}
          </button>
        </div>
      </div>
    </aside>
  );
}
