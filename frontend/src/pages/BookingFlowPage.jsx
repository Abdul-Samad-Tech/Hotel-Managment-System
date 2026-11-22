import { CalendarDays, Check, Copy, Download, Minus, Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { format as formatDate } from "date-fns";
import { motion, useReducedMotion } from "framer-motion";
import QRCode from "qrcode";
import { guestCount } from "../data/rooms";
import { useAuth } from "../context/AuthContext";
import { useRoomCatalog } from "../hooks/use-room-catalog";
import { api } from "../lib/api";
import { requireSignedIn } from "../lib/auth-gate";
import { duration, easeTide } from "../lib/motion";
import { isStayRangeValid, stayNights, toStayIso } from "../lib/stay-date";
import { GUEST_LIMITS, RANGE_ERROR } from "../store/search.constant";
import { useSearchStay, useSearchStore } from "../store/searchStore";
import { PriceCalendar } from "../components/booking/PriceCalendar";
import { SlideToReserve } from "../components/booking/SlideToReserve";
import { Drawer } from "../components/ui/Drawer";
import { EmptyState } from "../components/ui/EmptyState";
import { InlineError } from "../components/ui/InlineError";
import { notify } from "../components/ui/BayToaster";
import { SmartImage } from "../components/ui/SmartImage";
import { useLocale } from "../context/LocaleContext";

const steps = ["Dates", "Details", "Payment", "Confirm"];
const noteLimit = 500;
const addOnChoices = ["Late arrival", "Extra pillows", "Ocean dining"];

function useMaxWidth(px) {
  const [match, setMatch] = useState(false);
  useEffect(() => {
    const query = window.matchMedia(`(max-width: ${px}px)`);
    const update = () => setMatch(query.matches);
    update();
    query.addEventListener("change", update);
    return () => query.removeEventListener("change", update);
  }, [px]);
  return match;
}

export function BookingFlowPage() {
  const { roomId } = useParams();
  const { rooms } = useRoomCatalog();
  const room = rooms.find((item) => item.id === roomId);
  const reduce = useReducedMotion();
  const mobile = useMaxWidth(1023);
  const navigate = useNavigate();
  const { user, ready: authReady } = useAuth();
  const { format } = useLocale();
  const { checkIn, checkOut, adults, children } = useSearchStay();
  const setRange = useSearchStore((state) => state.setRange);
  const setAdults = useSearchStore((state) => state.setAdults);
  const setChildren = useSearchStore((state) => state.setChildren);
  const setRoomType = useSearchStore((state) => state.setRoomType);
  const [step, setStep] = useState(0);
  const [requests, setRequests] = useState("");
  const [promo, setPromo] = useState("");
  const [promoApplied, setPromoApplied] = useState(false);
  const [method, setMethod] = useState("desk");
  const [addOns, setAddOns] = useState([]);
  const [quote, setQuote] = useState(null);
  const [fault, setFault] = useState("");
  const [busy, setBusy] = useState(false);
  const [saved, setSaved] = useState(null);
  const [summaryOpen, setSummaryOpen] = useState(false);

  useEffect(() => {
    if (room) setRoomType(room.selectLabel);
  }, [room, setRoomType]);

  useEffect(() => {
    if (!authReady) return;
    requireSignedIn(user, navigate, {
      returnTo: roomId ? `/booking/${roomId}` : "/booking",
      message: "Sign in to continue your booking.",
    });
  }, [authReady, user, navigate, roomId]);

  if (!room) {
    return (
      <main className="bg-cream px-6 pt-36 pb-20">
        <div className="page-wrap">
          <EmptyState title="Room not found" text="Choose a room from the list, then reserve.">
            <Link to="/rooms" className="text-sm font-semibold text-navy underline">
              Back to rooms
            </Link>
          </EmptyState>
        </div>
      </main>
    );
  }

  const nights = stayNights(checkIn, checkOut);
  const summary = (
    <SummaryCard
      room={room}
      checkIn={checkIn}
      checkOut={checkOut}
      adults={adults}
      children={children}
      nights={nights}
      quote={quote}
      method={method}
      addOns={addOns}
      promoApplied={promoApplied}
    />
  );

  async function goNext() {
    setFault("");
    if (step === 0) {
      if (!isStayRangeValid(checkIn, checkOut)) {
        setFault(RANGE_ERROR);
        return;
      }
      if (adults + children > guestCount(room)) {
        setFault(`This room sleeps ${guestCount(room)}.`);
        return;
      }
      setBusy(true);
      try {
        const query = new URLSearchParams({
          checkIn: toStayIso(checkIn),
          checkOut: toStayIso(checkOut),
          adults: String(adults),
          children: String(children),
          roomType: room.selectLabel,
        });
        const result = await api(`/availability?${query}`);
        if (!result.available) {
          setFault(result.message);
          setQuote(null);
          return;
        }
        setQuote(result);
        setStep(1);
      } catch (error) {
        setFault(error.message);
      } finally {
        setBusy(false);
      }
      return;
    }
    if (step === 1) {
      if (requests.length > noteLimit) {
        setFault("Keep the note within 500 characters.");
        return;
      }
      if (promo.trim() && !promoApplied) {
        setFault("Apply the code, or clear the field.");
        return;
      }
      setStep(2);
      return;
    }
    if (step === 2) {
      if (!method) {
        setFault("Choose how you will pay.");
        return;
      }
      setStep(3);
    }
  }

  function applyPromo() {
    if (promo.trim().toUpperCase() !== "AZURE") {
      setPromoApplied(false);
      setFault("That code is not on the desk list.");
      return;
    }
    setPromoApplied(true);
    setFault("");
    notify("AZURE is noted. The invoice still uses the room rate.");
  }

  async function confirmStay() {
    setFault("");
    if (!user) {
      setFault("Sign in to hold the room.");
      focusBookingError();
      return false;
    }
    const combined = buildStayNote(method, addOns, promoApplied, requests);
    if (combined.length > noteLimit) {
      setFault("The note is too long for the desk.");
      focusBookingError();
      return false;
    }
    setBusy(true);
    try {
      const result = await api("/reservations", {
        method: "POST",
        body: {
          checkIn: toStayIso(checkIn),
          checkOut: toStayIso(checkOut),
          adults,
          children,
          roomType: room.selectLabel,
          specialRequests: combined,
        },
      });
      setSaved(result.reservation);
      notify("Your stay is confirmed.");
      return true;
    } catch (error) {
      setFault(error.message);
      notify(error.message);
      focusBookingError();
      return false;
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="bg-cream pt-28 pb-28">
      <div className="page-wrap grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <div>
          {saved ? (
            <Confirmation room={room} reservation={saved} reduce={reduce} />
          ) : (
            <>
              <Progress step={step} reduce={reduce} onPick={(index) => index < step && setStep(index)} />
              <div className="mt-8">
                {step === 0 && (
                  <DatesStep
                    checkIn={checkIn}
                    checkOut={checkOut}
                    onRange={(next) => {
                      if (!next?.from) return;
                      setRange(next.from, next.to);
                      setQuote(null);
                    }}
                    adults={adults}
                    children={children}
                    setAdults={setAdults}
                    setChildren={setChildren}
                    capacity={guestCount(room)}
                    roomType={room.selectLabel}
                  />
                )}
                {step === 1 && (
                  <DetailsStep
                    user={user}
                    requests={requests}
                    setRequests={setRequests}
                    promo={promo}
                    setPromo={(value) => {
                      setPromo(value);
                      setPromoApplied(false);
                    }}
                    promoApplied={promoApplied}
                    onApply={applyPromo}
                    onClearPromo={() => {
                      setPromo("");
                      setPromoApplied(false);
                    }}
                  />
                )}
                {step === 2 && (
                  <PaymentStep method={method} setMethod={setMethod} addOns={addOns} setAddOns={setAddOns} />
                )}
                {step === 3 && (
                  <div>
                    <h1 className="font-display text-3xl text-navy">Confirm the stay</h1>
                    <p className="mt-2 text-sm leading-6 text-muted">
                      The desk holds the room. Nothing is charged on this page. The invoice stays open until you pay at the desk.
                    </p>
                    {!user && (
                      <p className="mt-4 text-sm text-navy">
                        <button type="button" className="font-semibold text-gold underline" onClick={() => navigate("/login")}>
                          Sign in
                        </button>{" "}
                        to hold the room.
                      </p>
                    )}
                  </div>
                )}
              </div>
              <InlineError id="booking-flow-error">{fault}</InlineError>
              <div className="mt-6 flex flex-col gap-3">
                {step === 3 ? (
                  <SlideToReserve disabled={busy || !user} busy={busy} onConfirm={confirmStay} />
                ) : null}
                <div className="flex gap-3">
                  {step > 0 && (
                    <button
                      type="button"
                      onClick={() => setStep((current) => current - 1)}
                      className="inline-flex h-11 cursor-pointer items-center rounded-full border border-navy/15 px-5 text-sm font-semibold text-navy focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
                    >
                      Back
                    </button>
                  )}
                  {step < 3 ? (
                    <button
                      type="button"
                      disabled={busy || (step === 0 && !isStayRangeValid(checkIn, checkOut))}
                      onClick={goNext}
                      className="inline-flex h-11 cursor-pointer items-center rounded-full bg-gold px-5 text-sm font-semibold text-navy focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold disabled:opacity-60"
                    >
                      {busy ? "Checking" : "Continue"}
                    </button>
                  ) : null}
                </div>
              </div>
            </>
          )}
        </div>
        {mobile ? (
          <Drawer open={summaryOpen} onOpenChange={setSummaryOpen} title="Your stay">
            <div className="max-h-[65vh] overflow-y-auto">{summary}</div>
          </Drawer>
        ) : (
          <aside className="sticky top-24">{summary}</aside>
        )}
      </div>
      {mobile && !saved && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-navy/10 bg-cream px-4 py-3">
          <button
            type="button"
            onClick={() => setSummaryOpen(true)}
            className="flex h-11 w-full cursor-pointer items-center justify-between rounded-full bg-navy px-4 text-sm font-semibold text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
          >
            <span>{room.name}</span>
            <span>{quote ? format(quote.total) : "Your stay"}</span>
          </button>
        </div>
      )}
    </main>
  );
}

function Progress({ step, reduce, onPick }) {
  return (
    <div>
      <p className="text-[11px] font-medium uppercase tracking-[0.28em] text-gold">Reserve</p>
      <ol className="relative mt-4 grid grid-cols-4">
        <span className="absolute top-3 right-[12%] left-[12%] h-px bg-navy/15" aria-hidden="true" />
        <motion.span
          className="absolute top-3 left-[12%] h-px origin-left bg-gold"
          style={{ width: "76%" }}
          initial={false}
          animate={{ scaleX: step / (steps.length - 1) }}
          transition={{ duration: reduce ? 0 : duration.ui, ease: easeTide }}
          aria-hidden="true"
        />
        {steps.map((label, index) => {
          const done = index < step;
          const current = index === step;
          return (
            <li key={label} className="relative z-[1] flex flex-col items-center gap-2">
              <button
                type="button"
                disabled={index > step}
                onClick={() => onPick(index)}
                aria-current={current ? "step" : undefined}
                className={`grid h-6 w-6 place-items-center rounded-full text-[11px] font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold ${current || done ? "bg-gold text-navy" : "bg-white text-navy/40"} ${index > step ? "cursor-not-allowed" : "cursor-pointer"}`}
              >
                {done ? <Check className="h-3.5 w-3.5" /> : index + 1}
              </button>
              <span className={`text-xs ${current ? "font-semibold text-navy" : "text-muted"}`}>{label}</span>
            </li>
          );
        })}
      </ol>
    </div>
  );
}

function DatesStep({ checkIn, checkOut, onRange, adults, children, setAdults, setChildren, capacity, roomType }) {
  return (
    <div>
      <h1 className="font-display text-3xl text-navy">Dates</h1>
      <p className="mt-2 text-sm text-muted">This room sleeps {capacity}.</p>
      <div className="mt-4 rounded-2xl bg-white p-3">
        <PriceCalendar
          selected={{ from: checkIn, to: checkOut }}
          onSelect={onRange}
          numberOfMonths={1}
          defaultMonth={checkIn}
          roomType={roomType}
          checkIn={checkIn}
          checkOut={checkOut}
        />
      </div>
      <p className="mt-3 inline-flex items-center gap-2 text-sm text-navy">
        <CalendarDays className="h-4 w-4 text-gold" aria-hidden="true" />
        {formatDate(checkIn, "d MMM yyyy")} – {formatDate(checkOut, "d MMM yyyy")}
      </p>
      <div className="mt-4 grid max-w-sm gap-2">
        <Counter label="Adults" value={adults} min={GUEST_LIMITS.adults.min} max={GUEST_LIMITS.adults.max} onChange={setAdults} />
        <Counter label="Children" value={children} min={GUEST_LIMITS.children.min} max={GUEST_LIMITS.children.max} onChange={setChildren} />
      </div>
    </div>
  );
}

function Counter({ label, value, min, max, onChange }) {
  return (
    <div className="flex min-h-11 items-center justify-between text-sm text-navy">
      <span>{label}</span>
      <div className="flex items-center gap-2">
        <button type="button" aria-label={`Fewer ${label.toLowerCase()}`} disabled={value <= min} onClick={() => onChange(value - 1)} className="grid h-11 w-11 cursor-pointer place-items-center rounded-full border border-navy/15 focus-visible:outline-2 focus-visible:outline-gold disabled:opacity-40">
          <Minus className="h-4 w-4" />
        </button>
        <span className="w-4 text-center">{value}</span>
        <button type="button" aria-label={`More ${label.toLowerCase()}`} disabled={value >= max} onClick={() => onChange(value + 1)} className="grid h-11 w-11 cursor-pointer place-items-center rounded-full border border-navy/15 focus-visible:outline-2 focus-visible:outline-gold disabled:opacity-40">
          <Plus className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

function DetailsStep({ user, requests, setRequests, promo, setPromo, promoApplied, onApply, onClearPromo }) {
  return (
    <div>
      <h1 className="font-display text-3xl text-navy">Details</h1>
      {user ? (
        <p className="mt-2 text-sm text-muted">
          Holding the room for {user.fullName} · {user.email}
        </p>
      ) : (
        <p className="mt-2 text-sm text-muted">You can review the stay now. Sign-in is required before it is held.</p>
      )}
      <label className="mt-5 block text-sm font-semibold text-navy" htmlFor="stay-note">
        Special requests
        <textarea
          id="stay-note"
          value={requests}
          maxLength={noteLimit}
          onChange={(event) => setRequests(event.target.value)}
          className="mt-2 min-h-28 w-full rounded-2xl border border-navy/15 bg-white p-3 text-sm font-normal text-navy focus-visible:outline-2 focus-visible:outline-gold"
        />
      </label>
      <p className="mt-1 text-right text-xs text-muted">
        {requests.length}/{noteLimit}
      </p>
      <div className="mt-4">
        <label className="text-sm font-semibold text-navy" htmlFor="promo-code">
          Promo code
        </label>
        <div className="mt-2 flex flex-wrap gap-2">
          <input
            id="promo-code"
            value={promo}
            onChange={(event) => setPromo(event.target.value)}
            className="h-11 min-w-40 flex-1 rounded-xl border border-navy/15 bg-white px-3 text-sm text-navy focus-visible:outline-2 focus-visible:outline-gold"
          />
          <button type="button" onClick={onApply} className="inline-flex h-11 cursor-pointer items-center rounded-full bg-navy px-4 text-sm font-semibold text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold">
            Apply
          </button>
        </div>
        {promoApplied && (
          <p className="mt-2 inline-flex items-center gap-2 rounded-full bg-gold/40 px-3 py-1 text-sm text-navy">
            AZURE applied
            <button type="button" onClick={onClearPromo} className="cursor-pointer font-semibold underline focus-visible:outline-2 focus-visible:outline-gold">
              Remove
            </button>
          </p>
        )}
      </div>
    </div>
  );
}

function PaymentStep({ method, setMethod, addOns, setAddOns }) {
  function toggle(name) {
    setAddOns((current) => (current.includes(name) ? current.filter((item) => item !== name) : [...current, name]));
  }

  return (
    <div>
      <h1 className="font-display text-3xl text-navy">Payment</h1>
      <p className="mt-2 text-sm leading-6 text-muted">Choose how you will settle the invoice. This page does not take a card number.</p>
      <fieldset className="mt-4 grid gap-3">
        <legend className="sr-only">Payment method</legend>
        <ChoiceCard name="pay" title="Pay at the desk" text="The invoice stays open until you arrive." checked={method === "desk"} onChange={() => setMethod("desk")} />
        <ChoiceCard name="pay" title="Card on arrival" text="The desk takes the card when you check in. Nothing is charged now." checked={method === "arrival"} onChange={() => setMethod("arrival")} />
      </fieldset>
      <fieldset className="mt-6 grid gap-3">
        <legend className="mb-2 text-sm font-semibold text-navy">Add-ons</legend>
        {addOnChoices.map((name) => (
          <ChoiceCard
            key={name}
            type="checkbox"
            name="addons"
            title={name}
            text="Asked of the desk. Not an F&B order — not added to the invoice."
            checked={addOns.includes(name)}
            onChange={() => toggle(name)}
          />
        ))}
      </fieldset>
    </div>
  );
}

function ChoiceCard({ name, type = "radio", title, text, checked, onChange }) {
  return (
    <label className={`flex min-h-11 cursor-pointer items-start gap-3 rounded-2xl border bg-white p-4 ${checked ? "border-gold shadow-[0_0_0_3px_rgba(242,192,120,0.35)]" : "border-navy/10"}`}>
      <input type={type} name={name} checked={checked} onChange={onChange} className="mt-1 h-4 w-4 accent-gold" />
      <span>
        <span className="block text-sm font-semibold text-navy">{title}</span>
        <span className="mt-1 block text-sm text-muted">{text}</span>
      </span>
    </label>
  );
}

function SummaryCard({ room, checkIn, checkOut, adults, children, nights, quote, method, addOns, promoApplied }) {
  const { format } = useLocale();
  const staySubtotal = quote?.subtotal ?? (quote?.nightlyRate != null ? quote.nightlyRate * quote.nights : null);
  const stayTax = quote?.tax ?? quote?.taxes ?? null;

  return (
    <div className="rounded-[24px] bg-white p-5 shadow-[0_16px_40px_rgba(7,27,43,0.1)]">
      <SmartImage src={room.image} alt="" width={640} height={480} className="aspect-[4/3] w-full rounded-2xl" />
      <h2 className="mt-4 font-display text-2xl text-navy">{room.name}</h2>
      <p className="mt-2 text-sm text-muted">
        {formatDate(checkIn, "d MMM")} – {formatDate(checkOut, "d MMM yyyy")} · {adults} adult{adults === 1 ? "" : "s"}
        {children ? ` · ${children} ${children === 1 ? "child" : "children"}` : ""}
      </p>
      {quote ? (
        <dl className="mt-4 grid gap-2 border-t border-navy/10 pt-4 text-sm text-navy">
          {staySubtotal != null ? (
            <div className="flex justify-between gap-3">
              <dt className="text-muted">
                {quote.nights} night{quote.nights === 1 ? "" : "s"}
              </dt>
              <dd>{format(staySubtotal)}</dd>
            </div>
          ) : null}
          {stayTax != null ? (
            <div className="flex justify-between gap-3">
              <dt className="text-muted">Tax & fees</dt>
              <dd>{format(stayTax + (quote.fees ?? 0))}</dd>
            </div>
          ) : null}
          {promoApplied && (
            <div className="flex justify-between gap-3">
              <dt className="text-muted">AZURE</dt>
              <dd>Noted</dd>
            </div>
          )}
          {addOns.length > 0 && (
            <div className="flex justify-between gap-3">
              <dt className="text-muted">Add-ons</dt>
              <dd className="text-right">{addOns.join(", ")}</dd>
            </div>
          )}
          <div className="flex justify-between gap-3">
            <dt className="text-muted">Payment</dt>
            <dd>{method === "desk" ? "At the desk" : "Card on arrival"}</dd>
          </div>
          <div className="flex justify-between gap-3 font-semibold">
            <dt>Total</dt>
            <dd>{format(quote.total)}</dd>
          </div>
        </dl>
      ) : (
        <p className="mt-4 text-sm text-muted">{nights > 0 ? `${nights} night${nights === 1 ? "" : "s"}. Continue to check the rate.` : "Choose a later check-out."}</p>
      )}
    </div>
  );
}

function Confirmation({ room, reservation, reduce }) {
  return (
    <div>
      <GoldCheck reduce={reduce} />
      <h1 className="mt-4 font-display text-4xl text-navy">Stay confirmed</h1>
      <p className="mt-2 text-sm leading-6 text-muted">
        {room.name}, room {reservation.roomNumber}. The invoice is open until the desk.
      </p>
      <div className="mt-5 flex flex-wrap items-center gap-2">
        <p className="font-display text-2xl text-navy">{reservation.confirmationCode}</p>
        <button
          type="button"
          onClick={() => navigator.clipboard.writeText(reservation.confirmationCode).then(() => notify("Booking ID copied."))}
          className="inline-flex h-11 cursor-pointer items-center gap-2 rounded-full border border-navy/15 px-3 text-sm font-semibold text-navy focus-visible:outline-2 focus-visible:outline-gold"
        >
          <Copy className="h-4 w-4" aria-hidden="true" />
          Copy
        </button>
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        <button type="button" onClick={() => downloadIcs(reservation, room)} className="inline-flex h-11 cursor-pointer items-center gap-2 rounded-full bg-gold px-4 text-sm font-semibold text-navy focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold">
          <CalendarDays className="h-4 w-4" aria-hidden="true" />
          Add to calendar
        </button>
        <button type="button" onClick={() => downloadReceipt(reservation, room)} className="inline-flex h-11 cursor-pointer items-center gap-2 rounded-full border border-navy/15 px-4 text-sm font-semibold text-navy focus-visible:outline-2 focus-visible:outline-gold">
          <Download className="h-4 w-4" aria-hidden="true" />
          Receipt
        </button>
      </div>
      <StayQr code={reservation.confirmationCode} />
      <p className="mt-6 text-sm">
        <Link to="/my-bookings" className="font-semibold text-gold underline">
          My bookings
        </Link>
      </p>
    </div>
  );
}

function GoldCheck({ reduce }) {
  return (
    <svg viewBox="0 0 64 64" className="h-16 w-16" aria-hidden="true">
      <circle cx="32" cy="32" r="28" fill="#F2C078" />
      <motion.path
        d="M20 33.5 28 41.5 45 23"
        fill="none"
        stroke="#0B1F33"
        strokeWidth="3.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        initial={{ pathLength: reduce ? 1 : 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: reduce ? 0 : duration.ui, ease: easeTide }}
      />
    </svg>
  );
}

function StayQr({ code }) {
  const [url, setUrl] = useState("");
  useEffect(() => {
    let live = true;
    QRCode.toDataURL(code, { margin: 1, width: 160, color: { dark: "#0B1F33", light: "#FFFFFF" } }).then((next) => {
      if (live) setUrl(next);
    });
    return () => {
      live = false;
    };
  }, [code]);
  if (!url) return null;
  return <img src={url} alt={`QR code for booking ${code}`} className="mt-6 h-40 w-40 rounded-2xl bg-white p-2" />;
}

function buildStayNote(method, addOns, promoApplied, requests) {
  const paymentLine =
    method === "desk"
      ? "Payment: pay at the desk."
      : "Payment: card on arrival. The invoice stays open until the desk.";
  const extra = [
    paymentLine,
    addOns.length ? `Add-ons asked: ${addOns.join(", ")}.` : "",
    promoApplied ? "Promo AZURE noted. The invoice uses the room rate." : "",
  ]
    .filter(Boolean)
    .join(" ");
  return [requests.trim(), extra].filter(Boolean).join(" ");
}

function focusBookingError() {
  requestAnimationFrame(() => {
    document.getElementById("booking-flow-error")?.focus();
  });
}

function downloadFile(filename, contents, type) {
  const blob = new Blob([contents], { type });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function downloadIcs(reservation, room) {
  const start = reservation.checkIn.replaceAll("-", "");
  const end = reservation.checkOut.replaceAll("-", "");
  const body = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Azure Bay//Stay//EN",
    "BEGIN:VEVENT",
    `UID:${reservation.confirmationCode}@azurebay.test`,
    `DTSTART;VALUE=DATE:${start}`,
    `DTEND;VALUE=DATE:${end}`,
    `SUMMARY:Azure Bay ${room.name}`,
    `DESCRIPTION:Booking ${reservation.confirmationCode}. Room ${reservation.roomNumber}.`,
    "END:VEVENT",
    "END:VCALENDAR",
  ].join("\r\n");
  downloadFile(`${reservation.confirmationCode}.ics`, body, "text/calendar");
}

function downloadReceipt(reservation, room) {
  const lines = [
    "Azure Bay stay note",
    `Booking ${reservation.confirmationCode}`,
    `${room.name} · room ${reservation.roomNumber}`,
    `${reservation.checkIn} to ${reservation.checkOut}`,
    `${reservation.adults} adults, ${reservation.children} children`,
    `Nightly $${reservation.nightlyRate}`,
    `Tax $${reservation.taxes}`,
    `Total $${reservation.totalAmount}`,
    "The invoice stays open until the desk.",
  ];
  downloadFile(`${reservation.confirmationCode}.txt`, lines.join("\n"), "text/plain");
}
