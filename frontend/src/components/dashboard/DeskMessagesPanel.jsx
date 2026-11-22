import { formatDistanceToNow } from "date-fns";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { MessageThreadView } from "../messages/MessageThreadView";
import { EmptyState } from "../ui/EmptyState";
import { ErrorState } from "../ui/ErrorState";
import { Skeleton } from "../ui/Skeleton";
import { api } from "../../lib/api";

const filters = [
  { id: "openish", label: "Open" },
  { id: "awaiting_desk", label: "Needs reply" },
  { id: "closed", label: "Closed" },
];

const statusChip = {
  open: "Open",
  awaiting_desk: "Needs desk",
  awaiting_guest: "Awaiting guest",
  closed: "Closed",
};

/**
 * Front-desk inbox. Each thread is private to one guest — never mixed.
 * Layout-only refresh; APIs unchanged.
 */
export function DeskMessagesPanel({ onNote, pulse = 0 }) {
  const [threads, setThreads] = useState([]);
  const [activeId, setActiveId] = useState("");
  const [filter, setFilter] = useState("openish");
  const [state, setState] = useState("loading");
  const [fault, setFault] = useState("");

  function load(quiet = false) {
    if (!quiet) setState("loading");
    const query =
      filter === "closed"
        ? "?status=closed"
        : filter === "awaiting_desk"
          ? "?status=awaiting_desk"
          : "";
    api(`/desk-messages/threads${query}`)
      .then((data) => {
        let rows = data.threads || [];
        if (filter === "openish") {
          rows = rows.filter((thread) => thread.status !== "closed");
        }
        setThreads(rows);
        setState("ready");
        if (activeId && !rows.some((thread) => thread.id === activeId)) {
          setActiveId(rows[0]?.id || "");
        } else if (!activeId && rows[0]) {
          setActiveId(rows[0].id);
        }
      })
      .catch((error) => {
        setFault(error.message);
        setState("error");
        onNote?.(error.message);
      });
  }

  useEffect(() => {
    load(Boolean(threads.length));
    // eslint-disable-next-line react-hooks/exhaustive-deps -- refresh on pulse / filter only
  }, [pulse, filter]);

  const active = threads.find((thread) => thread.id === activeId);
  const needsDesk = threads.filter((thread) => thread.status === "awaiting_desk").length;

  return (
    <div className="grid gap-5">
      <header className="rounded-2xl border border-navy/10 bg-[#faf8f4] px-4 py-4 sm:px-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[11px] font-medium tracking-[0.16em] text-gold uppercase">Inbox</p>
            <p className="mt-1 font-display text-2xl text-navy">Guest conversations</p>
            <p className="mt-1 max-w-xl text-sm leading-relaxed text-muted">
              One guest per thread. Reply here; for date changes, agree in chat then apply on Front desk → ⋮ → Move dates.
            </p>
          </div>
          <div className="flex flex-wrap gap-2 text-xs">
            <span className="rounded-full bg-white px-3 py-1.5 font-semibold text-navy shadow-[0_6px_16px_rgba(7,27,43,0.06)]">
              {threads.length} shown
            </span>
            {needsDesk > 0 ? (
              <span className="rounded-full bg-gold/35 px-3 py-1.5 font-semibold text-navy">
                {needsDesk} need reply
              </span>
            ) : null}
          </div>
        </div>
        <div className="mt-4 flex flex-wrap gap-1.5" role="tablist" aria-label="Message filters">
          {filters.map((item) => (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={filter === item.id}
              onClick={() => setFilter(item.id)}
              className={`cursor-pointer rounded-full px-3.5 py-2 text-sm font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold ${
                filter === item.id ? "bg-navy text-white" : "border border-navy/15 bg-white text-navy"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </header>

      {state === "loading" && !threads.length ? <Skeleton className="h-64 w-full rounded-2xl" /> : null}
      {state === "error" ? <ErrorState title="Inbox could not load" text={fault} onRetry={() => load()} /> : null}

      {state === "ready" && !threads.length ? (
        <EmptyState title="No conversations in this view." text="When a guest writes from Messages or Contact, it appears here." />
      ) : null}

      {threads.length > 0 ? (
        <div className="grid min-h-[28rem] overflow-hidden rounded-2xl border border-navy/10 bg-white shadow-[0_16px_40px_rgba(7,27,43,0.06)] lg:grid-cols-[minmax(16rem,20rem)_1fr]">
          <aside className="flex max-h-[36rem] flex-col border-b border-navy/10 lg:max-h-none lg:border-r lg:border-b-0">
            <p className="border-b border-navy/10 px-4 py-3 text-[11px] font-medium tracking-[0.14em] text-muted uppercase">
              Threads
            </p>
            <ul className="min-h-0 flex-1 overflow-y-auto p-2">
              {threads.map((thread) => {
                const selected = activeId === thread.id;
                const waiting = thread.status === "awaiting_desk";
                return (
                  <li key={thread.id}>
                    <button
                      type="button"
                      onClick={() => setActiveId(thread.id)}
                      className={`mb-1 w-full cursor-pointer rounded-xl px-3 py-3 text-left transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold ${
                        selected ? "bg-gold/25 ring-1 ring-gold/50" : "hover:bg-[#faf8f4]"
                      }`}
                    >
                      <span className="flex items-start justify-between gap-2">
                        <span className="truncate font-semibold text-navy">{thread.guestName || "Guest"}</span>
                        {waiting ? <span className="mt-0.5 h-2 w-2 shrink-0 rounded-full bg-gold" aria-label="Needs reply" /> : null}
                      </span>
                      <span className="mt-0.5 block truncate text-sm text-navy/75">{thread.subject}</span>
                      <span className="mt-1 flex flex-wrap items-center gap-2 text-[11px] text-muted">
                        <span>{statusChip[thread.status] || thread.status}</span>
                        {thread.lastMessageAt ? (
                          <span>
                            {formatDistanceToNow(new Date(thread.lastMessageAt), { addSuffix: true })}
                          </span>
                        ) : null}
                      </span>
                    </button>
                  </li>
                );
              })}
            </ul>
          </aside>

          <section className="flex min-h-[22rem] flex-col bg-cream/40 lg:min-h-[32rem]">
            {activeId ? (
              <>
                {active?.topic === "date_change" ? (
                  <div className="border-b border-navy/10 bg-gold/15 px-4 py-2.5 text-sm text-navy">
                    <strong className="font-semibold">Date change request.</strong>{" "}
                    Reply here, then apply dates on{" "}
                    <button
                      type="button"
                      className="cursor-pointer font-semibold underline focus-visible:outline-2 focus-visible:outline-gold"
                      onClick={() => onNote?.("Open Front desk → find the stay → ⋮ Details → Move dates.")}
                    >
                      Front desk → Move dates
                    </button>
                    {active.requestedCheckIn && active.requestedCheckOut
                      ? ` · asked ${active.requestedCheckIn} → ${active.requestedCheckOut}`
                      : ""}
                  </div>
                ) : null}
                <div className="min-h-0 flex-1 p-3 sm:p-4">
                  <MessageThreadView
                    threadId={activeId}
                    viewer="desk"
                    onNote={onNote}
                    onUpdated={() => load(true)}
                    embedded
                  />
                </div>
              </>
            ) : (
              <div className="grid flex-1 place-items-center p-8 text-center">
                <p className="text-sm text-muted">Select a thread on the left to read and reply.</p>
              </div>
            )}
          </section>
        </div>
      ) : null}

      <p className="text-xs text-muted">
        Guests write from{" "}
        <Link to="/messages" className="font-semibold text-navy underline">
          /messages
        </Link>
        . Threads never mix between guests.
      </p>
    </div>
  );
}
