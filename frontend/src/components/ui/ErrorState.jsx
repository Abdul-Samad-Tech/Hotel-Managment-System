export function ErrorState({ title, text, onRetry, children }) {
  return (
    <div role="alert" className="rounded-2xl border border-rose-200 bg-white px-6 py-8 text-center shadow-[0_16px_40px_rgba(7,27,43,0.06)]">
      <p className="font-display text-2xl text-navy">{title}</p>
      {text ? <p className="mx-auto mt-2 max-w-md text-sm leading-7 text-muted">{text}</p> : null}
      {onRetry ? (
        <button
          type="button"
          onClick={onRetry}
          className="mt-5 inline-flex h-11 cursor-pointer items-center rounded-full bg-navy px-5 text-sm font-semibold text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
        >
          Try again
        </button>
      ) : null}
      {children ? <div className="mt-5 flex justify-center">{children}</div> : null}
    </div>
  );
}
