import type { BallotCriterion } from "@/types";
import { isFlaggedScore } from "@/lib/ballotConfig";

interface Props {
  oralistName: string;
  criteria: BallotCriterion[];
  scores: Record<string, number>;
  onChange: (criterionId: string, value: number) => void;
  disabled?: boolean;
}

export default function OralistScoreForm({
  oralistName,
  criteria,
  scores,
  onChange,
  disabled = false,
}: Props): JSX.Element {
  const total = criteria.reduce((s, c) => s + (scores[c.id] ?? 0), 0);

  const handleChange = (criterionId: string, max: number, raw: string) => {
    const parsed = parseInt(raw, 10);
    if (isNaN(parsed)) return;
    const clamped = Math.max(0, Math.min(max, parsed));
    onChange(criterionId, clamped);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-white truncate max-w-[14rem]">
          {oralistName}
        </p>
        <span className="text-xs text-muted tabular-nums">
          Total: <span className="text-white font-medium">{total}</span>
        </span>
      </div>

      <div className="space-y-1.5">
        {criteria.map((criterion) => {
          const score = scores[criterion.id] ?? 0;
          const flagged = isFlaggedScore(score, criterion);

          return (
            <div key={criterion.id} className="flex items-center gap-2">
              <label className="flex-1 text-xs text-muted leading-tight">
                {criterion.label}
                <span className="ml-1 text-[10px] text-subtle">
                  (0–{criterion.max})
                </span>
              </label>
              <input
                type="number"
                min={0}
                max={criterion.max}
                step={1}
                value={score}
                disabled={disabled}
                onChange={(e) =>
                  handleChange(criterion.id, criterion.max, e.target.value)
                }
                className={[
                  "w-16 px-2 py-1 text-sm text-center rounded border transition-colors",
                  "bg-surface-3 focus:outline-none focus:border-accent",
                  disabled ? "opacity-50 cursor-not-allowed" : "",
                  flagged
                    ? "border-red-500 text-red-400"
                    : "border-border text-white",
                ].join(" ")}
              />
              {flagged && (
                <span
                  className="text-red-400 text-[10px] w-3 text-center select-none"
                  title={`Below 50% of maximum (${criterion.max})`}
                >
                  !
                </span>
              )}
              {!flagged && <span className="w-3" />}
            </div>
          );
        })}
      </div>
    </div>
  );
}
