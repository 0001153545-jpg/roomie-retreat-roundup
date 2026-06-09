import { useCurrency } from "@/contexts/CurrencyContext";
import { cn } from "@/lib/utils";

interface PriceDisplayProps {
  value: number;
  className?: string;
  /** Visual size variant. */
  size?: "xs" | "sm" | "base" | "lg" | "xl" | "2xl";
  /** Render with line-through (e.g. original price). */
  strikethrough?: boolean;
  /** Optional weight override (defaults: strong unless strikethrough). */
  weight?: "normal" | "medium" | "semibold" | "bold";
}

const sizeMap: Record<NonNullable<PriceDisplayProps["size"]>, string> = {
  xs: "text-xs",
  sm: "text-sm",
  base: "text-base",
  lg: "text-lg",
  xl: "text-xl",
  "2xl": "text-2xl",
};

const weightMap: Record<NonNullable<PriceDisplayProps["weight"]>, string> = {
  normal: "font-normal",
  medium: "font-medium",
  semibold: "font-semibold",
  bold: "font-bold",
};

/**
 * Single source of truth for rendering prices across the site.
 * - Always uses the body (sans) font so the currency symbol matches the digits
 * - Always tabular-nums so digits/commas/periods occupy the same horizontal slot
 * - Never wraps between the symbol and the value
 * - Vertically centered via inline-flex + items-baseline
 */
const PriceDisplay = ({
  value,
  className,
  size = "base",
  strikethrough = false,
  weight,
}: PriceDisplayProps) => {
  const { formatPrice } = useCurrency();
  const effectiveWeight = weight ?? (strikethrough ? "medium" : "bold");
  return (
    <span
      className={cn(
        "money inline-flex items-baseline whitespace-nowrap",
        sizeMap[size],
        weightMap[effectiveWeight],
        strikethrough && "line-through text-muted-foreground",
        className,
      )}
    >
      {formatPrice(value)}
    </span>
  );
};

export default PriceDisplay;
