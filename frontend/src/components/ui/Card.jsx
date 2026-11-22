import { cn } from "../../lib/cn";

export function Card({ title, className = "", children }) {
  return (
    <article className={cn("rounded-2xl bg-card p-5 text-card-foreground shadow-[0_16px_40px_rgba(7,27,43,0.08)]", className)}>
      {title ? <h3 className="font-display text-xl text-navy">{title}</h3> : null}
      {title ? <div className="mt-3">{children}</div> : children}
    </article>
  );
}
