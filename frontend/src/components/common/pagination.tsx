import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";

export const PAGE_SIZES = [10, 20, 50] as const;

interface PaginationProps {
  /** Zero-based current page. */
  page: number;
  size: number;
  totalElements: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  onSizeChange: (size: number) => void;
  noun?: string;
}

/** Page numbers to show: always first/last, a window around the current page, with gaps as null. */
export function pageWindow(current: number, total: number): (number | null)[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i);
  const pages = new Set<number>([0, total - 1, current - 1, current, current + 1]);
  const sorted = [...pages].filter((p) => p >= 0 && p < total).sort((a, b) => a - b);
  const result: (number | null)[] = [];
  sorted.forEach((p, index) => {
    const previous = sorted[index - 1];
    if (previous !== undefined && p - previous > 1) result.push(null);
    result.push(p);
  });
  return result;
}

export function Pagination({ page, size, totalElements, totalPages, onPageChange, onSizeChange, noun = "employees" }: PaginationProps) {
  const from = totalElements === 0 ? 0 : page * size + 1;
  const to = Math.min((page + 1) * size, totalElements);
  const lastPage = Math.max(totalPages - 1, 0);

  return (
    <div className="flex flex-col gap-3 border-t border-border px-4 py-3 text-sm sm:flex-row sm:items-center sm:justify-between">
      <p className="text-muted-foreground" aria-live="polite">
        Showing <span className="font-medium text-foreground">{from}–{to}</span> of{" "}
        <span className="font-medium text-foreground">{totalElements}</span> {noun}
      </p>

      <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
        <label className="flex items-center gap-2 text-muted-foreground">
          Rows per page
          <Select
            aria-label="Rows per page"
            value={size}
            onChange={(event) => onSizeChange(Number(event.target.value))}
            className="w-[4.5rem]"
          >
            {PAGE_SIZES.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </Select>
        </label>

        <nav aria-label="Pagination" className="flex items-center gap-1">
          <Button variant="secondary" size="icon" aria-label="Previous page" disabled={page <= 0} onClick={() => onPageChange(page - 1)}>
            <ChevronLeft />
          </Button>
          <span className="px-2 text-muted-foreground sm:hidden">
            Page {Math.min(page + 1, Math.max(totalPages, 1))} of {Math.max(totalPages, 1)}
          </span>
          <ul className="hidden items-center gap-1 sm:flex">
            {pageWindow(page, totalPages).map((entry, index) =>
              entry === null ? (
                <li key={`gap-${index}`} aria-hidden className="px-1 text-muted-foreground">
                  …
                </li>
              ) : (
                <li key={entry}>
                  <Button
                    variant={entry === page ? "primary" : "ghost"}
                    size="icon"
                    aria-label={`Page ${entry + 1}`}
                    aria-current={entry === page ? "page" : undefined}
                    onClick={() => onPageChange(entry)}
                  >
                    {entry + 1}
                  </Button>
                </li>
              ),
            )}
          </ul>
          <Button variant="secondary" size="icon" aria-label="Next page" disabled={page >= lastPage} onClick={() => onPageChange(page + 1)}>
            <ChevronRight />
          </Button>
        </nav>
      </div>
    </div>
  );
}
