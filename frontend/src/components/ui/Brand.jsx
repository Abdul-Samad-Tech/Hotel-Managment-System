import { Link } from "react-router-dom";

export function Logo({ compact = false, tone = "light" }) {
  const title = tone === "dark" ? "text-navy" : "text-white";
  const sub = tone === "dark" ? "text-navy/60" : "text-white/75";
  return (
    <Link to="/" className={`flex min-w-0 items-center gap-2 sm:gap-2.5 ${title}`}>
      <img
        src="/assets/azure-bay/logo-mark.svg"
        alt=""
        className={compact ? "h-7 w-9 sm:h-9 sm:w-12" : "h-9 w-12"}
      />
      <span className="min-w-0 leading-none">
        <span className={`block truncate font-display tracking-wide ${compact ? "text-[15px] sm:text-lg" : "text-xl"}`}>
          Azure Bay
        </span>
        <span className={`mt-1 block font-medium uppercase ${sub} ${compact ? "text-[8px] tracking-[0.16em] sm:text-[9px] sm:tracking-[0.28em]" : "text-[9px] tracking-[0.28em]"}`}>
          Hotel & Resort
        </span>
      </span>
    </Link>
  );
}

export function InstagramIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
      <rect x="3.5" y="3.5" width="17" height="17" rx="5" />
      <circle cx="12" cy="12" r="4" />
      <circle cx="17.5" cy="6.5" r="0.8" fill="currentColor" stroke="none" />
    </svg>
  );
}

export function FacebookIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden="true">
      <path d="M14.5 8.5H16V6h-1.8C11.8 6 11 7.2 11 9.1V10H9.5v2.5H11V19h2.6v-6.5h2.1l.4-2.5H13.6V9.2c0-.6.3-.7.9-.7Z" />
    </svg>
  );
}

export function XIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden="true">
      <path d="M6 5.5h2.4l3.3 4.4 3.8-4.4H18l-4.8 5.5L18.4 18.5h-2.4l-3.7-4.9-4.2 4.9H6.2l5.2-6L6 5.5Z" />
    </svg>
  );
}

export function YouTubeIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor" aria-hidden="true">
      <path d="M20.2 8.2a2.4 2.4 0 0 0-1.7-1.7C17 6.1 12 6.1 12 6.1s-5 0-6.5.4a2.4 2.4 0 0 0-1.7 1.7A25 25 0 0 0 3.4 12a25 25 0 0 0 .4 3.8 2.4 2.4 0 0 0 1.7 1.7c1.5.4 6.5.4 6.5.4s5 0 6.5-.4a2.4 2.4 0 0 0 1.7-1.7 25 25 0 0 0 .4-3.8 25 25 0 0 0-.4-3.8ZM10.6 14.8V9.2L15.2 12l-4.6 2.8Z" />
    </svg>
  );
}
