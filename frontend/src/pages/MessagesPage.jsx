import { addMonths, format } from "date-fns";
import { useEffect, useMemo, useState } from "react";
import { DayPicker } from "react-day-picker";
import "react-day-picker/style.css";
import { Link, useSearchParams } from "react-router-dom";
import { MessageThreadView } from "../components/messages/MessageThreadView";
import { EmptyState } from "../components/ui/EmptyState";
import { ErrorState } from "../components/ui/ErrorState";
import { InlineError } from "../components/ui/InlineError";
import { Skeleton } from "../components/ui/Skeleton";
import { notify } from "../components/ui/BayToaster";
import { useAuth } from "../context/AuthContext";
import { api } from "../lib/api";
import { stayIncludesSoldOut } from "../lib/availability";
import { homeFor } from "../lib/roles";
import { parseStayDate, toStayIso, stayNights } from "../lib/stay-date";

const topics = [
  { value: "date_change", label: "Change / extend dates" },
  { value: "stay", label: "A stay" },
  { value: "room", label: "A room" },
  { value: "dining", label: "Dining" },
  { value: "spa", label: "The spa" },
  { value: "arrival", label: "Arrival" },
  { value: "general", label: "General" },
];

/**
 * Guest private inbox — only this guest’s threads. Desk replies appear here.
 */
