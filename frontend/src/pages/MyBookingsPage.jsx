import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { differenceInCalendarDays } from "date-fns";
import { useAuth } from "../context/AuthContext";
import { api } from "../lib/api";
import { homeFor } from "../lib/roles";
import { AlertDialog } from "../components/ui/AlertDialog";
import { Badge } from "../components/ui/Badge";
import { BookingsEmptyState } from "../components/ui/SmartEmpty";
import { EmptyState } from "../components/ui/EmptyState";
import { Skeleton, TableRowSkeleton } from "../components/ui/Skeleton";
import { Tabs } from "../components/ui/Tabs";
import { notify } from "../components/ui/BayToaster";
import { ErrorState } from "../components/ui/ErrorState";
import { Price } from "../components/ui/Price";

const tabs = [
  { value: "upcoming", label: "Upcoming" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
];

function parseDay(value) {
  const [year, month, day] = value.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function bucket(row) {
  if (row.status === "cancelled" || row.status === "no_show") return "cancelled";
  if (row.status === "checked_out") return "completed";
  return "upcoming";
}

function statusTone(status) {
  if (status === "confirmed" || status === "pending") return "gold";
  if (status === "checked_in") return "navy";
  return "outline";
}

function statusLabel(status) {
  return {
    pending: "Pending",
    confirmed: "Confirmed",
    checked_in: "Checked in",
    checked_out: "Completed",
    cancelled: "Cancelled",
    no_show: "No-show",
  }[status] || status;
}

function countdown(checkIn) {
  const days = differenceInCalendarDays(parseDay(checkIn), new Date());
  if (days > 1) return `Check-in in ${days} days`;
  if (days === 1) return "Check-in in 1 day";
  if (days === 0) return "Check-in is today";
  return "Check-in date has passed";
}

function timeline(status) {
  if (status === "cancelled" || status === "no_show") {
    return [
      { label: "Booked", state: "done" },
      { label: statusLabel(status), state: "current" },
    ];
  }
  const flow = [
    { key: "confirmed", label: "Confirmed" },
    { key: "checked_in", label: "Checked in" },
    { key: "checked_out", label: "Completed" },
  ];
  const index = status === "pending" ? -1 : flow.findIndex((item) => item.key === status);
  return flow.map((item, itemIndex) => ({
    label: item.label,
    state: itemIndex < index ? "done" : itemIndex === index ? "current" : "wait",
  }));
}

/**
 * Guest policy (Option A):
 * - Cancel online here.
 * - Change / extend dates → contact front desk (desk Move dates checks live inventory).
 */
export function MyBookingsPage() {
  const { user, ready } = useAuth();
  const [tab, setTab] = useState("upcoming");
  const [rows, setRows] = useState([]);
  const [state, setState] = useState("loading");
  const [fault, setFault] = useState("");
  const [cancelId, setCancelId] = useState(null);

  function load() {
    setState("loading");
    api("/reservations")
      .then((data) => {
        setRows(data.reservations);
        setState("ready");
      })
      .catch((error) => {
        setFault(error.message);
        setState("error");
      });
  }

  useEffect(() => {
    if (!ready || !user || user.role !== "guest") return;
    load();
  }, [ready, user]);

  const visible = rows.filter((row) => bucket(row) === tab);
  const cancelling = rows.find((row) => row.id === cancelId);

  async function cancelStay() {
    if (!cancelId) return;
    try {
      await api(`/reservations/${cancelId}`, { method: "PATCH", body: { status: "cancelled" } });
      notify("The stay is cancelled.");
      setCancelId(null);
      load();
    } catch (error) {
      notify(error.message);
    }
  }

  return (
    <main className="bg-cream pt-28 pb-16">
      <div className="page-wrap">
        <p className="text-[11px] font-medium uppercase tracking-[0.28em] text-gold">Your stays</p>
        <h1 className="mt-2 font-display text-4xl text-navy">My bookings</h1>
        <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted">
          You can cancel a confirmed stay here. To change or extend dates, open{" "}
          <Link to="/messages" className="font-semibold text-navy underline">Messages</Link>
          {" "}— pick free nights, send a request, and read the desk reply there (private to you).
        </p>
        {!ready && <Skeleton className="mt-8 h-24 w-full" />}
        {ready && !user && (
          <div className="mt-8">
            <EmptyState title="Sign in to see your stays." text="Guest bookings are listed here after you hold a room.">
              <Link to="/login" className="inline-flex h-11 items-center rounded-full bg-gold px-5 text-sm font-semibold text-navy">
                Sign in
              </Link>
            </EmptyState>
          </div>
        )}
        {ready && user && user.role !== "guest" && (
          <div className="mt-8">
            <EmptyState title="Desk stays live on the hotel portal." text="This list is for a guest account.">
              <Link to={homeFor(user.role)} className="text-sm font-semibold text-navy underline">
                Open the desk
              </Link>
            </EmptyState>
          </div>
        )}
        {ready && user?.role === "guest" && (
          <>
            <div className="mt-6 overflow-x-auto">
              <Tabs value={tab} onValueChange={setTab} items={tabs} layoutId="booking-tabs" />
            </div>
            {state === "loading" && (
              <div className="mt-6 grid gap-3" aria-busy="true" aria-label="Loading bookings">
                <TableRowSkeleton columns={3} />
                <TableRowSkeleton columns={3} />
                <TableRowSkeleton columns={3} />
              </div>
            )}
            {state === "error" && (
              <div className="mt-6">
                <ErrorState title="Could not load your stays." text={fault} onRetry={load} />
              </div>
            )}
            {state === "ready" && visible.length === 0 && (
              <div className="mt-6">
                <BookingsEmptyState />
              </div>
            )}
            {state === "ready" && visible.length > 0 && (
              <ul className="mt-6 grid gap-4">
                {visible.map((row) => (
                  <li key={row.id} className="rounded-2xl bg-white p-5 shadow-[0_16px_40px_rgba(7,27,43,0.08)]">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="font-display text-2xl text-navy">{row.roomType}</p>
                        <p className="mt-1 text-sm text-muted">
                          {row.confirmationCode} · room {row.roomNumber}
                        </p>
                        <p className="mt-1 text-sm text-navy">
                          {row.checkIn} to {row.checkOut} · <Price value={row.totalAmount} />
                        </p>
                        {bucket(row) === "upcoming" && <p className="mt-2 text-sm text-gold">{countdown(row.checkIn)}</p>}
                      </div>
                      <Badge tone={statusTone(row.status)}>{statusLabel(row.status)}</Badge>
                    </div>
                    <Timeline status={row.status} />
                    {row.status === "confirmed" && (
                      <div className="mt-4 flex flex-wrap items-center gap-3">
                        <Link
                          to={`/messages?compose=1&topic=date_change&reservationId=${row.id}`}
                          className="inline-flex h-11 items-center rounded-full border border-navy/15 px-4 text-sm font-semibold text-navy focus-visible:outline-2 focus-visible:outline-gold"
                        >
                          Request date change
                        </Link>
                        <button
                          type="button"
                          onClick={() => setCancelId(row.id)}
                          className="inline-flex h-11 cursor-pointer items-center rounded-full px-4 text-sm font-semibold text-navy underline focus-visible:outline-2 focus-visible:outline-gold"
                        >
                          Cancel stay
                        </button>
                      </div>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </>
        )}
      </div>
      <AlertDialog
        open={Boolean(cancelling)}
        onOpenChange={(open) => {
          if (!open) setCancelId(null);
        }}
        title="Cancel this stay?"
        description={cancelling ? `${cancelling.confirmationCode} will be released and the draft invoice voided.` : ""}
        confirmLabel="Cancel stay"
        onConfirm={cancelStay}
      />
    </main>
  );
}

function Timeline({ status }) {
  const items = timeline(status);
  return (
    <ol className="mt-4 flex flex-wrap gap-4">
      {items.map((item) => (
        <li key={item.label} className="flex items-center gap-2 text-sm">
          <span className={`h-2.5 w-2.5 rounded-full ${item.state === "wait" ? "bg-navy/15" : "bg-gold"}`} />
          <span className={item.state === "current" ? "font-semibold text-navy" : "text-muted"}>{item.label}</span>
        </li>
      ))}
    </ol>
  );
}
