import { useState } from "react";
import type { BallotType, CourtroomResult, GeneratedRound, Team } from "@/types";
import CourtroomResultRow from "./CourtroomResultRow";

interface Props {
  round: GeneratedRound;
  results: CourtroomResult[];
  teams: Team[];
  ballotType: BallotType;
  onSave: (updated: CourtroomResult) => void;
}

export default function RoundSection({
  round,
  results,
  teams,
  ballotType,
  onSave,
}: Props): JSX.Element {
  const [collapsed, setCollapsed] = useState(false);

  const total = round.pairings.length;
  const complete = results.filter((r) => r.isComplete).length;
  const partial = results.filter((r) => !r.isComplete && r.ballots.length > 0).length;

  const summaryLabel =
    complete === total
      ? "All complete"
      : partial > 0 || complete > 0
      ? `${complete} / ${total} complete, ${partial} partial`
      : "No results entered";

  return (
    <div className="space-y-2">
      <button
        onClick={() => setCollapsed((c) => !c)}
        className="w-full flex items-center justify-between py-2 group"
      >
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold text-white">
            Round {round.roundNumber}
          </span>
          <span className="text-xs text-muted">{summaryLabel}</span>
          {complete === total && total > 0 && (
            <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-green-900/40 text-green-400 border border-green-700/40">
              Done
            </span>
          )}
        </div>
        <span className="text-muted text-xs group-hover:text-subtle transition-colors">
          {collapsed ? "▸" : "▾"}
        </span>
      </button>

      {!collapsed && (
        <div className="space-y-1.5 pl-1">
          {round.pairings.map((pairing) => {
            const result =
              results.find(
                (r) =>
                  r.courtroomId === pairing.courtroomId &&
                  r.roundNumber === pairing.roundNumber
              ) ?? null;
            return (
              <CourtroomResultRow
                key={pairing.courtroomId}
                pairing={pairing}
                result={result}
                teams={teams}
                ballotType={ballotType}
                onSave={onSave}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}