export function MessagesPage() {
  const { user, ready } = useAuth();
  const [params, setParams] = useSearchParams();
  const [threads, setThreads] = useState([]);
  const [activeId, setActiveId] = useState(params.get("thread") || "");
  const [listState, setListState] = useState("loading");
  const [fault, setFault] = useState("");
  const [compose, setCompose] = useState(params.get("compose") === "1" || params.get("topic") === "date_change");

  function loadThreads() {
    setListState("loading");
    api("/desk-messages/threads")
      .then((data) => {
        setThreads(data.threads || []);
        setListState("ready");
      })
      .catch((error) => {
        setFault(error.message);
        setListState("error");
      });
  }

  useEffect(() => {
    if (!ready || !user || user.role !== "guest") return;
    loadThreads();
  }, [ready, user]);

  useEffect(() => {
    const thread = params.get("thread");
    if (thread) setActiveId(thread);
    if (params.get("compose") === "1" || params.get("topic") === "date_change") setCompose(true);
  }, [params]);

  if (!ready) {
    return (
      <main className="bg-cream pt-28 pb-16">
        <div className="page-wrap">
          <Skeleton className="h-32 w-full" />
        </div>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="bg-cream pt-28 pb-16">
        <div className="page-wrap">
          <EmptyState title="Sign in to message the desk." text="Your conversations stay private to your account.">
            <Link to="/login?return=/messages" className="inline-flex h-11 items-center rounded-full bg-gold px-5 text-sm font-semibold text-navy">
              Sign in
            </Link>
          </EmptyState>
        </div>
      </main>
    );
  }

  if (user.role !== "guest") {
    return (
      <main className="bg-cream pt-28 pb-16">
        <div className="page-wrap">
          <EmptyState title="Desk messages live on the portal." text="Open Messages under Front desk tools.">
            <Link to={homeFor(user.role)} className="text-sm font-semibold text-navy underline">
              Open portal
            </Link>
          </EmptyState>
        </div>
      </main>
    );
  }

  return (
    <main className="bg-cream pt-28 pb-16">
      <div className="page-wrap">
        <header className="rounded-2xl border border-navy/10 bg-[#faf8f4] px-4 py-5 sm:px-6">
          <p className="text-[11px] font-medium tracking-[0.28em] text-gold uppercase">Private inbox</p>
          <h1 className="mt-2 font-display text-4xl text-navy">Messages</h1>
          <p className="mt-3 max-w-2xl text-sm leading-relaxed text-muted">
            Write to the front desk and read replies here. Only you and hotel staff see a conversation —
            never other guests. For date changes, pick nights that are still free.
          </p>
          <div className="mt-5 flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => setCompose(true)}
              className="h-11 cursor-pointer rounded-full bg-gold px-5 text-sm font-semibold text-navy"
            >
              New message
            </button>
            <Link
              to="/my-bookings"
              className="inline-flex h-11 items-center rounded-full border border-navy/15 bg-white px-4 text-sm font-semibold text-navy"
            >
              My bookings
            </Link>
          </div>
        </header>

        {compose ? (
          <div className="mt-6">
            <ComposeForm
              initialTopic={params.get("topic") || "general"}
              initialReservationId={params.get("reservationId") || ""}
              onCancel={() => {
                setCompose(false);
                setParams({}, { replace: true });
              }}
              onCreated={(thread) => {
                setCompose(false);
                setActiveId(thread.id);
                setParams({ thread: thread.id }, { replace: true });
                loadThreads();
                notify("Message sent to the front desk.");
              }}
            />
          </div>
        ) : null}

        <section aria-label="Conversations" className="mt-8 overflow-hidden rounded-2xl border border-navy/10 bg-white shadow-[0_16px_40px_rgba(7,27,43,0.06)]">
          <div className="grid min-h-[28rem] lg:grid-cols-[18rem_1fr]">
            <aside className="border-b border-navy/10 lg:border-r lg:border-b-0">
              <div className="flex items-center justify-between gap-2 border-b border-navy/8 px-4 py-3">
                <p className="text-sm font-semibold text-navy">Your conversations</p>
                <span className="text-xs text-muted">{threads.length || 0}</span>
              </div>
              <div className="max-h-[22rem] overflow-y-auto p-3 lg:max-h-[32rem]">
                {listState === "loading" ? <Skeleton className="h-40 w-full" /> : null}
                {listState === "error" ? <ErrorState title="Could not load messages" text={fault} onRetry={loadThreads} /> : null}
                {listState === "ready" && !threads.length ? (
                  <EmptyState title="No messages yet." text="Start a conversation with New message." />
                ) : null}
                {listState === "ready" && threads.length > 0 ? (
                  <ul className="grid gap-1.5">
                    {threads.map((thread) => (
                      <li key={thread.id}>
                        <button
                          type="button"
                          onClick={() => {
                            setActiveId(thread.id);
                            setParams({ thread: thread.id }, { replace: true });
                          }}
                          className={`w-full cursor-pointer rounded-xl border px-3 py-3 text-left text-sm transition-colors ${
                            activeId === thread.id
                              ? "border-gold bg-gold/20"
                              : "border-transparent bg-[#faf8f4] hover:border-navy/10"
                          }`}
                        >
                          <span className="block font-semibold text-navy">{thread.subject}</span>
                          <span className="mt-0.5 block text-xs capitalize text-muted">
                            {(thread.status || "").replaceAll("_", " ")}
                          </span>
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>
            </aside>
            <div className="min-w-0 bg-[#faf8f4]/40 p-3 sm:p-4">
              {activeId ? (
                <MessageThreadView
                  threadId={activeId}
                  viewer="guest"
                  onNote={notify}
                  onUpdated={() => loadThreads()}
                  embedded
                />
              ) : (
                <div className="flex h-full min-h-[16rem] items-center justify-center rounded-xl border border-dashed border-navy/15 bg-white p-6 text-center text-sm text-muted">
                  Select a conversation or start a new message.
                </div>
              )}
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

function ComposeForm({ initialTopic, initialReservationId, onCancel, onCreated }) {
  const [topic, setTopic] = useState(initialTopic || "general");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [stays, setStays] = useState([]);
  const [reservationId, setReservationId] = useState(initialReservationId || "");
  const [checkIn, setCheckIn] = useState(null);
  const [checkOut, setCheckOut] = useState(null);
  const [nights, setNights] = useState({});
  const [openList, setOpenList] = useState([]);
  const [loadingNights, setLoadingNights] = useState(false);
  const [busy, setBusy] = useState(false);
  const [fault, setFault] = useState("");

  const selectedStay = stays.find((stay) => stay.id === reservationId);

  useEffect(() => {
    api("/reservations")
      .then((data) => {
        const upcoming = (data.reservations || []).filter((row) =>
          ["pending", "confirmed"].includes(row.status),
        );
        setStays(upcoming);
        if (initialReservationId && upcoming.some((row) => row.id === initialReservationId)) {
          setReservationId(initialReservationId);
        }
      })
      .catch(() => setStays([]));
  }, [initialReservationId]);

  useEffect(() => {
    if (topic !== "date_change" || !selectedStay?.roomType) {
      setNights({});
      setOpenList([]);
      return undefined;
    }
    let live = true;
    setLoadingNights(true);
    const query = new URLSearchParams({
      roomType: selectedStay.roomType,
      reservationId: selectedStay.id,
      from: toStayIso(new Date()),
      to: toStayIso(addMonths(new Date(), 3)),
    });
    api(`/desk-messages/open-nights?${query}`)
      .then((data) => {
        if (!live) return;
        setNights(data.nights || {});
        setOpenList(data.openNights || []);
      })
      .catch((error) => {
        if (!live) return;
        setFault(error.message);
        setNights({});
        setOpenList([]);
      })
      .finally(() => {
        if (live) setLoadingNights(false);
      });
    return () => {
      live = false;
    };
  }, [topic, selectedStay?.id, selectedStay?.roomType]);

  const soldOutDates = useMemo(
    () =>
      Object.entries(nights)
        .filter(([, night]) => night && night.available === false)
        .map(([iso]) => parseStayDate(iso))
        .filter(Boolean),
    [nights],
  );

  const checkInIso = toStayIso(checkIn);
  const checkOutIso = toStayIso(checkOut);
  const blocked =
    topic === "date_change" &&
    checkInIso &&
    checkOutIso &&
    Object.keys(nights).length > 0 &&
    stayIncludesSoldOut(nights, checkInIso, checkOutIso);

  async function onSubmit(event) {
    event.preventDefault();
    if (!message.trim()) {
      setFault("Write a short message.");
      return;
    }
    if (topic === "date_change") {
      if (!reservationId) {
        setFault("Choose the stay you want to change.");
        return;
      }
      if (!checkIn || !checkOut || stayNights(checkIn, checkOut) <= 0) {
        setFault("Pick new check-in and check-out from open nights.");
        return;
      }
      if (blocked) {
        setFault("Those dates include nights already reserved by another guest.");
        return;
      }
    }
    setBusy(true);
    setFault("");
    try {
      const data = await api("/desk-messages/threads", {
        method: "POST",
        body: {
          topic,
          subject: subject.trim() || undefined,
          message: message.trim(),
          reservationId: reservationId || undefined,
          roomType: selectedStay?.roomType || undefined,
          requestedCheckIn: topic === "date_change" ? checkInIso : undefined,
          requestedCheckOut: topic === "date_change" ? checkOutIso : undefined,
        },
      });
      onCreated?.(data.thread);
    } catch (error) {
      setFault(error.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="rounded-2xl border border-navy/10 bg-white p-5 shadow-[0_16px_40px_rgba(7,27,43,0.06)]">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <h2 className="font-display text-2xl text-navy">New message</h2>
        <button type="button" onClick={onCancel} className="cursor-pointer text-sm font-semibold text-navy underline">
          Cancel
        </button>
      </div>
      <label className="mt-4 block text-sm text-navy">
        Topic
        <select className="bay-field mt-1 w-full px-3" value={topic} onChange={(event) => setTopic(event.target.value)}>
          {topics.map((item) => (
            <option key={item.value} value={item.value}>
              {item.label}
            </option>
          ))}
        </select>
      </label>
      <label className="mt-3 block text-sm text-navy">
        Subject (optional)
        <input className="bay-field mt-1 w-full px-3" value={subject} onChange={(event) => setSubject(event.target.value)} placeholder="Short subject" />
      </label>

      {topic === "date_change" ? (
        <div className="mt-4 rounded-2xl border border-navy/10 bg-[#faf8f4] p-4">
          <label className="block text-sm text-navy">
            Which stay?
            <select
              className="bay-field mt-1 w-full px-3"
              value={reservationId}
              onChange={(event) => setReservationId(event.target.value)}
              required
            >
              <option value="">Select a booking</option>
              {stays.map((stay) => (
                <option key={stay.id} value={stay.id}>
                  {stay.confirmationCode} · {stay.roomType} · {stay.checkIn} → {stay.checkOut}
                </option>
              ))}
            </select>
          </label>
          {!stays.length ? (
            <p className="mt-2 text-sm text-muted">No confirmed stays to change. Book first, or send a general message.</p>
          ) : null}
          {loadingNights ? <Skeleton className="mt-3 h-40 w-full" /> : null}
          {selectedStay && !loadingNights ? (
            <>
              <p className="mt-3 text-xs text-muted">
                Grey nights are taken on your room type. Only open nights can be requested — other guests’ bookings stay private.
              </p>
              <div className="mt-2">
                <DayPicker
                  mode="range"
                  selected={{ from: checkIn, to: checkOut }}
                  onSelect={(next) => {
                    if (!next?.from) return;
                    setCheckIn(next.from);
                    setCheckOut(next.to || next.from);
                  }}
                  disabled={[{ before: new Date() }, ...soldOutDates]}
                  modifiers={{ soldOut: soldOutDates }}
                  modifiersClassNames={{ soldOut: "opacity-40 line-through" }}
                />
              </div>
              {checkIn && checkOut ? (
                <p className="mt-2 text-sm text-navy">
                  Requested: {format(checkIn, "d MMM yyyy")} – {format(checkOut, "d MMM yyyy")}
                </p>
              ) : null}
              {openList.length ? (
                <p className="mt-2 text-xs leading-relaxed text-muted">
                  Next open nights: {openList.slice(0, 8).map((item) => item.date).join(", ")}
                  {openList.length > 8 ? "…" : ""}
                </p>
              ) : (
                <p className="mt-2 text-xs text-muted">No open nights found in the next months for this type.</p>
              )}
            </>
          ) : null}
        </div>
      ) : null}

      <label className="mt-3 block text-sm text-navy">
        Message
        <textarea
          className="bay-field mt-1 min-h-28 w-full px-3 py-2"
          value={message}
          onChange={(event) => setMessage(event.target.value)}
          placeholder="How can the desk help?"
          required
        />
      </label>
      <InlineError id="compose-error">{fault || (blocked ? "Those dates include nights already reserved." : "")}</InlineError>
      <button
        type="submit"
        disabled={busy || blocked}
        className="mt-4 h-11 cursor-pointer rounded-full bg-navy px-5 text-sm font-semibold text-white disabled:opacity-50"
      >
        {busy ? "Sending…" : "Send to front desk"}
      </button>
    </form>
  );
}
