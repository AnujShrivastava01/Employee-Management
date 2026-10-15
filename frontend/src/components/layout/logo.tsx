import { cn } from "@/lib/utils";

export const APP_NAME = "Rosterly";

/** Simple monogram + wordmark; pure SVG/CSS so there are no image requests. */
export function Logo({ className, showName = true }: { className?: string; showName?: boolean }) {
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <span
        aria-hidden
        className="grid size-8 place-items-center rounded-lg bg-accent text-accent-foreground shadow-sm"
      >
        <svg viewBox="0 0 24 24" className="size-[18px]" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
          <path d="M7 20V4h6a4.5 4.5 0 0 1 0 9H7" />
          <path d="m13 13 4.5 7" />
        </svg>
      </span>
      {showName && <span className="text-[17px] font-semibold tracking-tight text-foreground">{APP_NAME}</span>}
    </span>
  );
}
