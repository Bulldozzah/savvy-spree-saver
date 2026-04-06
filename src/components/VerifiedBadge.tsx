import { CheckCircle2, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

interface VerifiedBadgeProps {
  verified: boolean;
  className?: string;
  size?: "sm" | "md";
}

export const VerifiedBadge = ({ verified, className, size = "sm" }: VerifiedBadgeProps) => {
  const iconSize = size === "sm" ? "h-3 w-3" : "h-4 w-4";
  const textSize = size === "sm" ? "text-[10px]" : "text-xs";
  const padding = size === "sm" ? "px-1.5 py-0.5" : "px-2 py-1";

  if (verified) {
    return (
      <span className={cn(
        "inline-flex items-center gap-1 rounded-full font-semibold",
        padding, textSize,
        "bg-lime-500/20 text-lime-600 dark:bg-lime-500/30 dark:text-lime-400",
        className
      )}>
        <CheckCircle2 className={iconSize} />
        Verified
      </span>
    );
  }

  return (
    <span className={cn(
      "inline-flex items-center gap-1 rounded-full font-semibold",
      padding, textSize,
      "bg-red-500/20 text-red-600 dark:bg-red-500/30 dark:text-red-400",
      className
    )}>
      <AlertTriangle className={iconSize} />
      Not Verified
    </span>
  );
};
