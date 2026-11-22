import { Bell, BedDouble, ClipboardList, ConciergeBell, ImageIcon, LayoutDashboard, MessageCircle, Settings, Sparkles, UserRound, Users, UtensilsCrossed, Warehouse, Wrench } from "lucide-react";
import { lazy, Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { EmptyState } from "../components/ui/EmptyState";
import { ErrorState } from "../components/ui/ErrorState";
import { Skeleton } from "../components/ui/Skeleton";
import { BookingsTable } from "../components/dashboard/BookingsTable";
import { DashboardShell } from "../components/dashboard/DashboardShell";
import { HouseKanban } from "../components/dashboard/HouseKanban";
import { DeskMessagesPanel } from "../components/dashboard/DeskMessagesPanel";
import { DiningBoard } from "../components/dashboard/DiningBoard";
import { GalleryImagePicker } from "../components/dashboard/GalleryImagePicker";
import { RoomTable } from "../components/dashboard/RoomTable";
import { StayTimeline } from "../components/dashboard/StayTimeline";
import { notify } from "../components/ui/BayToaster";
import { useAuth } from "../context/AuthContext";
import { api, downloadCsv } from "../lib/api";
import { emailjsConfigured, sendInvoiceEmail } from "../lib/emailjs";
import { useOpsPulse } from "../lib/live";
import { duration, easeTide, tideDelay } from "../lib/motion";
import { homeFor } from "../lib/roles";
import { getAccessToken } from "../lib/session";

const DeskVisuals = lazy(() => import("../components/dashboard/DeskCharts.jsx").then((module) => ({ default: module.DeskVisuals })));

const inputClass = "bay-field mt-1 w-full px-3";
const cardClass = "rounded-2xl border border-navy/8 bg-[#faf8f4] p-3.5 text-sm";

const deskCopy = {
  admin: ["Hotel command", "The whole house, from rooms to staff"],
  manager: ["Manager desk", "Occupancy, revenue and the floor"],
  receptionist: ["Front desk", "Arrivals, bills and guest requests"],
  housekeeping: ["Housekeeping", "Rooms waiting to be turned"],
  maintenance: ["Maintenance", "Open tickets and resolutions"],
  guest: ["Your stay", "Reservations, requests and profile"],
};

export function PortalPage() {
  const { user, ready } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { pathname, search } = location;
  const reduce = useReducedMotion();
  const [note, setNote] = useState("");
  const tell = useCallback((message) => {
    setNote(message);
    if (message) notify(message);
  }, []);
  const [active, setActive] = useState("");
  const [pulse, setPulse] = useState(0);
  useOpsPulse(() => setPulse((value) => value + 1));

  useEffect(() => {
    if (!ready) return;
    if (!user) navigate("/login");
    else if (pathname === "/portal") navigate(homeFor(user.role), { replace: true });
  }, [ready, user, navigate, pathname]);

  const sections = useMemo(() => (user ? sectionsFor(user.role) : []), [user]);

  useEffect(() => {
    if (!sections.length) return;
    const tab = new URLSearchParams(search).get("tab");
    if (tab && sections.some((section) => section.id === tab)) {
      setActive(tab);
      return;
    }
    // Housekeeping / maintenance land on their work board first.
    if (!active) {
      const preferred =
        (user?.role === "housekeeping" && sections.find((section) => section.id === "housekeeping")) ||
        (user?.role === "maintenance" && sections.find((section) => section.id === "maintenance"));
      setActive(preferred?.id || sections[0].id);
      return;
    }
    if (!sections.some((section) => section.id === active)) setActive(sections[0].id);
  }, [sections, active, search, user?.role]);

  if (!user) return null;

  const role = user.role;
  const staffCalm = ["receptionist", "housekeeping", "maintenance"].includes(role);
  const adminCalm = ["admin", "manager"].includes(role);
  const [title, eyebrow] = deskCopy[role] || ["Desk", role];

  return (
    <DashboardShell title={title} eyebrow={eyebrow} user={user} sections={sections} active={active} onSelect={setActive}>
      <AnimatePresence>
        {note ? (
          <motion.p
            className="mb-4 rounded-2xl border border-gold/50 bg-gold/15 px-4 py-3 text-sm text-navy"
            role="status"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: reduce ? duration.micro : duration.ui, ease: easeTide }}
          >
            {note}
          </motion.p>
        ) : null}
      </AnimatePresence>
      {active === "overview" && <Reports onNote={tell} pulse={pulse} calm={adminCalm} />}
      {active === "stay" && <GuestStay onNote={tell} pulse={pulse} calm={role === "guest"} />}
      {active === "profile" && <GuestProfile onNote={tell} calm={role === "guest"} />}
      {active === "inventory" && <Inventory onNote={tell} pulse={pulse} calm={adminCalm} />}
      {active === "media" && <MediaPanel onNote={tell} calm={adminCalm} />}
      {active === "guests" && <GuestDesk onNote={tell} pulse={pulse} calm={staffCalm} />}
      {active === "desk" && <FrontDesk onNote={tell} pulse={pulse} calm={staffCalm} />}
      {active === "messages" && (
        <Panel title="Messages" calm={staffCalm || role === "guest"}>
          {role === "guest" ? (
            <div className="rounded-2xl border border-navy/10 bg-[#faf8f4] px-4 py-5">
              <p className="font-display text-xl text-navy">Your private inbox</p>
              <p className="mt-1 text-sm text-muted">
                Conversations with the desk live on the website Messages page — not mixed with other guests.
              </p>
              <Link
                to="/messages"
                className="mt-4 inline-flex h-11 items-center rounded-full bg-gold px-5 text-sm font-semibold text-navy"
              >
                Open Messages
              </Link>
            </div>
          ) : (
            <DeskMessagesPanel onNote={tell} pulse={pulse} />
          )}
        </Panel>
      )}
      {active === "dining" && (
        <Panel title="Dining" calm={staffCalm}>
          <DiningBoard
            onNote={tell}
            pulse={pulse}
            canManageMenu={["admin", "manager"].includes(role)}
            canSeeReports={["admin", "manager"].includes(role)}
          />
        </Panel>
      )}
      {active === "housekeeping" && <HousekeepingBoard onNote={tell} pulse={pulse} calm={staffCalm} canUpdate={role !== "receptionist"} canAssign={["admin", "manager"].includes(role)} />}
      {active === "maintenance" && <MaintenanceBoard onNote={tell} pulse={pulse} calm={staffCalm} canUpdate={["admin", "manager", "maintenance"].includes(role)} canAssign={["admin", "manager"].includes(role)} />}
      {active === "services" && <ServiceBoard onNote={tell} pulse={pulse} calm={staffCalm} />}
      {active === "staff" && <StaffAdmin onNote={tell} calm={adminCalm} />}
      {active === "settings" && <SettingsPanel onNote={tell} calm={adminCalm} />}
      {active === "alerts" && <Notifications onNote={tell} calm={role === "guest"} onOpenLink={setActive} />}
    </DashboardShell>
  );
}

function sectionsFor(role) {
  const desk = ["admin", "manager", "receptionist"].includes(role);
  const manager = ["admin", "manager"].includes(role);
  return [
    manager && { id: "overview", label: "Overview", icon: LayoutDashboard },
    role === "guest" && { id: "stay", label: "Your stay", icon: BedDouble },
    role === "guest" && { id: "messages", label: "Messages", icon: MessageCircle },
    role === "guest" && { id: "profile", label: "Profile", icon: UserRound },
    desk && { id: "desk", label: "Front desk", icon: ConciergeBell },
    desk && { id: "messages", label: "Messages", icon: MessageCircle },
    desk && { id: "dining", label: "Dining", icon: UtensilsCrossed },
    desk && { id: "guests", label: "Guests", icon: UserRound },
    manager && { id: "inventory", label: "Inventory", icon: Warehouse },
    manager && { id: "media", label: "Media", icon: ImageIcon },
    ["admin", "manager", "receptionist", "housekeeping"].includes(role) && { id: "housekeeping", label: "Housekeeping", icon: Sparkles },
    ["admin", "manager", "receptionist", "maintenance"].includes(role) && { id: "maintenance", label: "Maintenance", icon: Wrench },
    desk && { id: "services", label: "Services", icon: ClipboardList },
    role === "admin" && { id: "staff", label: "Staff", icon: Users },
    role === "admin" && { id: "settings", label: "Settings", icon: Settings },
    { id: "alerts", label: "Alerts", icon: Bell },
  ].filter(Boolean);
}

function Panel({ title, children, calm = false }) {
  const reduce = useReducedMotion();
  const body = (
    <>
      <h2 className="font-display text-[1.65rem] text-navy">{title}</h2>
      <div className="mt-4">{children}</div>
    </>
  );

  return (
    <section className="rounded-[22px] border border-white bg-white p-5 shadow-[0_18px_44px_rgba(7,27,43,0.06)] sm:p-6">
      {calm ? (
        <motion.div
          initial={reduce ? { opacity: 0 } : { opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: reduce ? duration.micro : duration.ui, ease: easeTide }}
        >
          {body}
        </motion.div>
      ) : body}
    </section>
  );
}

function SoftRow({ children, calm, index = 0, className = "", as = "li" }) {
  const reduce = useReducedMotion();
  if (!calm) {
    const Tag = as;
    return <Tag className={className}>{children}</Tag>;
  }
  const Tag = motion[as];
  return (
    <Tag
      className={className}
      initial={reduce ? { opacity: 0 } : { opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: reduce ? duration.micro : duration.ui, delay: reduce ? 0 : tideDelay(index), ease: easeTide }}
    >
      {children}
    </Tag>
  );
}

function Notifications({ onNote, calm = false, onOpenLink }) {
  const [items, setItems] = useState([]);
  useEffect(() => {
    api("/auth/notifications").then((data) => setItems(data.notifications)).catch((error) => onNote(error.message));
  }, [onNote]);
  if (!items.length) {
    return (
      <Panel title="Alerts" calm={calm}>
        <EmptyState title="Nothing waiting." text="New stays, requests and tickets will land here." />
      </Panel>
    );
  }
  return (
    <Panel title="Alerts" calm={calm}>
      <ul className="grid gap-2">
        {items.map((item, index) => (
          <SoftRow key={item._id} calm={calm} index={index} className="flex items-start justify-between gap-3 text-sm">
            <span>
              <strong className="text-navy">{item.title}.</strong> {item.message}
              {item.link && onOpenLink ? (
                <button
                  type="button"
                  className="ml-2 cursor-pointer font-semibold text-navy underline"
                  onClick={() => {
                    const tab = new URL(item.link, window.location.origin).searchParams.get("tab");
                    if (tab) onOpenLink(tab);
                    if (!item.readAt) {
                      api(`/auth/notifications/${item._id}/read`, { method: "PATCH" }).then(() =>
                        setItems((current) =>
                          current.map((row) => (row._id === item._id ? { ...row, readAt: new Date().toISOString() } : row)),
                        ),
                      );
                    }
                  }}
                >
                  Open board
                </button>
              ) : null}
            </span>
            {!item.readAt && (
              <button
                type="button"
                className="cursor-pointer text-gold"
                onClick={() => api(`/auth/notifications/${item._id}/read`, { method: "PATCH" }).then(() => setItems((current) => current.map((row) => row._id === item._id ? { ...row, readAt: new Date().toISOString() } : row)))}
              >
                Mark read
              </button>
            )}
          </SoftRow>
        ))}
      </ul>
    </Panel>
  );
}

