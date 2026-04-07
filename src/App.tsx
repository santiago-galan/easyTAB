import { useState } from "react";
import { TournamentProvider } from "./context/TournamentContext";
import { ThemeProvider } from "./context/ThemeContext";
import Layout from "./components/Layout";
import TeamsPage from "./modules/teams/TeamsPage";
import PairingsPage from "./modules/pairings/PairingsPage";
import ResultsPage from "./modules/results/ResultsPage";
import TabulatorPage from "./modules/tabulator/TabulatorPage";

export type ModuleKey = "teams" | "pairings" | "results" | "tabulator";

export default function App(): JSX.Element {
  const [activeModule, setActiveModule] = useState<ModuleKey>("teams");

  const renderModule = (): JSX.Element => {
    switch (activeModule) {
      case "teams":
        return <TeamsPage />;
      case "pairings":
        return <PairingsPage />;
      case "results":
        return <ResultsPage />;
      case "tabulator":
        return <TabulatorPage />;
    }
  };

  return (
    <ThemeProvider>
      <TournamentProvider>
        <Layout activeModule={activeModule} onModuleChange={setActiveModule}>
          {renderModule()}
        </Layout>
      </TournamentProvider>
    </ThemeProvider>
  );
}
