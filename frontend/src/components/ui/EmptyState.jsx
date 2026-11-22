export function EmptyState({ title, text, children }) {
  return (
    <div role="status" className="rounded-2xl bg-white px-6 py-8 text-center shadow-[0_16px_40px_rgba(7,27,43,0.06)]">
      <p className="font-display text-2xl text-navy">{title}</p>
      {text ? <p className="mx-auto mt-2 max-w-md text-sm leading-7 text-muted">{text}</p> : null}
      {children ? <div className="mt-5 flex justify-center">{children}</div> : null}
    </div>
  );
}
