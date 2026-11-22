import { useReducedMotion } from "framer-motion";

export function Marquee({ children, className = "" }) {
  const reduce = useReducedMotion();
  if (reduce) return <div className={className}>{children}</div>;

  return (
    <div className={`overflow-hidden ${className}`}>
      <div className="tide-marquee flex w-max gap-10">
        <div>{children}</div>
        <div aria-hidden="true">{children}</div>
      </div>
    </div>
  );
}
