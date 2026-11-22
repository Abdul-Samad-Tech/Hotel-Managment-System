import { useReducedMotion } from "framer-motion";

export function TextRoll({ children }) {
  const reduce = useReducedMotion();
  if (reduce) return <span>{children}</span>;

  return (
    <span className="relative inline-grid overflow-hidden leading-none">
      <span className="col-start-1 row-start-1 inline-flex items-center gap-2 transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:-translate-y-[120%]">
        {children}
      </span>
      <span
        aria-hidden="true"
        className="col-start-1 row-start-1 inline-flex translate-y-[120%] items-center gap-2 transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:translate-y-0"
      >
        {children}
      </span>
    </span>
  );
}
