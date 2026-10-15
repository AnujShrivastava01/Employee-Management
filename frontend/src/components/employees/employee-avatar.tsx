import { initials } from "@/lib/format";
import { cn } from "@/lib/utils";

// Soft, low-saturation pairs so avatars feel varied without competing with the accent colour.
const TONES = [
  "bg-[#eef2ff] text-[#4338ca]",
  "bg-[#ecfdf3] text-[#067647]",
  "bg-[#fff6ed] text-[#b93815]",
  "bg-[#f0f9ff] text-[#026aa2]",
  "bg-[#fdf2fa] text-[#c11574]",
  "bg-[#f4f3ff] text-[#5925dc]",
];

function toneFor(name: string): string {
  let hash = 0;
  for (const char of name) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  return TONES[hash % TONES.length] ?? TONES[0]!;
}

const SIZES = { sm: "size-8 text-xs", md: "size-10 text-sm", lg: "size-16 text-xl" } as const;

export function EmployeeAvatar({ name, size = "md", className }: { name: string; size?: keyof typeof SIZES; className?: string }) {
  return (
    <span
      aria-hidden
      className={cn("inline-grid shrink-0 place-items-center rounded-full font-semibold", SIZES[size], toneFor(name), className)}
    >
      {initials(name)}
    </span>
  );
}