function GuestStay({ onNote, pulse, calm = false }) {
  const [rows, setRows] = useState([]);
  const [stayState, setStayState] = useState("loading");
  const [fault, setFault] = useState("");
  const [form, setForm] = useState({ type: "Room service", description: "", rating: "5", comment: "" });

  function load() {
    setStayState("loading");
    api("/reservations")
      .then((data) => {
        setRows(data.reservations);
        setStayState("ready");
      })
      .catch((error) => {
        setFault(error.message);
        setStayState("error");
        onNote(error.message);
      });
  }
  useEffect(load, [pulse]);

  return (
    <Panel title="Your stay" calm={calm}>
      <p className="mb-3 text-sm leading-relaxed text-muted">
        Cancel a confirmed stay here, or manage bookings on{" "}
        <Link to="/my-bookings" className="font-semibold text-navy underline">My bookings</Link>.
        To change or extend dates, message the desk from{" "}
        <Link to="/messages?topic=date_change&compose=1" className="font-semibold text-navy underline">Messages</Link>
        {" "}(pick free nights) — staff reply there and then Move dates on Front desk.
        In-house dining orders:{" "}
        <Link to="/dining" className="font-semibold text-navy underline">Dining</Link>
        {" "}(after check-in only).
      </p>
      <GuestDiningOrders pulse={pulse} />
      <GuestRoomCare onNote={onNote} pulse={pulse} />
      {stayState === "loading" && (
        <div className="grid gap-3" aria-busy="true" aria-live="polite">
          <Skeleton className="h-16 w-full" />
          <Skeleton className="h-16 w-full" />
        </div>
      )}
      {stayState === "error" && <ErrorState title="Could not load your stay" text={fault} onRetry={load} />}
      {stayState === "ready" && !rows.length && (
        <EmptyState title="No stays yet." text="Reserve one from the booking page." />
      )}
      {stayState === "ready" && rows.length > 0 && (
      <ul className="grid gap-3">
        {rows.map((row, index) => (
          <SoftRow key={row.id} as="li" calm={calm} index={index} className={cardClass}>
            <p className="font-semibold text-navy">{row.confirmationCode} · {row.roomType} {row.roomNumber}</p>
            <p className="text-muted">{row.checkIn} to {row.checkOut} · {row.status} · ${row.totalAmount}</p>
            {row.status === "confirmed" && (
              <form className="mt-2 flex flex-wrap items-center gap-2" onSubmit={(event) => {
                event.preventDefault();
                const note = new FormData(event.currentTarget).get("note");
                api(`/reservations/${row.id}`, { method: "PATCH", body: { specialRequests: note } }).then(() => onNote("Request saved.")).catch((error) => onNote(error.message));
              }}>
                <input name="note" className="bay-field min-w-40 flex-1 px-3" defaultValue={row.specialRequests} placeholder="Special request" />
                <button type="submit" className="cursor-pointer rounded-full border border-navy/15 px-3 py-1">Save note</button>
                <button type="button" className="cursor-pointer text-sm font-semibold text-navy underline" onClick={() => api(`/reservations/${row.id}`, { method: "PATCH", body: { status: "cancelled" } }).then(load).catch((error) => onNote(error.message))}>Cancel</button>
              </form>
            )}
          </SoftRow>
        ))}
      </ul>
      )}
      <form className="mt-4 grid gap-3 sm:grid-cols-2" onSubmit={(event) => {
        event.preventDefault();
        api("/service-requests", { method: "POST", body: { type: form.type, description: form.description } })
          .then(() => onNote("Service request sent to the front desk."))
          .catch((error) => onNote(error.message));
      }}>
        <label className="text-sm">Service
          <select className={inputClass} value={form.type} onChange={(event) => setForm({ ...form, type: event.target.value })}>
            {["Room service", "Wake-up call", "Laundry", "Transportation"].map((type) => <option key={type}>{type}</option>)}
          </select>
        </label>
        <label className="text-sm">Details
          <input className={inputClass} value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} />
        </label>
        <button className="cursor-pointer rounded-full bg-gold px-4 py-2 text-sm font-semibold text-navy sm:col-span-2" type="submit">Request service</button>
      </form>
      <form className="mt-4 grid gap-3" onSubmit={(event) => {
        event.preventDefault();
        api("/feedback", { method: "POST", body: { rating: Number(form.rating), comment: form.comment, title: "Guest note" } })
          .then(() => onNote("Thank you. Your feedback was submitted — it appears on the site after the desk publishes it."))
          .catch((error) => onNote(error.message));
      }}>
        <label className="text-sm">Rating
          <input className={inputClass} type="number" min="1" max="5" value={form.rating} onChange={(event) => setForm({ ...form, rating: event.target.value })} />
        </label>
        <label className="text-sm">Comment
          <textarea className={inputClass} value={form.comment} onChange={(event) => setForm({ ...form, comment: event.target.value })} />
        </label>
        <button className="cursor-pointer rounded-full bg-navy px-4 py-2 text-sm font-semibold text-white" type="submit">Send feedback</button>
      </form>
    </Panel>
  );
}

function GuestDiningOrders({ pulse = 0 }) {
  const [orders, setOrders] = useState([]);
  const [eligibility, setEligibility] = useState(null);

  useEffect(() => {
    api("/dining/eligibility").then(setEligibility).catch(() => setEligibility(null));
    api("/dining/orders")
      .then((data) => setOrders((data.orders || []).slice(0, 5)))
      .catch(() => setOrders([]));
  }, [pulse]);

  return (
    <div className="mb-4 rounded-2xl border border-navy/10 bg-[#faf8f4] px-4 py-4">
      <p className="text-[11px] font-medium tracking-[0.14em] text-gold uppercase">Dining</p>
      {eligibility?.canOrder ? (
        <p className="mt-1 text-sm text-navy">
          Checked in{eligibility.roomNumber ? ` · Room ${eligibility.roomNumber}` : ""}.{" "}
          <Link to="/dining" className="font-semibold underline">Order on Dining</Link>
        </p>
      ) : (
        <p className="mt-1 text-sm text-muted">{eligibility?.reason || "Order food after check-in."}</p>
      )}
      {orders.length ? (
        <ul className="mt-3 grid gap-1 text-sm">
          {orders.map((order) => (
            <li key={order.id} className="flex justify-between gap-2">
              <span className="text-navy">{order.orderNumber} · {order.status}</span>
              <span className="text-muted">${order.subtotal}</span>
            </li>
          ))}
        </ul>
      ) : null}
      {orders.some((order) => order.status === "placed") ? (
        <p className="mt-2 text-xs text-muted">Ask the dining desk to cancel a just-placed order if needed.</p>
      ) : null}
    </div>
  );
}

function GuestRoomCare({ onNote, pulse = 0 }) {
  const [data, setData] = useState(null);
  const [busy, setBusy] = useState("");

  function load() {
    api("/housekeeping/my-requests")
      .then(setData)
      .catch(() => setData({ canRequest: false, reason: "Could not load room care.", requests: [] }));
  }

  useEffect(load, [pulse]);

  async function act(action) {
    setBusy(action);
    try {
      await api("/housekeeping/guest-request", { method: "POST", body: { action } });
      if (action === "makeup") onNote?.("Cleaning requested — housekeeping will see it.");
      if (action === "dnd") onNote?.("Do not disturb is on.");
      if (action === "clear_dnd") onNote?.("Do not disturb cleared.");
      load();
    } catch (error) {
      onNote?.(error.message);
    } finally {
      setBusy("");
    }
  }

  const requests = data?.requests || [];

  return (
    <div className="mb-4 rounded-2xl border border-navy/10 bg-white px-4 py-4 shadow-[0_10px_24px_rgba(7,27,43,0.04)]">
      <p className="text-[11px] font-medium tracking-[0.14em] text-gold uppercase">Room care</p>
      <p className="mt-1 font-display text-xl text-navy">Housekeeping</p>
      {!data?.canRequest ? (
        <p className="mt-1 text-sm text-muted">{data?.reason || "Available after check-in."}</p>
      ) : (
        <>
          <p className="mt-1 text-sm text-muted">
            Room {data.roomNumber || "—"}. Request cleaning or set Do not disturb — you will see status here.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <button
              type="button"
              disabled={Boolean(busy) || data.dndActive}
              onClick={() => act("makeup")}
              className="h-11 cursor-pointer rounded-full bg-gold px-4 text-sm font-semibold text-navy disabled:opacity-50"
            >
              {busy === "makeup" ? "Sending…" : "Request room cleaning"}
            </button>
            {!data.dndActive ? (
              <button
                type="button"
                disabled={Boolean(busy)}
                onClick={() => act("dnd")}
                className="h-11 cursor-pointer rounded-full border border-navy/15 px-4 text-sm font-semibold text-navy disabled:opacity-50"
              >
                {busy === "dnd" ? "Saving…" : "Do not disturb"}
              </button>
            ) : (
              <button
                type="button"
                disabled={Boolean(busy)}
                onClick={() => act("clear_dnd")}
                className="h-11 cursor-pointer rounded-full bg-navy px-4 text-sm font-semibold text-white disabled:opacity-50"
              >
                {busy === "clear_dnd" ? "Clearing…" : "Clear Do not disturb"}
              </button>
            )}
          </div>
          {data.dndActive ? (
            <p className="mt-2 text-xs font-semibold text-navy">Do not disturb is active — staff will not enter for cleaning.</p>
          ) : null}
        </>
      )}
      {requests.length ? (
        <ul className="mt-3 grid gap-1.5 border-t border-navy/10 pt-3 text-sm">
          {requests.slice(0, 6).map((row) => (
            <li key={row.id} className="flex justify-between gap-2">
              <span className="text-navy">{row.typeLabel || row.type}</span>
              <span className="text-muted">{row.guestStatus || row.status}</span>
            </li>
          ))}
        </ul>
      ) : null}
    </div>
  );
}

function GuestProfile({ onNote, calm = false }) {
  const [form, setForm] = useState({ phone: "", nationality: "", idProof: "", preferences: "" });

  useEffect(() => {
    api("/guests/me")
      .then((data) => setForm({
        phone: data.guest.phone || "",
        nationality: data.guest.nationality || "",
        idProof: data.guest.idProof || "",
        preferences: (data.guest.preferences || []).join(", "),
      }))
      .catch((error) => onNote(error.message));
  }, [onNote]);

  return (
    <Panel title="Your profile" calm={calm}>
      <form className="grid gap-3 sm:grid-cols-2" onSubmit={(event) => {
        event.preventDefault();
        api("/guests/me", {
          method: "PATCH",
          body: {
            phone: form.phone,
            nationality: form.nationality,
            idProof: form.idProof,
            preferences: form.preferences.split(",").map((item) => item.trim()).filter(Boolean),
          },
        }).then(() => onNote("Profile saved.")).catch((error) => onNote(error.message));
      }}>
        <label className="text-sm">Phone
          <input className={inputClass} value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} />
        </label>
        <label className="text-sm">Nationality
          <input className={inputClass} value={form.nationality} onChange={(event) => setForm({ ...form, nationality: event.target.value })} />
        </label>
        <label className="text-sm">ID proof
          <input className={inputClass} value={form.idProof} onChange={(event) => setForm({ ...form, idProof: event.target.value })} />
        </label>
        <label className="text-sm">Preferences
          <input className={inputClass} placeholder="High floor, late checkout" value={form.preferences} onChange={(event) => setForm({ ...form, preferences: event.target.value })} />
        </label>
        <button className="cursor-pointer rounded-full bg-navy px-4 py-2 text-sm font-semibold text-white sm:col-span-2" type="submit">Save profile</button>
      </form>
    </Panel>
  );
}

