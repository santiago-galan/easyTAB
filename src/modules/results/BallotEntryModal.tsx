import { useState, useEffect } from "react";
import type { BallotType, CourtroomResult, JudgeBallot } from "@/types";
import { getCriteria, emptyOralistCriteria } from "@/lib/ballotConfig";
import {
  buildOralistScore,
  computeJudgeTotals,
  resolveBallotWinner,
  resolveMatchWinner,
} from "./lib/scoreCalculator";
import OralistScoreForm from "./OralistScoreForm";

interface Props {
  result: CourtroomResult;
  ballotType: BallotType;
  petitionerName: string; // school name or team code
  respondentName: string;
  petitionerOrator1: string;
  petitionerOrator2: string;
  respondentOrator1: string;
  respondentOrator2: string;
  onSave: (updated: CourtroomResult) => void;
  onClose: () => void;
}

type OralistKey = "petitionerOralist1" | "petitionerOralist2" | "respondentOralist1" | "respondentOralist2";

interface JudgeDraft {
  petitionerOralist1: Record<string, number>;
  petitionerOralist2: Record<string, number>;
  respondentOralist1: Record<string, number>;
  respondentOralist2: Record<string, number>;
}

function emptyDraft(ballotType: BallotType): JudgeDraft {
  const e = () => emptyOralistCriteria(ballotType);
  return { petitionerOralist1: e(), petitionerOralist2: e(), respondentOralist1: e(), respondentOralist2: e() };
}

function ballotToDraft(ballot: JudgeBallot): JudgeDraft {
  return {
    petitionerOralist1: { ...ballot.petitionerOralist1.criteria },
    petitionerOralist2: { ...ballot.petitionerOralist2.criteria },
    respondentOralist1: { ...ballot.respondentOralist1.criteria },
    respondentOralist2: { ...ballot.respondentOralist2.criteria },
  };
}

