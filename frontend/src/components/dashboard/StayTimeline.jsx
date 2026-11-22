import { useEffect, useState } from "react";
import { ErrorState } from "../ui/ErrorState";
import { Skeleton } from "../ui/Skeleton";
import { api } from "../../lib/api";

const barFill = {
  confirmed: "#F2C078",
  checked_in: "#0B1F33",
  pending: "#5e6d78",
  checked_out: "#E8D5B5",
};

function utcToday() {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

function dayKey(date) {
  return date.toISOString().slice(0, 10);
}

export function StayTimeline({ pulse = 0 }) {
  const [rooms, setRooms] = useState([]);
  const [stays, setStays] = useState([]);
  const [state, setState] = useState("loading");
  const [fault, setFault] = useState("");

  useEffect(() => {
    setState("loading");
    Promise.all([api("/rooms"), api("/reservations")])
      .then(([roomData, stayData]) => {
        setRooms(roomData.rooms);
        setStays(stayData.reservations);
        setState("ready");
      })
      .catch((error) => {
        setFault(error.message);
        setState("error");
      });
  }, [pulse]);

  const start = utcToday();
  const days = Array.from({ length: 14 }, (_, index) => {
    const day = new Date(start);
    day.setUTCDate(start.getUTCDate() + index);
    return day;
  });
  const keys = days.map(dayKey);

  if (state === "loading") {
    return (
      <div className="mt-4" aria-busy="true">
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }
  if (state === "error") {
    return (
      <div className="mt-4">
        <ErrorState title="The room calendar could not load" text={fault} />
      </div>
    );
  }

  return (
    <section className="mt-4 overflow-x-auto rounded-2xl border border-navy/8 bg-cream p-4">
      <h3 className="font-display text-2xl text-navy">Room calendar</h3>
      <p className="mt-1 text-xs text-muted">The next 14 days. A bar is a stay that overlaps that day. Cancelled and no-show stays are left out.</p>
      <ul className="mt-2 flex flex-wrap gap-3 text-xs text-muted">
        <li className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-gold" /> Confirmed</li>
        <li className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-full bg-navy" /> In house</li>
        <li className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-full" style={{ background: "#5e6d78" }} /> Pending</li>
        <li className="inline-flex items-center gap-1.5"><span className="h-2 w-2 rounded-full" style={{ background: "#E8D5B5" }} /> Checked out</li>
      </ul>
      <div className="mt-4 min-w-[720px]">
        <div className="grid items-end gap-1" style={{ gridTemplateColumns: "4.5rem repeat(14, minmax(0, 1fr))" }}>
          <span />
          {days.map((day) => (
            <span key={dayKey(day)} className="text-center text-[10px] text-muted">
              {new Intl.DateTimeFormat("en", { day: "numeric", timeZone: "UTC" }).format(day)}
            </span>
          ))}
          {rooms.map((room) => {
            const roomStays = stays.filter((stay) => stay.roomNumber === room.roomNumber && !["cancelled", "no_show"].includes(stay.status));
            return (
              <div key={room.id} className="contents">
                <span className="py-2 text-xs font-medium text-navy">{room.roomNumber}</span>
                <div className="relative h-8 rounded-lg bg-white" style={{ gridColumn: "span 14" }}>
                  <div className="absolute inset-0 grid" style={{ gridTemplateColumns: "repeat(14, minmax(0, 1fr))" }}>
                    {keys.map((key) => (
                      <span key={key} className="border-l border-navy/5 first:border-l-0" />
                    ))}
                  </div>
                  {roomStays.map((stay) => {
                    let startIndex = keys.indexOf(stay.checkIn);
                    if (startIndex === -1) startIndex = stay.checkIn < keys[0] ? 0 : 14;
                    let endIndex = keys.findIndex((key) => key >= stay.checkOut);
                    if (endIndex === -1) endIndex = stay.checkOut > keys[13] ? 14 : startIndex;
                    if (endIndex <= startIndex || startIndex >= 14) return null;
                    const span = endIndex - startIndex;
                    return (
                      <span
                        key={stay.id}
                        title={`${stay.guest || "Guest"} · ${stay.confirmationCode} · ${stay.status}`}
                        className="absolute top-1 bottom-1 rounded-md"
                        style={{
                          left: `calc(${(startIndex / 14) * 100}% + 2px)`,
                          width: `calc(${(span / 14) * 100}% - 4px)`,
                          background: barFill[stay.status] || "#8A9AA6",
                        }}
                      />
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
        {!rooms.length && <p className="mt-3 text-sm text-muted">No rooms on the calendar.</p>}
      </div>
    </section>
  );
}