function Inventory({ onNote, pulse, calm = false }) {
  const [types, setTypes] = useState([]);
  const [rooms, setRooms] = useState([]);
  const [typeForm, setTypeForm] = useState({ name: "", baseRate: "180", maxAdults: "2", maxChildren: "1", bedType: "King Bed", image: "", amenities: [] });
  const [amenityDraft, setAmenityDraft] = useState("");
  const [editAmenityDraft, setEditAmenityDraft] = useState("");
  const [roomForm, setRoomForm] = useState({ roomNumber: "", roomTypeId: "", floor: "1" });
  const [editType, setEditType] = useState(null);
  const [editRoom, setEditRoom] = useState(null);
  const [listState, setListState] = useState("loading");
  const [fault, setFault] = useState("");
  const editTypeRef = useRef(null);
  const editRoomRef = useRef(null);

  function load() {
    setListState("loading");
    Promise.all([api("/room-types?all=1"), api("/rooms?all=1")])
      .then(([typeData, roomData]) => {
        setTypes(typeData.roomTypes);
        setRooms(roomData.rooms);
        const activeTypes = typeData.roomTypes.filter((type) => type.active !== false);
        setRoomForm((current) => ({
          ...current,
          roomTypeId: String(current.roomTypeId || activeTypes[0]?.id || typeData.roomTypes[0]?.id || ""),
        }));
        setListState("ready");
      })
      .catch((error) => {
        setFault(error.message);
        setListState("error");
        onNote(error.message);
      });
  }
  useEffect(load, [pulse]);

  useEffect(() => {
    if (!editType) return;
    editTypeRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [editType?.id]);

  useEffect(() => {
    if (!editRoom) return;
    editRoomRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [editRoom?.id]);

  const activeTypes = types.filter((type) => type.active !== false);

  function openTypeEdit(type) {
    setEditRoom(null);
    setEditAmenityDraft("");
    setEditType({
      id: String(type.id),
      name: type.name || "",
      slug: type.slug || "",
      baseRate: String(type.baseRate ?? ""),
      maxAdults: String(type.maxAdults ?? 2),
      maxChildren: String(type.maxChildren ?? 0),
      bedType: type.bedType || "King Bed",
      image: type.image || "",
      amenities: Array.isArray(type.amenities) ? [...type.amenities] : [],
    });
  }

  function pushAmenity(list, raw) {
    const next = String(raw || "")
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);
    if (!next.length) return list;
    const seen = new Set(list.map((item) => item.toLowerCase()));
    const merged = [...list];
    for (const item of next) {
      if (seen.has(item.toLowerCase())) continue;
      seen.add(item.toLowerCase());
      merged.push(item);
    }
    return merged;
  }

  function openRoomEdit(room) {
    setEditType(null);
    setEditRoom({
      id: String(room.id),
      roomNumber: room.roomNumber || "",
      roomTypeId: String(room.roomTypeId || ""),
      floor: String(room.floor ?? 1),
    });
  }

  return (
    <Panel title="Room inventory" calm={calm}>
      <p className="text-sm leading-relaxed text-muted">
        Inventory has two layers. <strong className="font-semibold text-navy">1) Room types</strong> are the catalog the website shows
        (name, nightly rate, bed, capacity, amenities, photo). <strong className="font-semibold text-navy">2) Rooms</strong> are physical doors
        (number + floor) linked to a type — e.g. type “Deluxe Room”, rooms 101 / 102 / 103.
        Photos come from the <strong className="font-semibold text-navy">Media</strong> tab — upload/name them there, then pick here (no URL paste).
      </p>

      <div className="mt-6 border-t border-navy/10 pt-5">
        <h3 className="font-display text-xl text-navy">1. Room types (website catalog)</h3>
        <p className="mt-1 text-sm text-muted">Add a type first. Guests book by type; the public Rooms page reads these.</p>
        <form
          className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3"
          onSubmit={(event) => {
            event.preventDefault();
            if (!typeForm.name.trim()) {
              onNote("Enter a room type name.");
              return;
            }
            const amenities = pushAmenity(typeForm.amenities || [], amenityDraft);
            api("/room-types", {
              method: "POST",
              body: {
                name: typeForm.name.trim(),
                baseRate: Number(typeForm.baseRate),
                maxAdults: Number(typeForm.maxAdults),
                maxChildren: Number(typeForm.maxChildren),
                bedType: typeForm.bedType.trim() || "King Bed",
                amenities,
                image: typeForm.image || undefined,
                gallery: typeForm.image ? [typeForm.image] : undefined,
              },
            })
              .then(() => {
                setTypeForm({ name: "", baseRate: "180", maxAdults: "2", maxChildren: "1", bedType: "King Bed", image: "", amenities: [] });
                setAmenityDraft("");
                onNote("Room type added. It will appear on the public site.");
                load();
              })
              .catch((error) => onNote(error.message));
          }}
        >
          <label className="text-sm text-navy">Type name
            <input className={inputClass} placeholder="e.g. Deluxe Sea View" value={typeForm.name} onChange={(event) => setTypeForm({ ...typeForm, name: event.target.value })} required />
          </label>
          <label className="text-sm text-navy">Nightly rate (USD)
            <input className={inputClass} type="number" min="1" step="1" placeholder="120" value={typeForm.baseRate} onChange={(event) => setTypeForm({ ...typeForm, baseRate: event.target.value })} required />
          </label>
          <label className="text-sm text-navy">Bed type
            <input className={inputClass} placeholder="King Bed" value={typeForm.bedType} onChange={(event) => setTypeForm({ ...typeForm, bedType: event.target.value })} />
          </label>
          <label className="text-sm text-navy">Max adults
            <input className={inputClass} type="number" min="1" value={typeForm.maxAdults} onChange={(event) => setTypeForm({ ...typeForm, maxAdults: event.target.value })} />
          </label>
          <label className="text-sm text-navy">Max children
            <input className={inputClass} type="number" min="0" value={typeForm.maxChildren} onChange={(event) => setTypeForm({ ...typeForm, maxChildren: event.target.value })} />
          </label>
          <div className="flex items-end">
            <button className="h-11 w-full cursor-pointer rounded-full bg-gold px-4 text-sm font-semibold text-navy sm:w-auto" type="submit">Add room type</button>
          </div>
          <GalleryImagePicker
            value={typeForm.image}
            onChange={(url) => setTypeForm((current) => ({ ...current, image: url }))}
            label="Room photo (from Media library)"
          />
          <div className="sm:col-span-2 lg:col-span-3">
            <p className="text-sm text-navy">Amenities</p>
            <p className="mt-0.5 text-xs text-muted">Shown on the public room page. Add one at a time or comma-separated.</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {(typeForm.amenities || []).map((item) => (
                <button
                  key={item}
                  type="button"
                  className="inline-flex cursor-pointer items-center gap-1 rounded-full border border-navy/15 bg-white px-3 py-1 text-xs font-semibold text-navy"
                  onClick={() => setTypeForm((current) => ({ ...current, amenities: (current.amenities || []).filter((row) => row !== item) }))}
                >
                  {item} <span aria-hidden="true">×</span>
                </button>
              ))}
            </div>
            <div className="mt-2 flex flex-wrap gap-2">
              <input
                className={`${inputClass} max-w-xs`}
                placeholder="e.g. Sea view, Balcony"
                value={amenityDraft}
                onChange={(event) => setAmenityDraft(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key !== "Enter") return;
                  event.preventDefault();
                  setTypeForm((current) => ({ ...current, amenities: pushAmenity(current.amenities || [], amenityDraft) }));
                  setAmenityDraft("");
                }}
              />
              <button
                type="button"
                className="h-11 cursor-pointer rounded-full border border-navy/15 px-4 text-sm font-semibold text-navy"
                onClick={() => {
                  setTypeForm((current) => ({ ...current, amenities: pushAmenity(current.amenities || [], amenityDraft) }));
                  setAmenityDraft("");
                }}
              >
                Add amenity
              </button>
            </div>
          </div>
        </form>

        {listState === "ready" && types.length > 0 && (
          <ul className="mt-4 grid gap-2 text-sm">
            {types.map((type, index) => {
              const typeId = String(type.id);
              const isEditing = editType && String(editType.id) === typeId;
              return (
                <SoftRow key={typeId} calm={calm} index={index} className="grid gap-2">
                  <div className={`${cardClass} flex flex-wrap items-center justify-between gap-3 ${isEditing ? "border-gold/50 ring-1 ring-gold/40" : ""}`}>
                    <span className="flex min-w-0 items-center gap-3">
                      {type.image ? (
                        <img src={type.image} alt="" className="h-12 w-16 shrink-0 rounded-lg object-cover" />
                      ) : (
                        <span className="grid h-12 w-16 shrink-0 place-items-center rounded-lg bg-navy/5 text-[10px] text-muted">No photo</span>
                      )}
                      <span>
                        <strong className="text-navy">{type.name}</strong>
                        {` · $${type.baseRate}/night · ${type.bedType || "Bed"} · ${type.maxAdults || 0} adults / ${type.maxChildren || 0} children`}
                        {type.active === false ? " · inactive" : ""}
                      </span>
                    </span>
                    <span className="flex gap-3">
                      <button
                        type="button"
                        className="cursor-pointer text-navy underline"
                        onClick={() => (isEditing ? setEditType(null) : openTypeEdit(type))}
                      >
                        {isEditing ? "Close" : "Edit"}
                      </button>
                      {type.active !== false && (
                        <button
                          type="button"
                          className="cursor-pointer text-navy underline"
                          onClick={() => api(`/room-types/${typeId}`, { method: "PATCH", body: { active: false } }).then(() => { onNote("Room type deactivated."); load(); }).catch((error) => onNote(error.message))}
                        >
                          Deactivate
                        </button>
                      )}
                      {type.active === false && (
                        <button
                          type="button"
                          className="cursor-pointer text-navy underline"
                          onClick={() => api(`/room-types/${typeId}`, { method: "PATCH", body: { active: true } }).then(() => { onNote("Room type restored."); load(); }).catch((error) => onNote(error.message))}
                        >
                          Restore
                        </button>
                      )}
                    </span>
                  </div>
                  {isEditing ? (
                    <form
                      ref={editTypeRef}
                      className="grid gap-3 rounded-2xl border border-gold/40 bg-cream p-4 sm:grid-cols-2 lg:grid-cols-3"
                      onSubmit={(event) => {
                        event.preventDefault();
                        if (!String(editType.name || "").trim()) {
                          onNote("Room type name is required.");
                          return;
                        }
                        const amenities = pushAmenity(editType.amenities || [], editAmenityDraft);
                        api(`/room-types/${editType.id}`, {
                          method: "PATCH",
                          body: {
                            name: String(editType.name).trim(),
                            baseRate: Number(editType.baseRate),
                            maxAdults: Number(editType.maxAdults),
                            maxChildren: Number(editType.maxChildren),
                            bedType: editType.bedType,
                            amenities,
                            image: editType.image || "",
                            gallery: editType.image ? [editType.image] : [],
                          },
                        }).then(() => { setEditType(null); setEditAmenityDraft(""); onNote("Room type saved."); load(); }).catch((error) => onNote(error.message));
                      }}
                    >
                      <p className="text-sm font-semibold text-navy sm:col-span-2 lg:col-span-3">
                        Editing room type — save when done
                      </p>
                      <label className="text-sm text-navy">Type name
                        <input className={inputClass} value={editType.name} onChange={(event) => setEditType({ ...editType, name: event.target.value })} required autoFocus />
                      </label>
                      <label className="text-sm text-navy">Nightly rate (USD)
                        <input className={inputClass} type="number" min="1" value={editType.baseRate} onChange={(event) => setEditType({ ...editType, baseRate: event.target.value })} />
                      </label>
                      <label className="text-sm text-navy">Bed type
                        <input className={inputClass} value={editType.bedType} onChange={(event) => setEditType({ ...editType, bedType: event.target.value })} />
                      </label>
                      <label className="text-sm text-navy">Max adults
                        <input className={inputClass} type="number" min="1" value={editType.maxAdults} onChange={(event) => setEditType({ ...editType, maxAdults: event.target.value })} />
                      </label>
                      <label className="text-sm text-navy">Max children
                        <input className={inputClass} type="number" min="0" value={editType.maxChildren} onChange={(event) => setEditType({ ...editType, maxChildren: event.target.value })} />
                      </label>
                      <GalleryImagePicker
                        value={editType.image || ""}
                        onChange={(url) => setEditType((current) => (current ? { ...current, image: url } : current))}
                        label="Room photo (from Media library)"
                      />
                      <div className="sm:col-span-2 lg:col-span-3">
                        <p className="text-sm text-navy">Amenities</p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {(editType.amenities || []).map((item) => (
                            <button
                              key={item}
                              type="button"
                              className="inline-flex cursor-pointer items-center gap-1 rounded-full border border-navy/15 bg-white px-3 py-1 text-xs font-semibold text-navy"
                              onClick={() => setEditType((current) => (current ? { ...current, amenities: (current.amenities || []).filter((row) => row !== item) } : current))}
                            >
                              {item} <span aria-hidden="true">×</span>
                            </button>
                          ))}
                        </div>
                        <div className="mt-2 flex flex-wrap gap-2">
                          <input
                            className={`${inputClass} max-w-xs`}
                            placeholder="e.g. Sea view"
                            value={editAmenityDraft}
                            onChange={(event) => setEditAmenityDraft(event.target.value)}
                            onKeyDown={(event) => {
                              if (event.key !== "Enter") return;
                              event.preventDefault();
                              setEditType((current) => (current ? { ...current, amenities: pushAmenity(current.amenities || [], editAmenityDraft) } : current));
                              setEditAmenityDraft("");
                            }}
                          />
                          <button
                            type="button"
                            className="h-11 cursor-pointer rounded-full border border-navy/15 px-4 text-sm font-semibold text-navy"
                            onClick={() => {
                              setEditType((current) => (current ? { ...current, amenities: pushAmenity(current.amenities || [], editAmenityDraft) } : current));
                              setEditAmenityDraft("");
                            }}
                          >
                            Add amenity
                          </button>
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2 sm:col-span-2 lg:col-span-3">
                        <button className="cursor-pointer rounded-full bg-navy px-4 py-2 text-sm font-semibold text-white" type="submit">Save type</button>
                        <button className="cursor-pointer rounded-full border border-navy/15 px-4 py-2 text-sm" type="button" onClick={() => { setEditType(null); setEditAmenityDraft(""); }}>Cancel</button>
                      </div>
                    </form>
                  ) : null}
                </SoftRow>
              );
            })}
          </ul>
        )}
      </div>

      <div className="mt-8 border-t border-navy/10 pt-5">
        <h3 className="font-display text-xl text-navy">2. Physical rooms (doors on the floor)</h3>
        <p className="mt-1 text-sm text-muted">
          Each row is one bookable room. <strong className="font-semibold text-navy">Floor</strong> is the building level (1, 2, 3…).
          Pick a room type from step 1, then give it a unique room number.
        </p>
        <form
          className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-4"
          onSubmit={(event) => {
            event.preventDefault();
            if (!roomForm.roomNumber.trim()) {
              onNote("Enter a room number (e.g. 101).");
              return;
            }
            if (!roomForm.roomTypeId) {
              onNote("Add a room type first, then choose it here.");
              return;
            }
            api("/rooms", {
              method: "POST",
              body: { roomNumber: roomForm.roomNumber.trim(), roomTypeId: roomForm.roomTypeId, floor: Number(roomForm.floor) || 1 },
            })
              .then(() => {
                setRoomForm({ ...roomForm, roomNumber: "" });
                onNote("Physical room added.");
                load();
              })
              .catch((error) => onNote(error.message));
          }}
        >
          <label className="text-sm text-navy">Room number
            <input className={inputClass} placeholder="e.g. 101" value={roomForm.roomNumber} onChange={(event) => setRoomForm({ ...roomForm, roomNumber: event.target.value })} required />
          </label>
          <label className="text-sm text-navy">Room type
            <select className={inputClass} value={roomForm.roomTypeId} onChange={(event) => setRoomForm({ ...roomForm, roomTypeId: event.target.value })} required>
              {!activeTypes.length ? <option value="">Add a room type first</option> : null}
              {activeTypes.map((type) => <option key={type.id} value={type.id}>{type.name}</option>)}
            </select>
          </label>
          <label className="text-sm text-navy">Floor (building level)
            <input className={inputClass} type="number" min="0" placeholder="1" value={roomForm.floor} onChange={(event) => setRoomForm({ ...roomForm, floor: event.target.value })} />
          </label>
          <div className="flex items-end">
            <button className="h-11 w-full cursor-pointer rounded-full bg-navy px-4 text-sm font-semibold text-white" type="submit" disabled={!activeTypes.length}>Add physical room</button>
          </div>
        </form>

        <RoomTable
          rooms={rooms}
          loading={listState === "loading"}
          fault={listState === "error" ? fault : ""}
          onEdit={openRoomEdit}
          onOffline={(id) => api(`/rooms/${id}`, { method: "PATCH", body: { status: "out_of_service", active: false } }).then(load).catch((error) => onNote(error.message))}
          onRestore={(id) => api(`/rooms/${id}`, { method: "PATCH", body: { active: true, status: "available" } }).then(() => { onNote("Room restored."); load(); }).catch((error) => onNote(error.message))}
        />

        {editRoom ? (
          <form
            ref={editRoomRef}
            className="mt-3 grid gap-3 rounded-2xl border border-gold/40 bg-cream p-4 sm:grid-cols-2 lg:grid-cols-4"
            onSubmit={(event) => {
              event.preventDefault();
              if (!String(editRoom.roomNumber || "").trim()) {
                onNote("Room number is required.");
                return;
              }
              api(`/rooms/${editRoom.id}`, {
                method: "PATCH",
                body: {
                  roomNumber: String(editRoom.roomNumber).trim(),
                  roomTypeId: editRoom.roomTypeId,
                  floor: Number(editRoom.floor),
                },
              }).then(() => { setEditRoom(null); onNote("Room saved."); load(); }).catch((error) => onNote(error.message));
            }}
          >
            <p className="text-sm font-semibold text-navy sm:col-span-2 lg:col-span-4">
              Editing physical room {editRoom.roomNumber} — Save room when done
            </p>
            <label className="text-sm text-navy">Room number
              <input className={inputClass} value={editRoom.roomNumber} onChange={(event) => setEditRoom({ ...editRoom, roomNumber: event.target.value })} required autoFocus />
            </label>
            <label className="text-sm text-navy">Room type
              <select className={inputClass} value={editRoom.roomTypeId} onChange={(event) => setEditRoom({ ...editRoom, roomTypeId: event.target.value })}>
                {!editRoom.roomTypeId ? <option value="">Select room type</option> : null}
                {types.map((type) => (
                  <option key={String(type.id)} value={String(type.id)}>{type.name}</option>
                ))}
              </select>
            </label>
            <label className="text-sm text-navy">Floor
              <input className={inputClass} type="number" min="0" value={editRoom.floor} onChange={(event) => setEditRoom({ ...editRoom, floor: event.target.value })} />
            </label>
            <div className="flex flex-wrap items-end gap-2">
              <button className="cursor-pointer rounded-full bg-navy px-4 py-2 text-sm font-semibold text-white" type="submit">Save room</button>
              <button className="cursor-pointer rounded-full border border-navy/15 px-4 py-2 text-sm" type="button" onClick={() => setEditRoom(null)}>Cancel</button>
            </div>
          </form>
        ) : null}
      </div>
    </Panel>
  );
}