export default function BallotEntryModal({
  result,
  ballotType,
  petitionerName,
  respondentName,
  petitionerOrator1,
  petitionerOrator2,
  respondentOrator1,
  respondentOrator2,
  onSave,
  onClose,
}: Props): JSX.Element {
  const criteria = getCriteria(ballotType);

  const [judgeCount, setJudgeCount] = useState(result.judgeCount);
  const [activeJudge, setActiveJudge] = useState(1);

  // Draft state per judge index (1-based)
  const [drafts, setDrafts] = useState<Record<number, JudgeDraft>>(() => {
    const init: Record<number, JudgeDraft> = {};
    result.ballots.forEach((b) => { init[b.judgeIndex] = ballotToDraft(b); });
    return init;
  });

  // Ensure draft exists for activeJudge
  useEffect(() => {
    setDrafts((prev) => {
      if (prev[activeJudge]) return prev;
      return { ...prev, [activeJudge]: emptyDraft(ballotType) };
    });
  }, [activeJudge, ballotType]);

  const draft = drafts[activeJudge] ?? emptyDraft(ballotType);

  const updateOralist = (key: OralistKey, criterionId: string, value: number) => {
    setDrafts((prev) => ({
      ...prev,
      [activeJudge]: {
        ...prev[activeJudge],
        [key]: { ...(prev[activeJudge]?.[key] ?? {}), [criterionId]: value },
      },
    }));
  };

  const oralistNames: Record<OralistKey, string> = {
    petitionerOralist1: petitionerOrator1,
    petitionerOralist2: petitionerOrator2,
    respondentOralist1: respondentOrator1,
    respondentOralist2: respondentOrator2,
  };

  const buildBallot = (judgeIndex: number, d: JudgeDraft): JudgeBallot => {
    const p1 = buildOralistScore({ oralistName: oralistNames.petitionerOralist1, criteria: d.petitionerOralist1 }, ballotType);
    const p2 = buildOralistScore({ oralistName: oralistNames.petitionerOralist2, criteria: d.petitionerOralist2 }, ballotType);
    const r1 = buildOralistScore({ oralistName: oralistNames.respondentOralist1, criteria: d.respondentOralist1 }, ballotType);
    const r2 = buildOralistScore({ oralistName: oralistNames.respondentOralist2, criteria: d.respondentOralist2 }, ballotType);
    const base: JudgeBallot = {
      judgeIndex,
      petitionerOralist1: p1,
      petitionerOralist2: p2,
      respondentOralist1: r1,
      respondentOralist2: r2,
      petitionerTotal: 0,
      respondentTotal: 0,
      winnerTeamId: null,
      isTie: false,
    };
    const totals = computeJudgeTotals(base);
    const winner = resolveBallotWinner(
      { ...base, ...totals },
      result.petitionerTeamId,
      result.respondentTeamId
    );
    return { ...base, ...totals, ...winner };
  };

  const currentBallot = buildBallot(activeJudge, draft);
  const petTotal = currentBallot.petitionerTotal;
  const resTotal = currentBallot.respondentTotal;

  const handleSave = () => {
    const ballots: JudgeBallot[] = [];
    for (let i = 1; i <= judgeCount; i++) {
      const d = drafts[i];
      if (d) ballots.push(buildBallot(i, d));
    }
    const isComplete = ballots.length === judgeCount;

    const partial: CourtroomResult = { ...result, judgeCount, ballots, isComplete, matchWinnerId: null, isTieMatch: false };
    const { matchWinnerId, isTieMatch } = resolveMatchWinner(partial);

    onSave({ ...partial, matchWinnerId, isTieMatch });
  };

  const hasAnyTie = currentBallot.isTie;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="bg-surface-1 border border-border rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border flex-none">
          <div>
            <h2 className="text-sm font-semibold text-white">
              {result.courtroomName}: Ballot Entry
            </h2>
            <p className="text-xs text-muted mt-0.5">
              {petitionerName} (P) vs. {respondentName} (R) &mdash; {ballotType} Ballot
            </p>
          </div>
          <button
            onClick={onClose}
            className="text-muted hover:text-white text-xl leading-none transition-colors"
          >
            &times;
          </button>
        </div>

        {/* Judge count + tab row */}
        <div className="flex items-center gap-4 px-5 py-3 border-b border-border flex-none bg-surface-2">
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted">Judges:</span>
            <input
              type="number"
              min={1}
              max={9}
              step={1}
              value={judgeCount}
              onChange={(e) => {
                const v = Math.max(1, Math.min(9, parseInt(e.target.value, 10) || 1));
                setJudgeCount(v);
                if (activeJudge > v) setActiveJudge(v);
              }}
              className="w-12 px-2 py-0.5 text-sm text-center bg-surface-3 border border-border rounded text-white focus:outline-none focus:border-accent"
            />
          </div>
          <div className="flex items-center gap-1 flex-wrap">
            {Array.from({ length: judgeCount }, (_, i) => i + 1).map((n) => {
              const entered = !!drafts[n];
              return (
                <button
                  key={n}
                  onClick={() => setActiveJudge(n)}
                  className={[
                    "px-2.5 py-1 text-xs rounded transition-colors",
                    activeJudge === n
                      ? "bg-accent text-white font-medium"
                      : entered
                      ? "bg-surface-3 text-green-400"
                      : "bg-surface-3 text-muted hover:text-subtle",
                  ].join(" ")}
                >
                  Judge {n}
                </button>
              );
            })}
          </div>
        </div>

        {/* Score entry */}
        <div className="flex-1 overflow-auto px-5 py-4">
          <div className="grid grid-cols-2 gap-6">
            {/* Petitioner */}
            <div className="space-y-4">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-accent">
                Petitioner &mdash; {petitionerName}
              </p>
              <OralistScoreForm
                oralistName={petitionerOrator1}
                criteria={criteria}
                scores={draft.petitionerOralist1}
                onChange={(id, v) => updateOralist("petitionerOralist1", id, v)}
              />
              <div className="border-t border-border/50 pt-3">
                <OralistScoreForm
                  oralistName={petitionerOrator2}
                  criteria={criteria}
                  scores={draft.petitionerOralist2}
                  onChange={(id, v) => updateOralist("petitionerOralist2", id, v)}
                />
              </div>
            </div>

            {/* Respondent */}
            <div className="space-y-4">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-muted">
                Respondent &mdash; {respondentName}
              </p>
              <OralistScoreForm
                oralistName={respondentOrator1}
                criteria={criteria}
                scores={draft.respondentOralist1}
                onChange={(id, v) => updateOralist("respondentOralist1", id, v)}
              />
              <div className="border-t border-border/50 pt-3">
                <OralistScoreForm
                  oralistName={respondentOrator2}
                  criteria={criteria}
                  scores={draft.respondentOralist2}
                  onChange={(id, v) => updateOralist("respondentOralist2", id, v)}
                />
              </div>
            </div>
          </div>

          {/* Live totals bar */}
          <div className="mt-5 pt-4 border-t border-border flex items-center justify-between">
            <div className="text-sm">
              <span className="text-muted">Judge {activeJudge} totals: </span>
              <span className="text-accent font-semibold">{petTotal}</span>
              <span className="text-muted mx-2">vs.</span>
              <span className="text-subtle font-semibold">{resTotal}</span>
            </div>
            {hasAnyTie ? (
              <span className="px-2 py-0.5 rounded text-xs font-medium bg-yellow-800/40 text-yellow-300 border border-yellow-700/40">
                Tied &mdash; 0.5 ballots each
              </span>
            ) : (
              <span
                className={[
                  "px-2 py-0.5 rounded text-xs font-medium",
                  petTotal > resTotal
                    ? "bg-accent/20 text-accent border border-accent/30"
                    : resTotal > petTotal
                    ? "bg-surface-3 text-subtle border border-border"
                    : "text-muted",
                ].join(" ")}
              >
                {petTotal > resTotal
                  ? `${petitionerName} wins ballot`
                  : resTotal > petTotal
                  ? `${respondentName} wins ballot`
                  : "Enter scores above"}
              </span>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-5 py-3 border-t border-border flex-none bg-surface-2">
          <button
            onClick={onClose}
            className="px-3 py-1.5 text-sm text-muted hover:text-white transition-colors"
          >
            Cancel
          </button>
          <div className="flex items-center gap-3">
            {activeJudge < judgeCount && (
              <button
                onClick={() => setActiveJudge((n) => n + 1)}
                className="px-3 py-1.5 text-sm text-subtle hover:text-white border border-border hover:border-accent/50 rounded transition-colors"
              >
                Next Judge
              </button>
            )}
            <button
              onClick={handleSave}
              className="px-4 py-1.5 text-sm font-medium bg-accent hover:bg-accent-hover text-white rounded transition-colors"
            >
              Save Results
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
