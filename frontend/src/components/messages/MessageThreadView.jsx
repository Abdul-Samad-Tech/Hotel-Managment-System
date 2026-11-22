import { format } from "date-fns";
import { useEffect, useRef, useState } from "react";
import { api } from "../../lib/api";
import { InlineError } from "../ui/InlineError";
import { Skeleton } from "../ui/Skeleton";

const statusLabel = {
  open: "Open",
  awaiting_desk: "Waiting on desk",
  awaiting_guest: "Waiting on guest",
  closed: "Closed",
};

/**
 * Private thread viewer — loads only one conversation the caller is allowed to see.
 */
export function MessageThreadView({ threadId, viewer = "guest", onUpdated, onNote, embedded = false }) {
  const [thread, setThread] = useState(null);
  const [messages, setMessages] = useState([]);
  const [state, setState] = useState("loading");
  const [fault, setFault] = useState("");
  const [reply, setReply] = useState("");
  const [busy, setBusy] = useState(false);
  const bottomRef = useRef(null);

  function load() {
    if (!threadId) return;
    setState("loading");
    api(`/desk-messages/threads/${threadId}`)
      .then((data) => {
        setThread(data.thread);
        setMessages(data.messages || []);
        setState("ready");
        onUpdated?.(data.thread);
      })
      .catch((error) => {
        setFault(error.message);
        setState("error");
      });
  }

  useEffect(load, [threadId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  }, [messages.length]);

  async function sendReply(event) {
    event.preventDefault();
    if (!reply.trim() || busy) return;
    setBusy(true);
    setFault("");
    try {
      const data = await api(`/desk-messages/threads/${threadId}/messages`, {
        method: "POST",
        body: { message: reply.trim() },
      });
      setMessages((current) => [...current, data.message]);
      setThread(data.thread);
      setReply("");
      onUpdated?.(data.thread);
      onNote?.(viewer === "desk" ? "Reply sent to the guest." : "Message sent to the desk.");
    } catch (error) {
      setFault(error.message);
    } finally {
      setBusy(false);
    }
  }

  async function closeThread() {
    if (busy) return;
    setBusy(true);
    try {
      const data = await api(`/desk-messages/threads/${threadId}`, {
        method: "PATCH",
        body: { status: "closed" },
      });
      setThread(data.thread);
      onUpdated?.(data.thread);
      onNote?.("Conversation closed.");
    } catch (error) {
      setFault(error.message);
    } finally {
      setBusy(false);
    }
  }

  if (!threadId) return null;
  if (state === "loading") return <Skeleton className="h-48 w-full rounded-2xl" />;
  if (state === "error") return <p className="text-sm text-muted">{fault}</p>;
  if (!thread) return null;

  const closed = thread.status === "closed";
  const shell = embedded
    ? "flex h-full min-h-[20rem] flex-col"
    : "flex min-h-[22rem] flex-col overflow-hidden rounded-2xl border border-navy/10 bg-white shadow-[0_16px_40px_rgba(7,27,43,0.06)]";

  return (
    <div className={shell}>
      <div className={`border-b border-navy/10 bg-white px-4 py-3 ${embedded ? "rounded-t-xl" : ""}`}>
        <div className="flex flex-wrap items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="font-display text-xl leading-tight text-navy">{thread.subject}</p>
            <p className="mt-1 text-sm text-muted">
              {viewer === "desk" && thread.guestName ? (
                <>
                  <span className="font-medium text-navy">{thread.guestName}</span>
                  {thread.guestEmail ? ` · ${thread.guestEmail}` : ""}
                </>
              ) : (
                "Front desk"
              )}
              {thread.roomType ? ` · ${thread.roomType}` : ""}
            </p>
          </div>
          <span className="rounded-full border border-navy/15 bg-[#faf8f4] px-2.5 py-1 text-[11px] font-semibold text-navy">
            {statusLabel[thread.status] || thread.status}
          </span>
        </div>
        {thread.requestedCheckIn && thread.requestedCheckOut ? (
          <p className="mt-2 rounded-xl bg-gold/20 px-3 py-2 text-sm text-navy">
            Requested stay: <strong>{thread.requestedCheckIn}</strong> → <strong>{thread.requestedCheckOut}</strong>
          </p>
        ) : null}
        {thread.openNightHints?.length ? (
          <p className="mt-2 text-xs leading-relaxed text-muted">
            Open nights shown to guest: {thread.openNightHints.slice(0, 10).join(", ")}
            {thread.openNightHints.length > 10 ? "…" : ""}
          </p>
        ) : null}
      </div>

      <ul className="min-h-0 flex-1 space-y-3 overflow-y-auto px-4 py-4">
        {messages.map((item) => {
          const mine =
            (viewer === "guest" && item.senderRole === "guest") ||
            (viewer === "desk" && item.senderRole === "desk");
          return (
            <li key={item.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[min(100%,22rem)] rounded-2xl px-3.5 py-2.5 text-sm shadow-[0_4px_14px_rgba(7,27,43,0.04)] ${
                  mine ? "bg-navy text-white" : "border border-navy/8 bg-white text-navy"
                }`}
              >
                <p className="whitespace-pre-wrap leading-relaxed">{item.body}</p>
                <p className={`mt-1.5 text-[10px] ${mine ? "text-white/70" : "text-muted"}`}>
                  {item.senderRole === "desk" ? "Desk" : "Guest"}
                  {item.createdAt ? ` · ${format(new Date(item.createdAt), "d MMM · HH:mm")}` : ""}
                </p>
              </div>
            </li>
          );
        })}
        <li ref={bottomRef} aria-hidden className="h-0" />
      </ul>

      <div className="border-t border-navy/10 bg-white p-3">
        <InlineError id="thread-reply-error">{fault}</InlineError>
        {closed ? (
          <p className="px-1 text-sm text-muted">This conversation is closed.</p>
        ) : (
          <form className="grid gap-2" onSubmit={sendReply}>
            <textarea
              className="bay-field min-h-[4.5rem] w-full resize-y px-3 py-2"
              value={reply}
              onChange={(event) => setReply(event.target.value)}
              placeholder={viewer === "desk" ? "Reply to the guest…" : "Write to the desk…"}
              disabled={busy}
            />
            <div className="flex flex-wrap gap-2">
              <button
                type="submit"
                disabled={busy || !reply.trim()}
                className="h-11 cursor-pointer rounded-full bg-gold px-5 text-sm font-semibold text-navy focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold disabled:opacity-50"
              >
                {busy ? "Sending…" : "Send reply"}
              </button>
              <button
                type="button"
                disabled={busy}
                onClick={closeThread}
                className="h-11 cursor-pointer rounded-full border border-navy/15 px-4 text-sm font-semibold text-navy focus-visible:outline-2 focus-visible:outline-gold disabled:opacity-50"
              >
                Close thread
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