function GuestDesk({ onNote, pulse, calm = false }) {
  const [guests, setGuests] = useState([]);
  const [query, setQuery] = useState("");
  const [form, setForm] = useState({ fullName: "", email: "", phone: "", nationality: "" });
  const [edit, setEdit] = useState(null);
  const [listState, setListState] = useState("loading");
  const [fault, setFault] = useState("");

  function load(nextQuery = query) {
    setListState("loading");
    const path = nextQuery ? `/guests?q=${encodeURIComponent(nextQuery)}&all=1` : "/guests?all=1";
    api(path)
      .then((data) => {
        setGuests(data.guests);
        setListState("ready");
      })
      .catch((error) => {
        setFault(error.message);
        setListState("error");
        onNote(error.message);
      });
  }
  useEffect(() => {
    load(query);
  }, [pulse]);

  return (
    <Panel title="Guest directory" calm={calm}>
      <form className="mb-3 flex gap-2" onSubmit={(event) => { event.preventDefault(); load(query); }}>
        <input className="bay-field min-w-0 flex-1 px-3" placeholder="Search guest name or email" value={query} onChange={(event) => setQuery(event.target.value)} aria-label="Search guests" />
        <button className="cursor-pointer rounded-full bg-navy px-4 text-sm font-semibold text-white" type="submit">Search</button>
      </form>
      <form className="grid gap-2 sm:grid-cols-4" onSubmit={(event) => {
        event.preventDefault();
        api("/guests", { method: "POST", body: form })
          .then(() => {
            setForm({ fullName: "", email: "", phone: "", nationality: "" });
            onNote("Guest profile created.");
            load();
          })
          .catch((error) => onNote(error.message));
      }}>
        <input className={inputClass} placeholder="Full name" value={form.fullName} onChange={(event) => setForm({ ...form, fullName: event.target.value })} required />
        <input className={inputClass} placeholder="Email" type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} required />
        <input className={inputClass} placeholder="Phone" value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} />
        <button className="cursor-pointer rounded-full bg-gold px-4 text-sm font-semibold text-navy" type="submit">Add guest</button>
      </form>
      {edit && (
        <form className="mt-3 grid gap-2 rounded-2xl border border-navy/8 bg-cream p-3 sm:grid-cols-3" onSubmit={(event) => {
          event.preventDefault();
          api(`/guests/${edit._id}`, {
            method: "PATCH",
            body: {
              fullName: edit.fullName,
              phone: edit.phone,
              nationality: edit.nationality,
              notes: edit.notes,
              idProof: edit.idProof,
              preferences: String(edit.preferencesText || "").split(",").map((item) => item.trim()).filter(Boolean),
              ...(!edit.userId ? { email: edit.email } : {}),
            },
          }).then(() => { setEdit(null); onNote("Guest saved."); load(); }).catch((error) => onNote(error.message));
        }}>
          <input className={inputClass} value={edit.fullName} onChange={(event) => setEdit({ ...edit, fullName: event.target.value })} aria-label="Guest name" />
          <input className={inputClass} value={edit.email} onChange={(event) => setEdit({ ...edit, email: event.target.value })} disabled={Boolean(edit.userId)} aria-label="Guest email" />
          <input className={inputClass} value={edit.phone || ""} onChange={(event) => setEdit({ ...edit, phone: event.target.value })} aria-label="Guest phone" />
          <input className={inputClass} value={edit.nationality || ""} onChange={(event) => setEdit({ ...edit, nationality: event.target.value })} placeholder="Nationality" aria-label="Nationality" />
          <input className={inputClass} value={edit.preferencesText || ""} onChange={(event) => setEdit({ ...edit, preferencesText: event.target.value })} placeholder="Preferences (comma separated)" aria-label="Preferences" />
          <div className="flex gap-2">
            <button className="cursor-pointer rounded-full bg-navy px-4 text-sm font-semibold text-white" type="submit">Save guest</button>
            <button className="cursor-pointer rounded-full border border-navy/15 px-4 text-sm" type="button" onClick={() => setEdit(null)}>Cancel</button>
          </div>
        </form>
      )}
      {listState === "loading" && <div className="mt-4" aria-busy="true"><Skeleton className="h-16 w-full" /><Skeleton className="mt-2 h-16 w-full" /></div>}
      {listState === "error" && <div className="mt-4"><ErrorState title="Guests could not load" text={fault} onRetry={() => load()} /></div>}
      {listState === "ready" && !guests.length && <div className="mt-4"><EmptyState title="No guests yet." text="Add a walk-in guest above." /></div>}
      {listState === "ready" && guests.length > 0 && (
        <ul className="mt-4 grid gap-2">
          {guests.map((guest, index) => (
            <SoftRow key={guest._id} calm={calm} index={index} className={`${cardClass} flex flex-wrap items-center justify-between gap-2`}>
              <span>
                <strong className="text-navy">{guest.fullName}</strong>
                {" · "}{guest.email}
                {guest.phone ? ` · ${guest.phone}` : ""}
                {guest.status === "inactive" ? " · inactive" : ""}
              </span>
              <span className="flex gap-3">
                <button
                  type="button"
                  className="cursor-pointer text-navy underline"
                  onClick={() => setEdit({
                    ...guest,
                    preferencesText: (guest.preferences || []).join(", "),
                  })}
                >
                  Edit
                </button>
                {guest.status !== "inactive" && (
                  <button
                    type="button"
                    className="cursor-pointer text-navy underline"
                    onClick={() => api(`/guests/${guest._id}`, { method: "PATCH", body: { status: "inactive" } }).then(() => { onNote("Guest deactivated."); load(); }).catch((error) => onNote(error.message))}
                  >
                    Deactivate
                  </button>
                )}
                {guest.status === "inactive" && (
                  <button
                    type="button"
                    className="cursor-pointer text-navy underline"
                    onClick={() => api(`/guests/${guest._id}`, { method: "PATCH", body: { status: "active" } }).then(() => { onNote("Guest restored."); load(); }).catch((error) => onNote(error.message))}
                  >
                    Restore
                  </button>
                )}
              </span>
            </SoftRow>
          ))}
        </ul>
      )}
    </Panel>
  );
}

