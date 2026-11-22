import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import { rooms } from "../data/rooms";
import { navLinks } from "../data/site";
import { duration, easeTide } from "../lib/motion";

const suggestions = [
  ...navLinks.filter((link) => link.href !== "/"),
  ...rooms.slice(0, 4).map((room) => ({ label: room.name, href: `/rooms/${room.id}` })),
];

export function NotFoundPage() {
  const reduce = useReducedMotion();
  const navigate = useNavigate();
  const [query, setQuery] = useState("");

  function search(event) {
    event.preventDefault();
    const next = query.trim();
    navigate(next ? `/rooms?q=${encodeURIComponent(next)}` : "/rooms");
  }

  return (
    <main className="bg-cream px-6 pt-36 pb-24">
      <div className="page-wrap max-w-xl text-center">
        <svg viewBox="0 0 240 28" className="mx-auto h-8 w-48 text-gold" aria-hidden="true">
          <motion.path
            d="M4 18c18-12 36-12 54 0s36 12 54 0 36-12 54 0 36 12 70 0"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.6"
            strokeLinecap="round"
            initial={{ pathLength: reduce ? 1 : 0 }}
            animate={{ pathLength: 1 }}
            transition={{ duration: reduce ? duration.micro : duration.reveal, ease: easeTide }}
          />
        </svg>
        <h1 className="mt-4 font-display text-4xl text-navy">Page not found</h1>
        <p className="mt-3 text-sm leading-7 text-muted">That address is not on Azure Bay. Try a page below, or search the rooms.</p>
        <form onSubmit={search} className="mx-auto mt-6 flex max-w-md gap-2">
          <label className="sr-only" htmlFor="missing-search">Search rooms</label>
          <input
            id="missing-search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search rooms"
            className="h-11 min-w-0 flex-1 rounded-full border border-navy/15 bg-white px-4 text-sm text-navy focus-visible:outline-2 focus-visible:outline-gold"
          />
          <button type="submit" className="inline-flex h-11 cursor-pointer items-center rounded-full bg-gold px-4 text-sm font-semibold text-navy focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy">
            Search
          </button>
        </form>
        <ul className="mt-6 flex flex-wrap justify-center gap-2">
          {suggestions.map((item) => (
            <li key={item.href}>
              <Link
                to={item.href}
                className="inline-flex h-11 items-center rounded-full bg-white px-4 text-sm font-semibold text-navy shadow-[0_8px_24px_rgba(7,27,43,0.06)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}
