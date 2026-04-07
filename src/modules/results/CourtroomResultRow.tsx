import type { BallotType, CourtroomResult, Pairing, Team } from "@/types";
import BallotEntryModal from "./BallotEntryModal";
import { useState } from "react";

interface Props {
  pairing: Pairing;
  result: CourtroomResult | null;
  teams: Team[];
  ballotType: BallotType;
  onSave: (updated: CourtroomResult) => void;
}

function teamById(teams: Team[], id: number): Team | undefined {
  return teams.find((t) => t.teamId === id);
}

function statusBadge(result: CourtroomResult | null): JSX.Element {
  if (!result || result.ballots.length === 0) {
    return (
      <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-surface-3 text-muted border border-border">
        Not started
      </span>
    );
  }
  if (result.isComplete) {
    if (result.isTieMatch) {
      return (
        <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-yellow-800/40 text-yellow-300 border border-yellow-700/40">
          Tie match
        </span>
      );
    }
    return (
      <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-green-900/40 text-green-400 border border-green-700/40">
        Complete
      </span>
    );
  }
  return (
    <span className="px-2 py-0.5 rounded text-[10px] font-medium bg-yellow-900/30 text-yellow-400 border border-yellow-700/30">
      Partial
    </span>
  );
}

export default function CourtroomResultRow({
  pairing,
  result,
  teams,
  ballotType,
  onSave,
}: Props): JSX.Element {
  const [modalOpen, setModalOpen] = useState(false);

  const petTeam = teamById(teams, pairing.petitionerTeamId);
  const resTeam = teamById(teams, pairing.respondentTeamId);

  // Row display uses team IDs for quick reference; modal uses school names
  const petId = `#${pairing.petitionerTeamId}`;
  const resId = `#${pairing.respondentTeamId}`;
  const petName = petTeam?.schoolName ?? `Team ${pairing.petitionerTeamId}`;
  const resName = resTeam?.schoolName ?? `Team ${pairing.respondentTeamId}`;

  const ballotProgress = result
    ? `${result.ballots.length} / ${result.judgeCount}`
    : "0 / ?";

  const winnerLabel = (() => {
    if (!result || result.ballots.length === 0) return null;
    if (result.isTieMatch) return "Tied";
    if (result.matchWinnerId === pairing.petitionerTeamId) return `${petId} wins`;
    if (result.matchWinnerId === pairing.respondentTeamId) return `${resId} wins`;
    return null;
  })();

  const emptyResult: CourtroomResult = {
    courtroomId: pairing.courtroomId,
    courtroomName: pairing.courtroomName,
    roundNumber: pairing.roundNumber,
    petitionerTeamId: pairing.petitionerTeamId,
    respondentTeamId: pairing.respondentTeamId,
    judgeCount: 3,
    ballots: [],
    isComplete: false,
    matchWinnerId: null,
    isTieMatch: false,
  };

  return (
    <>
      <button
        onClick={() => setModalOpen(true)}
        className="w-full flex items-center gap-4 px-4 py-3 bg-surface-2 hover:bg-surface-3 border border-border rounded transition-colors text-left group"
      >
        <div className="w-36 flex-none">
          <p className="text-xs font-medium text-white truncate">
            {pairing.courtroomName}
          </p>
        </div>

        <div className="flex items-center gap-2 flex-none">
          <span className="text-sm text-accent font-semibold tabular-nums">{petId}</span>
          <span className="text-muted text-xs">v.</span>
          <span className="text-sm text-subtle font-semibold tabular-nums">{resId}</span>
        </div>

        <div className="flex-1 min-w-0">
          <span className="text-xs text-muted truncate">
            {petName} vs. {resName}
          </span>
        </div>

        <div className="flex items-center gap-3 flex-none">
          {winnerLabel && (
            <span className="text-xs text-muted hidden sm:inline">{winnerLabel}</span>
          )}
          <span className="text-xs text-muted tabular-nums">
            {ballotProgress} ballots
          </span>
          {statusBadge(result)}
          <span className="text-muted text-xs group-hover:text-subtle transition-colors">
            &rsaquo;
          </span>
        </div>
      </button>

      {modalOpen && (
        <BallotEntryModal
          result={result ?? emptyResult}
          ballotType={ballotType}
          petitionerName={petName}
          respondentName={resName}
          petitionerOrator1={petTeam?.orator1 ?? "Oralist 1"}
          petitionerOrator2={petTeam?.orator2 ?? "Oralist 2"}
          respondentOrator1={resTeam?.orator1 ?? "Oralist 1"}
          respondentOrator2={resTeam?.orator2 ?? "Oralist 2"}
          onSave={(updated) => {
            onSave(updated);
            setModalOpen(false);
          }}
          onClose={() => setModalOpen(false)}
        />
      )}
    </>
  );
}
