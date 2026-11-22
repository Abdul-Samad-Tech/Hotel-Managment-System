import { Link, useLocation } from "react-router-dom";
import { rooms } from "../../data/rooms";
import { legalPages } from "../../data/legal";
import { SearchDatesChip } from "../booking/SearchDatesChip";
import { showSearchChip } from "../../lib/sticky-bar";

const labels = {
  rooms: "Rooms",
  dining: "Dining",
  experiences: "Experiences",
  gallery: "Gallery",
  location: "Location",
  contact: "Contact",
  booking: "Booking",
  "my-bookings": "My bookings",
  messages: "Messages",
  privacy: "Privacy",
  terms: "Terms",
  support: "Support",
  portal: "Portal",
  guest: "Your stay",
  staff: "Desk",
  admin: "Admin",
};

export function Breadcrumbs() {
  const { pathname } = useLocation();
  if (pathname === "/") return null;

  const parts = pathname.split("/").filter(Boolean);
  const cream = /^\/(rooms\/|booking\/|my-bookings|portal|guest|staff|admin)/.test(pathname);
  const items = [{ to: "/", label: "Home" }];

  if (parts[0] === "rooms" && parts[1]) {
    const room = rooms.find((item) => item.id === parts[1]);
    items.push({ to: "/rooms", label: "Rooms" }, { label: room?.name || "Room" });
  } else if (parts[0] === "booking" && parts[1]) {
    const room = rooms.find((item) => item.id === parts[1]);
    items.push({ to: "/booking", label: "Booking" }, { label: room?.name || "Room" });
  } else if (legalPages[parts[0]] || labels[parts[0]]) {
    items.push({ label: labels[parts[0]] || legalPages[parts[0]]?.title });
  } else {
    items.push({ label: "Page not found" });
  }

  const tone = cream ? "text-navy/80" : "text-white/80";
  const chip = showSearchChip(pathname);

  return (
    <nav aria-label="Breadcrumb" className={`pointer-events-none absolute inset-x-0 top-[76px] z-40 ${tone}`}>
      <div className="page-wrap flex flex-wrap items-center justify-between gap-2">
      <ol className="pointer-events-auto flex min-w-0 flex-wrap items-center gap-1.5 text-xs">
        {items.map((item, index) => {
          const last = index === items.length - 1;
          return (
            <li key={`${item.label}-${index}`} className="inline-flex items-center gap-1.5">
              {index > 0 && <span aria-hidden="true">/</span>}
              {last || !item.to ? (
                <span className={cream ? "font-semibold text-navy" : "font-semibold text-white"} aria-current="page">
                  {item.label}
                </span>
              ) : (
                <Link to={item.to} className="underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-gold">
                  {item.label}
                </Link>
              )}
            </li>
          );
        })}
      </ol>
      {chip ? (
        <span className="pointer-events-auto ml-auto">
          <SearchDatesChip />
        </span>
      ) : null}
      </div>
    </nav>
  );
}
