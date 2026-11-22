import { Minus, Plus, ShoppingBag } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { DayPicker } from "react-day-picker";
import { format } from "date-fns";
import "react-day-picker/style.css";
import { Link } from "react-router-dom";
import { chefsSpecial, tableSlots } from "../data/dining";
import { experienceCards, houseHours } from "../data/experiences";
import { useSiteMedia } from "../hooks/use-site-media";
import { duration, easeTide, viewportOnce } from "../lib/motion";
import { PageBanner } from "../components/layout/PageBanner";
import { notify } from "../components/ui/BayToaster";
import { Badge } from "../components/ui/Badge";
import { Price } from "../components/ui/Price";
import { EmptyState } from "../components/ui/EmptyState";
import { SmartImage } from "../components/ui/SmartImage";
import { InlineError } from "../components/ui/InlineError";
import { Skeleton } from "../components/ui/Skeleton";
import { Tabs } from "../components/ui/Tabs";
import { useAuth } from "../context/AuthContext";
import { api } from "../lib/api";
import { toStayIso } from "../lib/stay-date";

const diningFallback = experienceCards.find((card) => card.id === "dining");

export function DiningPage() {
  const reduce = useReducedMotion();
  const { user, ready } = useAuth();
  const { media } = useSiteMedia("dining");
  const diningImage = media[0]?.url || media[0]?.src || diningFallback?.image;
  const [categories, setCategories] = useState([]);
  const [menuSlug, setMenuSlug] = useState("");
  const [menuState, setMenuState] = useState("loading");
  const [cart, setCart] = useState([]);
  const [eligibility, setEligibility] = useState(null);

  useEffect(() => {
    api("/dining/menu")
      .then((data) => {
        const rows = data.categories || [];
        setCategories(rows);
        setMenuSlug(rows[0]?.slug || "");
        setMenuState("ready");
      })
      .catch(() => setMenuState("error"));
  }, []);

  useEffect(() => {
    if (!ready || !user || user.role !== "guest") {
      setEligibility(null);
      return;
    }
    api("/dining/eligibility")
      .then(setEligibility)
      .catch(() => setEligibility({ canOrder: false, reason: "Could not check stay status." }));
  }, [ready, user]);

  const current = categories.find((item) => item.slug === menuSlug) || categories[0];
  const featured = useMemo(() => {
    for (const category of categories) {
      const hit = (category.items || []).find((item) => item.featured);
      if (hit) return hit;
    }
    return null;
  }, [categories]);

  function addToCart(item) {
    setCart((currentCart) => {
      const existing = currentCart.find((row) => row.menuItemId === item.id);
      if (existing) {
        return currentCart.map((row) =>
          row.menuItemId === item.id ? { ...row, quantity: Math.min(20, row.quantity + 1) } : row,
        );
      }
      return [...currentCart, { menuItemId: item.id, name: item.name, unitPrice: item.price, quantity: 1 }];
    });
    notify(`${item.name} added to order.`);
  }

  const cartTotal = cart.reduce((sum, row) => sum + row.unitPrice * row.quantity, 0);

  return (
    <main>
      <PageBanner
        eyebrow="World-class dining"
        title="Ocean View"
        accent="Dining"
        text="White linen, lanterns and a menu that follows the light on the water."
        image={diningImage}
      />
      <section className="bg-cream py-14">
        <div className="page-wrap grid gap-14">
          <Split
            image={diningImage}
            alt="Ocean view dining terrace"
            title="By the water"
            text="White linen, lanterns and a menu that follows the light on the water. In-house guests can order to the room after check-in — charges go on the stay bill."
            reduce={reduce}
          />
          <Split
            image={chefsSpecial.image}
            alt={featured?.name || chefsSpecial.name}
            title="The terrace plate"
            text={featured?.description || chefsSpecial.note}
            flip
            reduce={reduce}
          />

          <DiningGateBanner user={user} ready={ready} eligibility={eligibility} />

          <div>
            {menuState === "loading" ? <Skeleton className="h-48 w-full rounded-2xl" /> : null}
            {menuState === "error" ? (
              <EmptyState title="Menu could not load." text="Try again in a moment." />
            ) : null}
            {menuState === "ready" && categories.length ? (
              <>
                <div className="overflow-x-auto">
                  <Tabs
                    value={menuSlug || current?.slug}
                    onValueChange={setMenuSlug}
                    items={categories.map((item) => ({ value: item.slug, label: item.title }))}
                    layoutId="dining-menu"
                  />
                </div>
                {!current?.items?.length ? (
                  <div className="mt-6">
                    <EmptyState title="No dishes on this menu." />
                  </div>
                ) : (
                  <ul className="mt-6 divide-y divide-navy/10 rounded-2xl bg-white px-5 shadow-[0_16px_40px_rgba(7,27,43,0.08)]">
                    {current.items.map((item) => (
                      <li key={item.id} className="flex items-start justify-between gap-4 py-4">
                        <div>
                          <p className="text-sm font-semibold text-navy">{item.name}</p>
                          <p className="text-sm text-muted">{item.description}</p>
                        </div>
                        <div className="flex shrink-0 flex-col items-end gap-2">
                          <p className="text-sm font-semibold text-navy"><Price value={item.price} /></p>
                          {eligibility?.canOrder ? (
                            <button
                              type="button"
                              onClick={() => addToCart(item)}
                              className="cursor-pointer rounded-full bg-navy px-3 py-1 text-xs font-semibold text-white"
                            >
                              Add
                            </button>
                          ) : null}
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </>
            ) : null}
          </div>

          {eligibility?.canOrder ? (
            <OrderCart
              cart={cart}
              setCart={setCart}
              total={cartTotal}
              roomNumber={eligibility.roomNumber}
              onPlaced={() => {
                setCart([]);
                notify("Order placed — charged to your stay invoice.");
              }}
            />
          ) : null}

          <article className="grid overflow-hidden rounded-[24px] bg-white shadow-[0_16px_40px_rgba(7,27,43,0.1)] md:grid-cols-[1.1fr_0.9fr]">
            <SmartImage src={chefsSpecial.image} alt="" width={800} height={600} className="h-56 w-full md:h-full" />
            <div className="p-6">
              <Badge>Chef&apos;s special</Badge>
              <h2 className="mt-3 font-display text-3xl text-navy">{featured?.name || chefsSpecial.name}</h2>
              <p className="mt-2 text-sm leading-6 text-muted">{featured?.description || chefsSpecial.note}</p>
              <p className="mt-4 font-display text-2xl text-navy">
                <Price value={featured?.price ?? chefsSpecial.price} />
              </p>
            </div>
          </article>

          <div className="grid items-start gap-6 lg:grid-cols-2">
            <TableRequest eligibility={eligibility} user={user} ready={ready} />
            <HoursCard />
          </div>
        </div>
      </section>
    </main>
  );
}

function DiningGateBanner({ user, ready, eligibility }) {
  if (!ready) return null;
  if (!user) {
    return (
      <div className="rounded-2xl border border-navy/10 bg-white px-4 py-4 text-sm">
        <p className="font-display text-xl text-navy">Order to your room</p>
        <p className="mt-1 text-muted">Sign in as a guest. Ordering opens after front desk check-in.</p>
        <Link to="/login?return=/dining" className="mt-3 inline-flex h-11 items-center rounded-full bg-gold px-5 text-sm font-semibold text-navy">
          Sign in
        </Link>
      </div>
    );
  }
  if (user.role !== "guest") {
    return (
      <div className="rounded-2xl border border-navy/10 bg-[#faf8f4] px-4 py-4 text-sm text-muted">
        Staff manage dining in the portal under <strong className="text-navy">Dining</strong>.
      </div>
    );
  }
  if (eligibility?.canOrder) {
    return (
      <div className="rounded-2xl border border-gold/40 bg-gold/20 px-4 py-4 text-sm text-navy">
        <p className="font-semibold">You are checked in{eligibility.roomNumber ? ` · Room ${eligibility.roomNumber}` : ""}.</p>
        <p className="mt-1 text-muted">Add dishes below — they charge to your stay invoice.</p>
      </div>
    );
  }
  return (
    <div className="rounded-2xl border border-navy/10 bg-white px-4 py-4 text-sm">
      <p className="font-display text-xl text-navy">Ordering locked</p>
      <p className="mt-1 text-muted">{eligibility?.reason || "Available after check-in."}</p>
    </div>
  );
}

function OrderCart({ cart, setCart, total, roomNumber, onPlaced }) {
  const [busy, setBusy] = useState(false);
  const [fault, setFault] = useState("");
  const [notes, setNotes] = useState("");

  if (!cart.length) {
    return (
      <div className="rounded-2xl border border-dashed border-navy/15 bg-white px-4 py-5 text-sm text-muted">
        <ShoppingBag className="mb-2 h-5 w-5 text-navy" />
        Your order cart is empty. Use Add on any dish.
      </div>
    );
  }

  async function place() {
    setBusy(true);
    setFault("");
    try {
      await api("/dining/orders", {
        method: "POST",
        body: {
          notes,
          lines: cart.map((row) => ({ menuItemId: row.menuItemId, quantity: row.quantity })),
        },
      });
      onPlaced?.();
    } catch (error) {
      setFault(error.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-2xl border border-navy/10 bg-white p-5 shadow-[0_16px_40px_rgba(7,27,43,0.06)]">
      <h2 className="font-display text-2xl text-navy">Your order</h2>
      <p className="mt-1 text-sm text-muted">Room {roomNumber || "—"} · charged to stay invoice</p>
      <ul className="mt-4 divide-y divide-navy/10">
        {cart.map((row) => (
          <li key={row.menuItemId} className="flex items-center justify-between gap-3 py-2 text-sm">
            <span className="font-semibold text-navy">{row.quantity}× {row.name}</span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                className="grid h-8 w-8 cursor-pointer place-items-center rounded-full border border-navy/15"
                onClick={() =>
                  setCart((current) =>
                    current
                      .map((item) =>
                        item.menuItemId === row.menuItemId ? { ...item, quantity: item.quantity - 1 } : item,
                      )
                      .filter((item) => item.quantity > 0),
                  )
                }
              >
                <Minus className="h-3 w-3" />
              </button>
              <span>${(row.unitPrice * row.quantity).toFixed(0)}</span>
            </div>
          </li>
        ))}
      </ul>
      <label className="mt-3 block text-sm text-navy">
        Notes
        <input className="bay-field mt-1 w-full px-3" value={notes} onChange={(event) => setNotes(event.target.value)} placeholder="Allergies, timing…" />
      </label>
      <p className="mt-3 font-display text-2xl text-navy"><Price value={total} /></p>
      <InlineError id="order-fault">{fault}</InlineError>
      <button
        type="button"
        disabled={busy}
        onClick={place}
        className="mt-3 h-11 cursor-pointer rounded-full bg-gold px-5 text-sm font-semibold text-navy disabled:opacity-50"
      >
        {busy ? "Placing…" : "Place order"}
      </button>
    </div>
  );
}

function Split({ image, alt, title, text, flip = false, reduce }) {
  return (
    <div className="grid items-center gap-6 md:grid-cols-2">
      <motion.img
        src={image}
        alt={alt}
        className={`aspect-[4/3] w-full rounded-[18px] object-cover ${flip ? "md:order-2" : ""}`}
        initial={reduce ? { opacity: 0 } : { opacity: 0, y: 22 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={viewportOnce}
        transition={{ duration: reduce ? duration.micro : duration.ui, ease: easeTide }}
      />
      <div className={flip ? "md:order-1" : ""}>
        <h2 className="font-display text-3xl text-navy">{title}</h2>
        <p className="mt-3 text-sm leading-7 text-muted">{text}</p>
      </div>
    </div>
  );
}

function TableRequest({ eligibility, user, ready }) {
  const [date, setDate] = useState(null);
  const [slot, setSlot] = useState("Dinner");
  const [guests, setGuests] = useState(2);
  const [noted, setNoted] = useState("");
  const [fault, setFault] = useState("");
  const [busy, setBusy] = useState(false);

  const canBook = Boolean(eligibility?.canOrder);

  async function submit(event) {
    event.preventDefault();
    if (!ready) return;
    if (!user) {
      setFault("Sign in to reserve a table.");
      return;
    }
    if (!canBook) {
      setFault(eligibility?.reason || "Table booking opens after check-in.");
      return;
    }
    if (!date) {
      setFault("Choose a date.");
      setNoted("");
      return;
    }
    setBusy(true);
    setFault("");
    try {
      const data = await api("/dining/table-bookings", {
        method: "POST",
        body: {
          date: toStayIso(date),
          slot,
          partySize: guests,
        },
      });
      setNoted(`Requested ${format(date, "d MMM")} · ${slot} · ${guests} guests (Room ${data.booking?.roomNumber || eligibility.roomNumber || "—"}).`);
      notify("Table request sent to the dining desk.");
    } catch (error) {
      setFault(error.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={submit} noValidate className="rounded-[24px] bg-white p-5 shadow-[0_16px_40px_rgba(7,27,43,0.08)]">
      <h2 className="font-display text-2xl text-navy">Reserve a table</h2>
      <p className="mt-1 text-sm text-muted">
        {canBook
          ? "In-house only — the dining desk will seat you."
          : "Available after front desk check-in (same rule as food orders)."}
      </p>
      <div className="mt-3 rounded-2xl bg-cream p-2">
        <DayPicker mode="single" selected={date} onSelect={setDate} disabled={{ before: new Date() }} />
      </div>
      {date && <p className="mt-2 text-sm text-navy">{format(date, "d MMM yyyy")}</p>}
      <InlineError id="table-date">{fault}</InlineError>
      <div className="mt-3 flex flex-wrap gap-2" role="group" aria-label="Time">
        {tableSlots.map((item) => (
          <button
            key={item}
            type="button"
            aria-pressed={slot === item}
            onClick={() => setSlot(item)}
            className={`inline-flex h-11 cursor-pointer items-center rounded-full px-4 text-sm font-semibold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold ${slot === item ? "bg-gold text-navy" : "bg-cream text-navy"}`}
          >
            {item}
          </button>
        ))}
      </div>
      <div className="mt-4 flex min-h-11 items-center justify-between text-sm text-navy">
        <span>Guests</span>
        <div className="flex items-center gap-2">
          <button type="button" aria-label="Fewer guests" disabled={guests <= 1} onClick={() => setGuests((value) => value - 1)} className="grid h-11 w-11 cursor-pointer place-items-center rounded-full border border-navy/15 focus-visible:outline-2 focus-visible:outline-gold disabled:opacity-40">
            <Minus className="h-4 w-4" />
          </button>
          <span className="w-4 text-center">{guests}</span>
          <button type="button" aria-label="More guests" disabled={guests >= 8} onClick={() => setGuests((value) => value + 1)} className="grid h-11 w-11 cursor-pointer place-items-center rounded-full border border-navy/15 focus-visible:outline-2 focus-visible:outline-gold disabled:opacity-40">
            <Plus className="h-4 w-4" />
          </button>
        </div>
      </div>
      {!user ? (
        <Link to="/login?return=/dining" className="mt-4 inline-flex h-11 items-center rounded-full bg-gold px-5 text-sm font-semibold text-navy">
          Sign in to request
        </Link>
      ) : (
        <button
          type="submit"
          disabled={busy || (user.role === "guest" && !canBook)}
          className="mt-4 inline-flex h-11 cursor-pointer items-center rounded-full bg-gold px-5 text-sm font-semibold text-navy focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold disabled:opacity-50"
        >
          {busy ? "Sending…" : "Request table"}
        </button>
      )}
      {noted ? (
        <p className="mt-3 text-sm text-navy" role="status">{noted}</p>
      ) : null}
    </form>
  );
}

function HoursCard() {
  return (
    <article className="rounded-[24px] bg-navy p-6 text-white">
      <h2 className="font-display text-2xl">Opening hours</h2>
      <ul className="mt-4 grid gap-3">
        {houseHours.map((row) => (
          <li key={row.place} className="flex items-center justify-between gap-3 border-b border-white/10 pb-3 text-sm last:border-0">
            <span>{row.place}</span>
            <span className="text-gold">{row.hours}</span>
          </li>
        ))}
      </ul>
    </article>
  );
}
