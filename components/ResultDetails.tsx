import { cn } from "@/components/ui";
import type { AdminActionState } from "@/lib/public-types";

export function ResultDetails({ state }: { state: AdminActionState | null }) {
  if (!state) return null;
  return (
    <div
      className={cn(
        "mt-3 rounded-2xl border-2 border-ink p-3 text-sm text-ink",
        state.ok ? "bg-ok-soft" : "bg-bad-soft",
      )}
      role="status"
    >
      <p className="font-medium">{state.message}</p>
      {state.details && state.details.length > 0 && (
        <ul className="mt-1 space-y-0.5 font-mono text-xs break-all">
          {state.details.map((line, index) => (
            <li key={index}>{line}</li>
          ))}
        </ul>
      )}
    </div>
  );
}
