import { rates, useLocale } from "../../context/LocaleContext";

export function Price({ value, className = "" }) {
  const { format } = useLocale();
  return <span className={className}>{format(value)}</span>;
}

/** Same as Price — CountUp removed (was announcing Rs 0 to assistive tech). */
export function PriceCount({ value, className = "" }) {
  return <Price value={value} className={className} />;
}

export function priceParts(value, currency) {
  const rate = rates[currency] || 1;
  const prefix = currency === "USD" ? "$" : currency === "AED" ? "AED " : "Rs ";
  return { amount: Math.round(Number(value) * rate), prefix };
}