function FrontDesk({ onNote, pulse, calm = false }) {
  const [rows, setRows] = useState([]);
  const [query, setQuery] = useState("");
  const [invoice, setInvoice] = useState(null);
  const [hotelName, setHotelName] = useState("Azure Bay");
  const [charge, setCharge] = useState({ description: "Dinner", unitPrice: "40" });
  const [sendingMail, setSendingMail] = useState(false);
  const [listState, setListState] = useState("loading");
  const [fault, setFault] = useState("");
  const deskReady = useRef(false);

  function load(nextQuery = query, quiet = false) {
    if (!quiet) setListState("loading");
    const path = nextQuery ? `/reservations?q=${encodeURIComponent(nextQuery)}` : "/reservations";
    api(path)
      .then((data) => {
        setRows(data.reservations);
        setListState("ready");
        deskReady.current = true;
      })
      .catch((error) => {
        setFault(error.message);
        setListState("error");
        onNote(error.message);
      });
  }
  useEffect(() => {
    load(query, deskReady.current);
  }, [pulse]);
  useEffect(() => {
    api("/settings")
      .then((data) => {
        const name = data.settings?.find((row) => row.key === "hotelName")?.value;
        if (name) setHotelName(String(name));
      })
      .catch(() => {});
  }, []);

  const handleCheckIn = useCallback((id) => {
    api(`/reservations/${id}/check-in`, { method: "POST", body: {} })
      .then(() => { onNote("Checked in."); load(query, true); })
      .catch((error) => onNote(error.message));
  }, [onNote, query]);

  const handleCheckOut = useCallback((id) => {
    api(`/reservations/${id}/check-out`, { method: "POST", body: {} })
      .then(() => { onNote("Checked out."); load(query, true); })
      .catch((error) => onNote(error.message));
  }, [onNote, query]);

  const handleNoShow = useCallback((id) => {
    api(`/reservations/${id}`, { method: "PATCH", body: { status: "no_show" } })
      .then(() => { onNote("Marked as a no-show."); load(query, true); })
      .catch((error) => onNote(error.message));
  }, [onNote, query]);

  const handleMoveDates = useCallback((id, checkIn, checkOut) => {
    return api(`/reservations/${id}`, { method: "PATCH", body: { checkIn, checkOut } })
      .then(() => { onNote("Stay dates updated."); load(query, true); })
      .catch((error) => {
        onNote(error.message);
        throw error;
      });
  }, [onNote, query]);

  const openBill = useCallback(async (id) => {
    const data = await api(`/invoices/by-reservation/${id}`);
    setInvoice((current) => {
      const stay = rows.find((row) => row.id === id);
      return {
        ...data.invoice,
        guestName: data.invoice.guestName || stay?.guest || current?.guestName || "",
        guestEmail: data.invoice.guestEmail || stay?.guestEmail || current?.guestEmail || "",
      };
    });
  }, [rows]);

  const handleInvoice = useCallback((id) => {
    openBill(id).catch((error) => onNote(error.message));
  }, [openBill, onNote]);

  const handleBulk = useCallback((selected, action) => {
    if (action === "copy") {
      const codes = selected.map((row) => row.confirmationCode).join("\n");
      navigator.clipboard.writeText(codes).then(
        () => onNote(`${selected.length} confirmation codes copied.`),
        () => onNote(codes),
      );
      return;
    }
    Promise.all(selected.map((row) => api(`/reservations/${row.id}/check-in`, { method: "POST", body: {} })))
      .then(() => {
        onNote(`${selected.length} stays checked in.`);
        load(query, true);
      })
      .catch((error) => onNote(error.message));
  }, [onNote, query]);

  async function emailInvoice() {
    if (!invoice || sendingMail) return;
    setSendingMail(true);
    try {
      await sendInvoiceEmail({
        toEmail: invoice.guestEmail,
        toName: invoice.guestName,
        invoiceNumber: invoice.invoiceNumber,
        hotelName,
        total: `$${invoice.grandTotal}`,
        status: invoice.status,
        lines: (invoice.items || []).map((item) => `${item.description}: $${item.lineTotal}`).join("\n"),
      });
      onNote(`Invoice emailed to ${invoice.guestEmail}.`);
    } catch (error) {
      onNote(error.message);
    } finally {
      setSendingMail(false);
    }
  }

  return (
    <Panel title="Front desk" calm={calm}>
      <div className="grid gap-5">
        <header className="rounded-2xl border border-navy/10 bg-[#faf8f4] px-4 py-4 sm:px-5">
          <p className="text-[11px] font-medium tracking-[0.16em] text-gold uppercase">Arrivals & stays</p>
          <p className="mt-1 max-w-2xl text-sm leading-relaxed text-muted">
            Find a stay, then use <strong className="font-semibold text-navy">⋮</strong> on that row:
            Details · Check in / No-show · Check out · Invoice. Select rows for bulk copy or check-in.
          </p>
          <form
            className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center"
            onSubmit={(event) => {
              event.preventDefault();
              load(query);
            }}
          >
            <label className="min-w-0 flex-1 text-sm text-navy">
              <span className="sr-only">Search guest or confirmation</span>
              <input
                className="bay-field w-full px-3"
                placeholder="Search guest name or confirmation code"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
              />
            </label>
            <button className="h-11 shrink-0 cursor-pointer rounded-full bg-navy px-5 text-sm font-semibold text-white" type="submit">
              Search
            </button>
          </form>
        </header>

        <section aria-label="Reservations">
          <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
            <h3 className="font-display text-xl text-navy">Stays</h3>
            <p className="text-xs text-muted">{rows.length ? `${rows.length} loaded` : "No rows yet"}</p>
          </div>
          <BookingsTable
            rows={rows}
            loading={listState === "loading" && !rows.length}
            fault={listState === "error" ? fault : ""}
            query={query}
            onNote={onNote}
            onCheckIn={handleCheckIn}
            onCheckOut={handleCheckOut}
            onNoShow={handleNoShow}
            onMoveDates={handleMoveDates}
            onInvoice={handleInvoice}
            onBulk={handleBulk}
          />
        </section>

        {invoice ? (
          <section aria-label="Invoice" className="rounded-2xl border border-navy/10 bg-white p-4 shadow-[0_16px_40px_rgba(7,27,43,0.06)] sm:p-5">
            <div className="mb-4 flex flex-wrap items-start justify-between gap-2 border-b border-navy/10 pb-3">
              <div>
                <p className="text-[11px] font-medium tracking-[0.16em] text-gold uppercase">Invoice</p>
                <p className="mt-1 font-display text-2xl text-navy">{invoice.invoiceNumber}</p>
              </div>
              <button
                type="button"
                className="cursor-pointer text-sm font-semibold text-navy underline"
                onClick={() => setInvoice(null)}
              >
                Close panel
              </button>
            </div>
            <div id="invoice-print" className="rounded-xl border border-navy/8 bg-[#faf8f4] p-4 text-sm text-navy">
              <p className="font-display text-2xl text-navy">{hotelName}</p>
              <p className="mt-1 font-semibold">{invoice.invoiceNumber} · {invoice.status}</p>
              {(invoice.guestName || invoice.guestEmail) && (
                <p className="mt-1 text-muted">
                  {invoice.guestName}
                  {invoice.guestEmail ? ` · ${invoice.guestEmail}` : ""}
                </p>
              )}
              <ul className="mt-3 grid gap-1 border-t border-navy/10 pt-3">
                {(invoice.items || []).map((item) => (
                  <li key={item.id} className="flex justify-between gap-3">
                    <span>{item.description}</span>
                    <span>${item.lineTotal}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-3 border-t border-navy/10 pt-3">
                <p>Subtotal ${invoice.subtotal}</p>
                <p>Tax ${invoice.taxTotal}</p>
                <p className="font-semibold">Total ${invoice.grandTotal}</p>
                <p>Paid ${invoice.amountPaid} · Due ${invoice.balanceDue}</p>
              </div>
            </div>
            <form
              className="mt-4 grid gap-2 print:hidden sm:grid-cols-[1fr_6rem_auto] sm:items-end"
              onSubmit={(event) => {
                event.preventDefault();
                api(`/invoices/${invoice.id}/items`, { method: "POST", body: { description: charge.description, unitPrice: Number(charge.unitPrice), category: "service" } })
                  .then((data) => setInvoice({
                    ...data.invoice,
                    guestName: invoice.guestName,
                    guestEmail: invoice.guestEmail,
                  }))
                  .catch((error) => onNote(error.message));
              }}
            >
              <label className="text-sm text-navy">
                Charge
                <input className="bay-field mt-1 w-full px-3" aria-label="Charge description" value={charge.description} onChange={(event) => setCharge({ ...charge, description: event.target.value })} />
              </label>
              <label className="text-sm text-navy">
                Amount
                <input className="bay-field mt-1 w-full px-3" aria-label="Charge amount" value={charge.unitPrice} onChange={(event) => setCharge({ ...charge, unitPrice: event.target.value })} />
              </label>
              <button className="h-11 cursor-pointer rounded-full bg-gold px-4 text-sm font-semibold text-navy" type="submit">Add charge</button>
            </form>
            <div className="mt-3 flex flex-wrap gap-2 print:hidden">
              <button className="h-11 cursor-pointer rounded-full bg-navy px-4 text-sm font-semibold text-white" type="button" onClick={() => api("/payments", { method: "POST", body: { invoiceId: invoice.id, amount: invoice.balanceDue, method: "card" } }).then((data) => setInvoice({ ...data.invoice, guestName: invoice.guestName, guestEmail: invoice.guestEmail })).catch((error) => onNote(error.message))}>Record payment</button>
              <button className="h-11 cursor-pointer rounded-full border border-navy/15 px-4 text-sm font-semibold text-navy" type="button" onClick={() => window.print()}>Print</button>
              <button
                className="h-11 cursor-pointer rounded-full border border-navy/15 px-4 text-sm font-semibold text-navy disabled:opacity-50"
                type="button"
                disabled={sendingMail}
                onClick={emailInvoice}
                title={emailjsConfigured() ? "Send via EmailJS" : "Configure VITE_EMAILJS_* in frontend/.env"}
              >
                {sendingMail ? "Sending…" : "Email invoice"}
              </button>
            </div>
          </section>
        ) : null}
      </div>
    </Panel>
  );
}

function HousekeepingBoard({ onNote, canUpdate, canAssign, pulse, calm = false }) {
  const [tasks, setTasks] = useState([]);
  const [staff, setStaff] = useState([]);
  const [listState, setListState] = useState("loading");
  const [fault, setFault] = useState("");
  function load(quiet = false) {
    if (!quiet) setListState("loading");
    api("/housekeeping/tasks")
      .then((data) => {
        setTasks(data.tasks);
        setListState("ready");
      })
      .catch((error) => {
        setFault(error.message);
        setListState("error");
        onNote(error.message);
      });
  }
  useEffect(() => {
    load();
  }, [pulse]);
  useEffect(() => {
    if (!canAssign) return;
    api("/users").then((data) => setStaff(data.users.filter((person) => person.role === "housekeeping" && person.status === "active"))).catch(() => {});
  }, [canAssign]);
  const openCount = tasks.filter((task) => task.status !== "completed").length;
  return (
    <Panel title="Housekeeping" calm={calm}>
      <p className="mb-3 text-sm text-muted">
        {listState === "ready"
          ? openCount
            ? `${openCount} open task${openCount === 1 ? "" : "s"} on your queue (unassigned + assigned to you). Managers see the full floor. Alerts also notify new work.`
            : "No open tasks on your queue. Unassigned or assigned-to-you work appears here; Alerts notify new requests."
          : "Loading the board…"}
      </p>
      <HouseKanban
        tasks={listState === "ready" ? tasks : []}
        loading={listState === "loading"}
        fault={listState === "error" ? fault : ""}
        canUpdate={canUpdate}
        canAssign={canAssign}
        staff={staff}
        onMove={(id, status) => api(`/housekeeping/tasks/${id}`, { method: "PATCH", body: { status } }).then(() => { onNote("Task moved."); load(true); }).catch((error) => onNote(error.message))}
        onAssign={(id, assignedTo) => {
          if (!assignedTo) return;
          api(`/housekeeping/tasks/${id}`, { method: "PATCH", body: { assignedTo, status: "assigned" } }).then(() => load(true)).catch((error) => onNote(error.message));
        }}
      />
    </Panel>
  );
}

function MaintenanceBoard({ onNote, canUpdate, canAssign, pulse, calm = false }) {
  const [tickets, setTickets] = useState([]);
  const [staff, setStaff] = useState([]);
  const [description, setDescription] = useState("");
  const [listState, setListState] = useState("loading");
  const [fault, setFault] = useState("");
  function load() {
    setListState("loading");
    api("/maintenance/tickets")
      .then((data) => {
        setTickets(data.tickets);
        setListState("ready");
      })
      .catch((error) => {
        setFault(error.message);
        setListState("error");
        onNote(error.message);
      });
  }
  useEffect(load, [pulse]);
  useEffect(() => {
    if (!canAssign) return;
    api("/users").then((data) => setStaff(data.users.filter((person) => person.role === "maintenance" && person.status === "active"))).catch(() => {});
  }, [canAssign]);
  return (
    <Panel title="Maintenance" calm={calm}>
      <form className="mb-3 flex gap-2" onSubmit={(event) => {
        event.preventDefault();
        api("/maintenance/tickets", { method: "POST", body: { description, category: "general", priority: "normal" } }).then(() => { setDescription(""); load(); }).catch((error) => onNote(error.message));
      }}>
        <input className="bay-field min-w-0 flex-1 px-3" placeholder="Describe the issue" aria-label="Describe the issue" value={description} onChange={(event) => setDescription(event.target.value)} />
        <button className="cursor-pointer rounded-full bg-gold px-4 text-sm font-semibold text-navy" type="submit">Report</button>
      </form>
      <ul className="grid gap-2 text-sm">
        {tickets.map((ticket, index) => (
          <SoftRow key={ticket.id} calm={calm} index={index} className={cardClass}>
            <p>{ticket.description} · {ticket.status}{ticket.assignedTo ? ` · ${ticket.assignedTo}` : ""}</p>
            {canAssign && staff.length > 0 && !["resolved", "closed"].includes(ticket.status) && (
              <select className="bay-field mt-2 w-full px-3" aria-label="Assign maintenance" value={ticket.assignedToId || ""} onChange={(event) => api(`/maintenance/tickets/${ticket.id}`, { method: "PATCH", body: { assignedTo: event.target.value } }).then(load)}>
                <option value="">Assign</option>
                {staff.map((person) => <option key={person._id} value={person._id}>{person.fullName}</option>)}
              </select>
            )}
            {canUpdate && !["resolved", "closed"].includes(ticket.status) && (
              <button type="button" className="mt-2 cursor-pointer rounded-full bg-navy px-3 py-1 text-white" onClick={() => api(`/maintenance/tickets/${ticket.id}`, { method: "PATCH", body: { status: "resolved", resolutionNote: "Resolved by maintenance." } }).then(load)}>
                Resolve
              </button>
            )}
          </SoftRow>
        ))}
        {listState === "error" && (
          <li>
            <ErrorState title="Tickets could not load" text={fault} />
          </li>
        )}
        {listState === "ready" && !tickets.length && (
          <li>
            <EmptyState title="No open tickets." />
          </li>
        )}
      </ul>
    </Panel>
  );
}

function ServiceBoard({ onNote, pulse, calm = false }) {
  const [requests, setRequests] = useState([]);
  const [listState, setListState] = useState("loading");
  const [fault, setFault] = useState("");
  function load() {
    setListState("loading");
    api("/service-requests")
      .then((data) => {
        setRequests(data.requests);
        setListState("ready");
      })
      .catch((error) => {
        setFault(error.message);
        setListState("error");
        onNote(error.message);
      });
  }
  useEffect(load, [pulse]);
  return (
    <Panel title="Guest services" calm={calm}>
      <ul className="grid gap-2 text-sm">
        {requests.map((request, index) => (
          <SoftRow key={request._id} calm={calm} index={index} className={`flex flex-wrap items-center justify-between gap-2 ${cardClass}`}>
            <span>{request.type}: {request.description} · {request.status}</span>
            {request.status !== "completed" && (
              <button type="button" className="cursor-pointer rounded-full bg-navy px-3 py-1 text-white" onClick={() => api(`/service-requests/${request._id}`, { method: "PATCH", body: { status: "completed" } }).then(load).catch((error) => onNote(error.message))}>
                Complete
              </button>
            )}
          </SoftRow>
        ))}
        {listState === "error" && (
          <li>
            <ErrorState title="Requests could not load" text={fault} />
          </li>
        )}
        {listState === "ready" && !requests.length && (
          <li>
            <EmptyState title="No open service requests." />
          </li>
        )}
      </ul>
    </Panel>
  );
}

function Reports({ onNote, pulse, calm = false }) {
  const [data, setData] = useState(null);
  const [reservations, setReservations] = useState(null);
  const [reportState, setReportState] = useState("loading");
  const [fault, setFault] = useState("");
  useEffect(() => {
    setReportState("loading");
    Promise.all([
      api("/reports/occupancy"),
      api("/reports/revenue"),
      api("/reports/guest-feedback"),
      api("/reports/performance").catch(() => null),
      api("/reservations").catch(() => null),
    ])
      .then(([occupancy, revenue, feedback, performance, stays]) => {
        setData({ occupancy, revenue, feedback, performance });
        setReservations(stays ? stays.reservations : null);
        setReportState("ready");
      })
      .catch((error) => {
        setFault(error.message);
        setReportState("error");
      });
  }, [pulse]);
  return (
    <Panel title="This house, today" calm={calm}>
      {reportState === "loading" && (
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4" aria-busy="true">
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-40 w-full" />
        </div>
      )}
      {reportState === "error" && <ErrorState title="Reports could not load" text={fault} />}
      {reportState === "ready" && data && (
        <Suspense
          fallback={
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4" aria-busy="true">
              <Skeleton className="h-40 w-full" />
              <Skeleton className="h-40 w-full" />
              <Skeleton className="h-40 w-full" />
              <Skeleton className="h-40 w-full" />
            </div>
          }
        >
          <DeskVisuals occupancy={data.occupancy} revenue={data.revenue} feedback={data.feedback} reservations={reservations} performance={data.performance} />
        </Suspense>
      )}
      <StayTimeline pulse={pulse} />
      {reportState === "ready" && (
      <div className="mt-4 flex flex-wrap gap-2">
        <button type="button" className="h-11 cursor-pointer rounded-full border border-navy/15 px-4 text-sm" onClick={() => downloadCsv("/reports/occupancy?format=csv", "occupancy.csv")}>Export occupancy</button>
        <button type="button" className="h-11 cursor-pointer rounded-full border border-navy/15 px-4 text-sm" onClick={() => downloadCsv("/reports/revenue?format=csv", "revenue.csv")}>Export revenue</button>
        <button type="button" className="h-11 cursor-pointer rounded-full border border-navy/15 px-4 text-sm" onClick={() => downloadCsv("/reports/guest-feedback?format=csv", "feedback.csv")}>Export feedback</button>
        <button type="button" className="h-11 cursor-pointer rounded-full border border-navy/15 px-4 text-sm" onClick={() => downloadCsv("/reports/performance?format=csv", "performance.csv")}>Export ADR / RevPAR</button>
      </div>
      )}
      <ReviewsModeration onNote={onNote} pulse={pulse} calm={calm} />
    </Panel>
  );
}

function ReviewsModeration({ onNote, pulse, calm = false }) {
  const [rows, setRows] = useState([]);
  const [state, setState] = useState("loading");
  const [fault, setFault] = useState("");

  function load() {
    setState("loading");
    api("/feedback/manage")
      .then((data) => {
        setRows(data.feedback || []);
        setState("ready");
      })
      .catch((error) => {
        setFault(error.message);
        setState("error");
      });
  }

  useEffect(load, [pulse]);

  function setPublished(id, published) {
    api(`/feedback/${id}`, { method: "PATCH", body: { published } })
      .then(() => {
        onNote(published ? "Review published on the website." : "Review hidden from the website.");
        load();
      })
      .catch((error) => onNote(error.message));
  }

  return (
    <div className="mt-8 border-t border-navy/10 pt-5">
      <h3 className="font-display text-xl text-navy">Guest reviews</h3>
      <p className="mt-1 text-sm text-muted">
        New guest feedback stays hidden until you publish it. Published stories appear on Home and room detail pages.
      </p>
      {state === "loading" && <Skeleton className="mt-3 h-24 w-full" />}
      {state === "error" && <div className="mt-3"><ErrorState title="Reviews could not load" text={fault} /></div>}
      {state === "ready" && !rows.length && (
        <div className="mt-3"><EmptyState title="No feedback yet." text="Guest Stay submissions will land here." /></div>
      )}
      {state === "ready" && rows.length > 0 && (
        <ul className="mt-3 grid gap-2 text-sm">
          {rows.map((row, index) => (
            <SoftRow key={String(row.id)} calm={calm} index={index} className={`${cardClass} flex flex-wrap items-start justify-between gap-3`}>
              <span className="min-w-0">
                <strong className="text-navy">{row.guest || "Guest"}</strong>
                {` · ${row.rating}/5`}
                {row.published ? " · live" : " · pending"}
                <span className="mt-1 block text-muted">{row.comment || row.title || "—"}</span>
              </span>
              <span className="flex gap-2">
                {row.published ? (
                  <button type="button" className="cursor-pointer rounded-full border border-navy/15 px-3 py-1 text-xs font-semibold" onClick={() => setPublished(row.id, false)}>
                    Hide
                  </button>
                ) : (
                  <button type="button" className="cursor-pointer rounded-full bg-navy px-3 py-1 text-xs font-semibold text-white" onClick={() => setPublished(row.id, true)}>
                    Publish
                  </button>
                )}
              </span>
            </SoftRow>
          ))}
        </ul>
      )}
    </div>
  );
}

function StaffAdmin({ onNote, calm = false }) {
  const [users, setUsers] = useState([]);
  const [roles, setRoles] = useState([]);
  const [form, setForm] = useState({ fullName: "", email: "", role: "housekeeping" });
  const [issued, setIssued] = useState(null);
  const [busy, setBusy] = useState(false);
  const [listState, setListState] = useState("loading");
  const [fault, setFault] = useState("");
  function load() {
    setListState("loading");
    Promise.all([api("/users"), api("/roles")])
      .then(([people, matrix]) => {
        setUsers(people.users);
        setRoles(matrix.roles);
        setListState("ready");
      })
      .catch((error) => {
        setFault(error.message);
        setListState("error");
        onNote(error.message);
      });
  }
  useEffect(load, []);

  function copyPassword(value) {
    navigator.clipboard.writeText(value).then(
      () => onNote("Password copied."),
      () => onNote(value),
    );
  }

  async function createStaff(event) {
    event.preventDefault();
    setBusy(true);
    try {
      const data = await api("/users", {
        method: "POST",
        body: { fullName: form.fullName, email: form.email, role: form.role },
      });
      setIssued({
        fullName: data.user.fullName,
        email: data.user.email,
        role: data.user.role,
        temporaryPassword: data.temporaryPassword,
        mode: "created",
      });
      setForm({ fullName: "", email: "", role: form.role });
      onNote("Staff account created — copy the password below.");
      load();
    } catch (error) {
      onNote(error.message);
    } finally {
      setBusy(false);
    }
  }

  async function resetPassword(person) {
    setBusy(true);
    try {
      const data = await api(`/users/${person._id}/reset-password`, { method: "POST", body: {} });
      setIssued({
        fullName: data.user.fullName,
        email: data.user.email,
        role: data.user.role,
        temporaryPassword: data.temporaryPassword,
        mode: "reset",
      });
      onNote("New password generated — copy it below.");
      load();
    } catch (error) {
      onNote(error.message);
    } finally {
      setBusy(false);
    }
  }

  const staffOnly = users.filter((person) => person.role !== "admin");
  const activeCount = staffOnly.filter((person) => person.status === "active").length;

  return (
    <Panel title="Staff accounts" calm={calm}>
      <div className="grid gap-5">
        <header className="rounded-2xl border border-navy/10 bg-[#faf8f4] px-4 py-4 sm:px-5">
          <p className="text-[11px] font-medium tracking-[0.16em] text-gold uppercase">Team access</p>
          <p className="mt-1 max-w-2xl text-sm leading-relaxed text-muted">
            Create housekeeping, desk, manager, or maintenance logins. A password is generated for you to copy and share —
            it is shown once and never stored in plain text. Staff sign in at <span className="font-semibold text-navy">/login</span>.
          </p>
          <p className="mt-2 text-xs text-muted">
            {listState === "ready" ? `${activeCount} active · ${staffOnly.length} staff accounts` : "Loading directory…"}
          </p>
        </header>

        <section aria-label="Add staff" className="rounded-2xl border border-navy/10 bg-white p-4 shadow-[0_10px_24px_rgba(7,27,43,0.04)] sm:p-5">
          <h3 className="font-display text-xl text-navy">Add staff</h3>
          <p className="mt-1 text-sm text-muted">Name, work email, and role — then generate login details.</p>
          <form className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4 lg:items-end" onSubmit={createStaff}>
            <label className="text-sm text-navy">
              Full name
              <input className="bay-field mt-1 w-full px-3" required value={form.fullName} onChange={(event) => setForm({ ...form, fullName: event.target.value })} />
            </label>
            <label className="text-sm text-navy">
              Email
              <input className="bay-field mt-1 w-full px-3" type="email" required value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} />
            </label>
            <label className="text-sm text-navy">
              Role
              <select className="bay-field mt-1 w-full px-3" value={form.role} onChange={(event) => setForm({ ...form, role: event.target.value })}>
                {["housekeeping", "receptionist", "manager", "maintenance"].map((role) => (
                  <option key={role} value={role}>{role}</option>
                ))}
              </select>
            </label>
            <button className="h-11 cursor-pointer rounded-full bg-gold px-4 text-sm font-semibold text-navy disabled:opacity-50" type="submit" disabled={busy}>
              {busy ? "Saving…" : "Create + generate password"}
            </button>
          </form>
        </section>

        {issued ? (
          <section aria-label="Issued password" className="rounded-2xl border border-gold/40 bg-gold/15 px-4 py-4 sm:px-5">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="text-[11px] font-medium tracking-[0.14em] text-gold uppercase">
                  {issued.mode === "reset" ? "New password issued" : "Share these login details"}
                </p>
                <p className="mt-2 font-display text-2xl text-navy">{issued.fullName}</p>
                <p className="mt-1 text-sm capitalize text-muted">{issued.role}</p>
              </div>
              <button type="button" className="cursor-pointer text-sm font-semibold text-navy underline" onClick={() => setIssued(null)}>
                Dismiss
              </button>
            </div>
            <dl className="mt-4 grid gap-2 rounded-xl bg-white/80 p-4 text-sm text-navy sm:grid-cols-2">
              <div>
                <dt className="text-[11px] font-medium tracking-[0.12em] text-muted uppercase">Email</dt>
                <dd className="mt-1 font-mono break-all">{issued.email}</dd>
              </div>
              <div>
                <dt className="text-[11px] font-medium tracking-[0.12em] text-muted uppercase">Password</dt>
                <dd className="mt-1 font-mono text-lg font-semibold">{issued.temporaryPassword}</dd>
              </div>
            </dl>
            <div className="mt-3 flex flex-wrap gap-2">
              <button type="button" className="h-11 cursor-pointer rounded-full bg-navy px-4 text-sm font-semibold text-white" onClick={() => copyPassword(issued.temporaryPassword)}>
                Copy password
              </button>
              <button type="button" className="h-11 cursor-pointer rounded-full border border-navy/15 bg-white px-4 text-sm font-semibold text-navy" onClick={() => copyPassword(`${issued.email}\n${issued.temporaryPassword}`)}>
                Copy email + password
              </button>
            </div>
          </section>
        ) : null}

        <section aria-label="Directory">
          <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
            <h3 className="font-display text-xl text-navy">Directory</h3>
            <p className="text-xs text-muted">Generate password or activate / deactivate</p>
          </div>
          {listState === "loading" ? <Skeleton className="h-32 w-full rounded-2xl" /> : null}
          {listState === "error" ? <ErrorState title="Staff accounts could not load" text={fault} onRetry={load} /> : null}
          {listState === "ready" && !users.length ? (
            <EmptyState title="No staff accounts yet." text="Use Add staff above." />
          ) : null}
          {listState === "ready" && users.length > 0 ? (
            <ul className="grid gap-2">
              {users.map((person, index) => (
                <SoftRow
                  key={person._id}
                  calm={calm}
                  index={index}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-navy/8 bg-[#faf8f4] p-3.5 text-sm"
                >
                  <div className="min-w-0">
                    <p className="font-semibold text-navy">{person.fullName}</p>
                    <p className="mt-0.5 break-all text-muted">{person.email}</p>
                    <p className="mt-2 flex flex-wrap gap-1.5">
                      <span className="rounded-full bg-white px-2.5 py-0.5 text-[11px] font-semibold capitalize text-navy shadow-[0_4px_12px_rgba(7,27,43,0.04)]">
                        {person.role}
                      </span>
                      <span className={`rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${person.status === "active" ? "bg-gold/30 text-navy" : "bg-navy/10 text-muted"}`}>
                        {person.status === "active" ? "Active" : "Inactive"}
                      </span>
                    </p>
                  </div>
                  {person.role !== "admin" ? (
                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        className="h-10 cursor-pointer rounded-full border border-navy/15 bg-white px-3 text-xs font-semibold text-navy disabled:opacity-50"
                        disabled={busy}
                        onClick={() => resetPassword(person)}
                      >
                        New password
                      </button>
                      {person.status === "active" ? (
                        <button
                          type="button"
                          className="h-10 cursor-pointer rounded-full border border-navy/15 bg-white px-3 text-xs font-semibold text-navy"
                          onClick={() => api(`/users/${person._id}`, { method: "PATCH", body: { status: "inactive" } }).then(load)}
                        >
                          Deactivate
                        </button>
                      ) : (
                        <button
                          type="button"
                          className="h-10 cursor-pointer rounded-full bg-navy px-3 text-xs font-semibold text-white"
                          onClick={() => api(`/users/${person._id}`, { method: "PATCH", body: { status: "active" } }).then(load)}
                        >
                          Activate
                        </button>
                      )}
                    </div>
                  ) : (
                    <p className="text-xs text-muted">Admin account</p>
                  )}
                </SoftRow>
              ))}
            </ul>
          ) : null}
        </section>

        {roles.length ? (
          <section aria-label="Role permissions" className="rounded-2xl border border-navy/10 bg-white p-4 sm:p-5">
            <h3 className="font-display text-xl text-navy">Role permissions</h3>
            <p className="mt-1 text-sm text-muted">What each role can do in the portal (reference).</p>
            <ul className="mt-4 grid gap-2 sm:grid-cols-2">
              {roles.map((role) => (
                <li key={role._id} className="rounded-xl bg-[#faf8f4] px-3 py-3 text-sm">
                  <p className="font-semibold capitalize text-navy">{role.name}</p>
                  <p className="mt-1 text-xs leading-relaxed text-muted">{(role.permissions || []).join(", ") || "—"}</p>
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </div>
    </Panel>
  );
}

function SettingsPanel({ onNote, calm = false }) {
  const [tax, setTax] = useState("0.1");
  const [hotelName, setHotelName] = useState("Azure Bay");
  const [currency, setCurrency] = useState("USD");
  const [bookingFrom, setBookingFrom] = useState("");
  const [bookingTo, setBookingTo] = useState("");
  const [policies, setPolicies] = useState([]);
  const [policyDraft, setPolicyDraft] = useState({ title: "", body: "" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setLoading(true);
    api("/settings")
      .then((data) => {
        const map = Object.fromEntries((data.settings || []).map((row) => [row.key, row.value]));
        if (map.taxRate !== undefined) setTax(String(map.taxRate));
        if (map.hotelName !== undefined) setHotelName(String(map.hotelName));
        if (map.currency !== undefined) setCurrency(String(map.currency));
        if (map.bookingOpenFrom !== undefined) setBookingFrom(String(map.bookingOpenFrom));
        if (map.bookingOpenTo !== undefined) setBookingTo(String(map.bookingOpenTo));
        if (Array.isArray(map.stayPolicies)) {
          setPolicies(map.stayPolicies.map((item, index) => ({
            id: String(item.id || `policy-${index + 1}`),
            title: String(item.title || ""),
            body: String(item.body || ""),
          })));
        }
      })
      .catch((error) => onNote(error.message))
      .finally(() => setLoading(false));
  }, [onNote]);

  async function onSubmit(event) {
    event.preventDefault();
    if (saving) return;
    setSaving(true);
    try {
      await Promise.all([
        api("/settings", { method: "PATCH", body: { key: "taxRate", value: Number(tax) } }),
        api("/settings", { method: "PATCH", body: { key: "hotelName", value: hotelName } }),
        api("/settings", { method: "PATCH", body: { key: "currency", value: currency } }),
        api("/settings", { method: "PATCH", body: { key: "bookingOpenFrom", value: bookingFrom } }),
        api("/settings", { method: "PATCH", body: { key: "bookingOpenTo", value: bookingTo } }),
        api("/settings", { method: "PATCH", body: { key: "stayPolicies", value: policies } }),
      ]);
      onNote("Settings saved. Policies and booking window update on the public site.");
    } catch (error) {
      onNote(error.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Panel title="Hotel settings" calm={calm}>
      {loading ? (
        <Skeleton className="h-24 w-full" />
      ) : (
        <form className="grid max-w-xl gap-3 sm:grid-cols-2" onSubmit={onSubmit} aria-busy={saving}>
          <label className="text-sm">Hotel name
            <input className={inputClass} value={hotelName} onChange={(event) => setHotelName(event.target.value)} disabled={saving} />
          </label>
          <label className="text-sm">Currency
            <input className={inputClass} value={currency} onChange={(event) => setCurrency(event.target.value)} disabled={saving} />
          </label>
          <label className="text-sm sm:col-span-2">Tax rate
            <input className={inputClass} value={tax} onChange={(event) => setTax(event.target.value)} disabled={saving} />
          </label>
          <label className="text-sm">Bookings open from
            <input type="date" className={inputClass} value={bookingFrom} onChange={(event) => setBookingFrom(event.target.value)} disabled={saving} required />
          </label>
          <label className="text-sm">Bookings open to
            <input type="date" className={inputClass} value={bookingTo} onChange={(event) => setBookingTo(event.target.value)} disabled={saving} required />
          </label>
          <p className="text-sm text-muted sm:col-span-2">Past dates are always blocked. Guests may only select nights inside this window. Room rates stay under Inventory; site photos under Media.</p>

          <div className="sm:col-span-2 border-t border-navy/10 pt-4">
            <h3 className="font-display text-xl text-navy">Stay policies</h3>
            <p className="mt-1 text-sm text-muted">Hotel-wide rules on every room detail page. Add as many as you need.</p>
            <ul className="mt-3 grid gap-2">
              {policies.map((policy, index) => (
                <li key={policy.id} className={`${cardClass} grid gap-2`}>
                  <label className="text-sm text-navy">Title
                    <input
                      className={inputClass}
                      value={policy.title}
                      disabled={saving}
                      onChange={(event) => {
                        const title = event.target.value;
                        setPolicies((current) => current.map((row, i) => (i === index ? { ...row, title } : row)));
                      }}
                    />
                  </label>
                  <label className="text-sm text-navy">Body
                    <textarea
                      className={inputClass}
                      rows={2}
                      value={policy.body}
                      disabled={saving}
                      onChange={(event) => {
                        const body = event.target.value;
                        setPolicies((current) => current.map((row, i) => (i === index ? { ...row, body } : row)));
                      }}
                    />
                  </label>
                  <button
                    type="button"
                    className="cursor-pointer justify-self-start text-sm font-semibold text-navy underline"
                    disabled={saving}
                    onClick={() => setPolicies((current) => current.filter((_, i) => i !== index))}
                  >
                    Remove
                  </button>
                </li>
              ))}
            </ul>
            <div className={`${cardClass} mt-3 grid gap-2`}>
              <p className="text-sm font-semibold text-navy">Add policy</p>
              <label className="text-sm text-navy">Title
                <input className={inputClass} value={policyDraft.title} disabled={saving} onChange={(event) => setPolicyDraft({ ...policyDraft, title: event.target.value })} placeholder="e.g. Cancellation" />
              </label>
              <label className="text-sm text-navy">Body
                <textarea className={inputClass} rows={2} value={policyDraft.body} disabled={saving} onChange={(event) => setPolicyDraft({ ...policyDraft, body: event.target.value })} placeholder="Guest-facing rule text" />
              </label>
              <button
                type="button"
                className="h-11 cursor-pointer justify-self-start rounded-full border border-navy/15 px-4 text-sm font-semibold text-navy"
                disabled={saving}
                onClick={() => {
                  const title = policyDraft.title.trim();
                  const body = policyDraft.body.trim();
                  if (!title || !body) {
                    onNote("Policy title and body are required.");
                    return;
                  }
                  const id = `policy-${Date.now()}`;
                  setPolicies((current) => [...current, { id, title, body }]);
                  setPolicyDraft({ title: "", body: "" });
                }}
              >
                Add to list
              </button>
            </div>
          </div>

          <button className="cursor-pointer rounded-full bg-gold px-4 py-2 text-sm font-semibold text-navy disabled:cursor-not-allowed disabled:opacity-50 sm:col-span-2 sm:justify-self-start" type="submit" disabled={saving}>
            {saving ? "Saving" : "Save settings"}
          </button>
        </form>
      )}
    </Panel>
  );
}

function MediaPanel({ onNote, calm = false }) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState("gallery");
  const [url, setUrl] = useState("");
  const [label, setLabel] = useState("");
  const [group, setGroup] = useState("");
  const [roomSlug, setRoomSlug] = useState("");
  const [showUrlAdd, setShowUrlAdd] = useState(false);
  const [cloudinary, setCloudinary] = useState(false);
  const [busy, setBusy] = useState(false);

  function load() {
    setLoading(true);
    api("/media?all=1")
      .then((data) => {
        setItems(data.media || []);
        setCloudinary(Boolean(data.cloudinary));
      })
      .catch((error) => onNote(error.message))
      .finally(() => setLoading(false));
  }

  useEffect(() => {
    load();
  }, []);

  function requireLabel() {
    if (!label.trim()) {
      onNote("Enter an image name first, then upload or add the photo.");
      return false;
    }
    return true;
  }

  function resetMeta() {
    setUrl("");
    setLabel("");
    setGroup("");
    setRoomSlug("");
  }

  async function addByUrl(event) {
    event.preventDefault();
    if (busy || !requireLabel()) return;
    if (!url.trim()) {
      onNote("Paste an image URL, or use Upload image instead.");
      return;
    }
    setBusy(true);
    try {
      await api("/media", {
        method: "POST",
        body: {
          category,
          url: url.trim(),
          label: label.trim(),
          alt: label.trim(),
          group: group.trim(),
          roomTypeSlug: roomSlug.trim(),
          key: `${category}-${Date.now()}`,
        },
      });
      resetMeta();
      onNote("Image added to the library. Assign it to a room type under Inventory.");
      load();
    } catch (error) {
      onNote(error.message);
    } finally {
      setBusy(false);
    }
  }

  async function uploadFile(event) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!requireLabel()) {
      event.target.value = "";
      return;
    }
    setBusy(true);
    try {
      const body = new FormData();
      body.append("file", file);
      body.append("category", category);
      body.append("label", label.trim());
      body.append("alt", label.trim());
      body.append("group", group.trim());
      if (roomSlug.trim()) body.append("roomTypeSlug", roomSlug.trim());
      const token = getAccessToken();
      const response = await fetch("/api/v1/media/upload", {
        method: "POST",
        headers: token ? { Authorization: `Bearer ${token}` } : {},
        body,
        credentials: "include",
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.message || "Upload failed.");
      resetMeta();
      onNote(cloudinary ? "Uploaded to Cloudinary. Pick it under Inventory for a room type." : "Stored in the library. Pick it under Inventory for a room type.");
      load();
    } catch (error) {
      onNote(error.message);
    } finally {
      setBusy(false);
      event.target.value = "";
    }
  }

  const filtered = items.filter((item) => item.category === category);

  return (
    <Panel title="Site media" calm={calm}>
      <p className="text-sm leading-relaxed text-muted">
        <strong className="font-semibold text-navy">Library first:</strong> name an image, upload it here, then pick it when adding or editing a room type in Inventory.
        Categories feed the public gallery, dining, experiences, hero, and room library.{" "}
        {cloudinary ? "Cloudinary is connected." : "Cloudinary not set — uploads store in Mongo (keep files small) or use optional URL add."}
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        {["gallery", "rooms", "dining", "experiences", "hero"].map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => setCategory(value)}
            className={`cursor-pointer rounded-full px-3 py-1.5 text-sm font-semibold ${category === value ? "bg-navy text-white" : "border border-navy/15 text-navy"}`}
          >
            {value}
          </button>
        ))}
      </div>
      <form className="mt-4 grid gap-2 sm:grid-cols-2" onSubmit={addByUrl}>
        <label className="text-sm sm:col-span-2 text-navy">Image name
          <input className={inputClass} value={label} onChange={(event) => setLabel(event.target.value)} placeholder="e.g. Deluxe sea view" disabled={busy} required />
        </label>
        <label className="text-sm text-navy">Group (optional)
          <input className={inputClass} value={group} onChange={(event) => setGroup(event.target.value)} placeholder="rooms / water / spa" disabled={busy} />
        </label>
        {category === "rooms" ? (
          <label className="text-sm text-navy">Room type slug (optional sync)
            <input className={inputClass} value={roomSlug} onChange={(event) => setRoomSlug(event.target.value)} placeholder="deluxe-sea-view" disabled={busy} />
          </label>
        ) : (
          <div className="hidden sm:block" aria-hidden />
        )}
        <div className="flex flex-wrap items-center gap-2 sm:col-span-2">
          <label className={`inline-flex cursor-pointer items-center rounded-full bg-gold px-4 py-2 text-sm font-semibold text-navy ${busy ? "opacity-50" : ""}`}>
            Upload image
            <input type="file" accept="image/*" className="sr-only" onChange={uploadFile} disabled={busy} />
          </label>
          <button
            type="button"
            className="cursor-pointer text-xs font-semibold text-navy underline"
            onClick={() => setShowUrlAdd((open) => !open)}
          >
            {showUrlAdd ? "Hide URL add" : "Or add by URL"}
          </button>
        </div>
        {showUrlAdd ? (
          <>
            <label className="text-sm sm:col-span-2 text-navy">Image URL
              <input className={inputClass} value={url} onChange={(event) => setUrl(event.target.value)} placeholder="https://… or /assets/…" disabled={busy} />
            </label>
            <div className="sm:col-span-2">
              <button type="submit" disabled={busy} className="cursor-pointer rounded-full border border-navy/15 px-4 py-2 text-sm font-semibold text-navy disabled:opacity-50">
                Add URL to library
              </button>
            </div>
          </>
        ) : null}
      </form>
      {loading ? (
        <Skeleton className="mt-4 h-32 w-full" />
      ) : filtered.length === 0 ? (
        <p className="mt-4 text-sm text-muted">No media in this category yet. Add a name and upload the first photo.</p>
      ) : (
        <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((item) => (
            <li key={item.id} className="overflow-hidden rounded-2xl border border-navy/8 bg-[#faf8f4]">
              <img src={item.url} alt={item.alt || item.label} className="aspect-[4/3] w-full object-cover" />
              <div className="flex items-start justify-between gap-2 p-3">
                <div className="min-w-0">
                  <p className="truncate text-sm font-semibold text-navy">{item.label || item.key}</p>
                  <p className="truncate text-xs text-muted">{item.group || item.roomTypeSlug || item.storage}</p>
                </div>
                <button
                  type="button"
                  className="shrink-0 cursor-pointer text-xs font-semibold text-navy underline"
                  onClick={() => api(`/media/${item.id}`, { method: "DELETE" }).then(() => { onNote("Media removed."); load(); }).catch((error) => onNote(error.message))}
                >
                  Remove
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}
