export function InlineError({ id, children }) {
  if (!children) return null;

  return (
    <p id={id} role="alert" tabIndex={-1} className="mt-1.5 text-sm text-rose-700">
      {children}
    </p>
  );
}
