import { initials } from "@/lib/format";
import { cn } from "@/lib/utils";

// Gradient pairs drawn from the brand palette so avatars feel varied but belong to the same family.
const TONES = [
  "from-[#6b7bea] to-[#3b4bd0] text-white",
  "from-[#ff9a7e] to-[#ff6a45] text-white",
  "from-[#2f3fb5] to-[#1f2a7a] text-white",
  "from-[#8b9bf5] to-[#5463e0] text-white",
  "from-[#ffb199] to-[#ff7a59] text-white",
  "from-[#4b5bdc] to-[#2b38a6] text-white",
];

function toneFor(name: string): string {
  let hash = 0;
  for (const char of name) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  return TONES[hash % TONES.length] ?? TONES[0]!;
}

const SIZES = { sm: "size-8 text-xs", md: "size-10 text-sm", lg: "size-20 text-2xl" } as const;

export function EmployeeAvatar({ name, size = "md", className }: { name: string; size?: keyof typeof SIZES; className?: string }) {
  return (
    <span
      aria-hidden
      className={cn("inline-grid shrink-0 place-items-center rounded-full bg-gradient-to-br font-semibold shadow-sm ring-2 ring-white", SIZES[size], toneFor(name), className)}
    >
      {initials(name)}
    </span>
  );
}
