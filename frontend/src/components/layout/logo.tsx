import Image from "next/image";
import { cn } from "@/lib/utils";
import mark from "./logo-mark.png";

export const APP_NAME = "Rosterly";

interface LogoProps {
  className?: string;
  showName?: boolean;
  /** `light` is for dark backgrounds (white wordmark). */
  tone?: "dark" | "light";
  size?: "sm" | "md" | "lg";
}

const SIZES = { sm: 28, md: 36, lg: 56 } as const;

/** The Rosterly mark (src/app/logo.png, downsized) plus wordmark. Unoptimised: it is a tiny static asset. */
export function Logo({ className, showName = true, tone = "dark", size = "md" }: LogoProps) {
  const px = SIZES[size];
  return (
    <span className={cn("inline-flex items-center gap-2.5", className)}>
      <Image
        src={mark}
        alt=""
        aria-hidden
        width={px}
        height={px}
        unoptimized
        priority
        className={cn("rounded-[28%]", tone === "light" ? "shadow-[0_0_0_1.5px_rgb(255_255_255/0.35),0_6px_16px_-4px_rgb(0_0_0/0.5)]" : "shadow-[0_6px_16px_-6px_rgb(20_27_88/0.55)]")}
      />
      {showName && (
        <span
          className={cn(
            "font-display font-bold tracking-tight",
            size === "lg" ? "text-3xl" : "text-[19px]",
            tone === "light" ? "text-white" : "text-navy",
          )}
        >
          {APP_NAME}
        </span>
      )}
    </span>
  );
}
