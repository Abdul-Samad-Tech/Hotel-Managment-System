import { useEffect, useMemo, useState } from "react";
import { EmptyState } from "../ui/EmptyState";
import { ErrorState } from "../ui/ErrorState";
import { Skeleton } from "../ui/Skeleton";
import { api } from "../../lib/api";

const tabs = [
  { id: "menu", label: "Menu" },
  { id: "kitchen", label: "Kitchen" },
  { id: "tables", label: "Tables" },
  { id: "reports", label: "Reports" },
];

const kitchenColumns = [
  { id: "placed", label: "Placed" },
  { id: "accepted", label: "Accepted" },
  { id: "preparing", label: "Preparing" },
  { id: "ready", label: "Ready" },
  { id: "delivered", label: "Delivered" },
];

const nextKitchen = {
  placed: "accepted",
  accepted: "preparing",
  preparing: "ready",
  ready: "delivered",
};

/**
 * Portal Dining: menu CRUD, kitchen board, tables, reports.
 */
export function DiningBoard({ onNote, pulse = 0, canManageMenu = false, canSeeReports = false }) {
  const [tab, setTab] = useState("kitchen");
  // Least privilege: receptionist = Kitchen + Tables; managers also get Menu + Reports.
  const visibleTabs = tabs.filter((item) => {
    if (item.id === "menu") return canManageMenu;
    if (item.id === "reports") return canSeeReports;
    return true;
  });
  const activeTab = visibleTabs.some((item) => item.id === tab) ? tab : "kitchen";

  return (
    <div className="grid gap-4">
      <header className="rounded-2xl border border-navy/10 bg-[#faf8f4] px-4 py-4">
        <p className="text-[11px] font-medium tracking-[0.16em] text-gold uppercase">F&amp;B</p>
        <p className="mt-1 font-display text-2xl text-navy">Dining operations</p>
        <p className="mt-1 max-w-2xl text-sm text-muted">
          Guests order only while checked in. Charges post to the stay invoice.
          {canManageMenu
            ? " Managers edit the menu and view reports; the desk runs kitchen and seating."
            : " Desk runs kitchen orders and table seating. Menu and reports need a manager."}
        </p>
        <div className="mt-4 flex flex-wrap gap-1.5" role="tablist">
          {visibleTabs.map((item) => (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={activeTab === item.id}
              onClick={() => setTab(item.id)}
              className={`cursor-pointer rounded-full px-3.5 py-2 text-sm font-semibold ${
                activeTab === item.id ? "bg-navy text-white" : "border border-navy/15 bg-white text-navy"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </header>

      {activeTab === "menu" && canManageMenu ? <MenuPanel onNote={onNote} canManage={canManageMenu} /> : null}
      {activeTab === "kitchen" ? <KitchenPanel onNote={onNote} pulse={pulse} /> : null}
      {activeTab === "tables" ? <TablesPanel onNote={onNote} pulse={pulse} canManage={canManageMenu} /> : null}
      {activeTab === "reports" && canSeeReports ? <ReportsPanel onNote={onNote} /> : null}
    </div>
  );
}

function MenuPanel({ onNote, canManage }) {
  const [categories, setCategories] = useState([]);
  const [state, setState] = useState("loading");
  const [fault, setFault] = useState("");
  const [form, setForm] = useState({ categoryId: "", name: "", description: "", price: "" });

  function load() {
    setState("loading");
    api("/dining/menu/admin")
      .then((data) => {
        setCategories(data.categories || []);
        setState("ready");
        if (!form.categoryId && data.categories?.[0]) {
          setForm((current) => ({ ...current, categoryId: data.categories[0].id }));
        }
      })
      .catch((error) => {
        setFault(error.message);
        setState("error");
      });
  }

  useEffect(load, []);

  async function addItem(event) {
    event.preventDefault();
    if (!canManage) return;
    try {
      await api("/dining/items", {
        method: "POST",
        body: {
          categoryId: form.categoryId,
          name: form.name,
          description: form.description,
          price: Number(form.price),
        },
      });
      setForm((current) => ({ ...current, name: "", description: "", price: "" }));
      onNote?.("Menu item added.");
      load();
    } catch (error) {
      onNote?.(error.message);
    }
  }

  if (state === "loading") return <Skeleton className="h-48 w-full rounded-2xl" />;
  if (state === "error") return <ErrorState title="Menu could not load" text={fault} onRetry={load} />;

  return (
    <div className="grid gap-4">
      {canManage ? (
        <form onSubmit={addItem} className="grid gap-2 rounded-2xl border border-navy/10 bg-white p-4 sm:grid-cols-2 lg:grid-cols-5">
          <label className="text-sm text-navy">
            Category
            <select className="bay-field mt-1 w-full px-3" value={form.categoryId} onChange={(event) => setForm({ ...form, categoryId: event.target.value })}>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>{category.title}</option>
              ))}
            </select>
          </label>
          <label className="text-sm text-navy">
            Name
            <input className="bay-field mt-1 w-full px-3" required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} />
          </label>
          <label className="text-sm text-navy lg:col-span-2">
            Description
            <input className="bay-field mt-1 w-full px-3" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} />
          </label>
          <label className="text-sm text-navy">
            Price USD
            <input className="bay-field mt-1 w-full px-3" required type="number" min="0" step="0.01" value={form.price} onChange={(event) => setForm({ ...form, price: event.target.value })} />
          </label>
          <button type="submit" className="h-11 cursor-pointer rounded-full bg-gold px-4 text-sm font-semibold text-navy sm:col-span-2 lg:col-span-5 lg:justify-self-start">
            Add item
          </button>
        </form>
      ) : (
        <p className="text-sm text-muted">Menu edits need manager or admin.</p>
      )}

      {categories.map((category) => (
        <section key={category.id} className="rounded-2xl border border-navy/10 bg-white p-4">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <h3 className="font-display text-xl text-navy">{category.title}</h3>
            {canManage ? (
              <button
                type="button"
                className="cursor-pointer text-sm font-semibold text-navy underline"
                onClick={() =>
                  api(`/dining/categories/${category.id}`, { method: "PATCH", body: { active: !category.active } })
                    .then(load)
                    .catch((error) => onNote?.(error.message))
                }
              >
                {category.active ? "Deactivate" : "Activate"}
              </button>
            ) : null}
          </div>
          <ul className="divide-y divide-navy/10">
            {(category.items || []).map((item) => (
              <li key={item.id} className="flex flex-wrap items-center justify-between gap-2 py-2 text-sm">
                <span>
                  <span className="font-semibold text-navy">{item.name}</span>
                  <span className="text-muted"> · ${item.price}{item.available ? "" : " · unavailable"}</span>
                </span>
                {canManage ? (
                  <button
                    type="button"
                    className="cursor-pointer rounded-full border border-navy/15 px-3 py-1 text-xs font-semibold"
                    onClick={() =>
                      api(`/dining/items/${item.id}`, { method: "PATCH", body: { available: !item.available } })
                        .then(load)
                        .catch((error) => onNote?.(error.message))
                    }
                  >
                    {item.available ? "Mark unavailable" : "Mark available"}
                  </button>
                ) : null}
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}

function KitchenPanel({ onNote, pulse }) {
  const [orders, setOrders] = useState([]);
  const [state, setState] = useState("loading");
  const [fault, setFault] = useState("");

  function load(quiet = false) {
    if (!quiet) setState("loading");
    api("/dining/orders")
      .then((data) => {
        setOrders((data.orders || []).filter((order) => order.status !== "cancelled"));
        setState("ready");
      })
      .catch((error) => {
        setFault(error.message);
        setState("error");
      });
  }

  useEffect(() => {
    load(Boolean(orders.length));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pulse]);

  const grouped = useMemo(() => {
    const map = Object.fromEntries(kitchenColumns.map((column) => [column.id, []]));
    for (const order of orders) {
      if (map[order.status]) map[order.status].push(order);
    }
    return map;
  }, [orders]);

  if (state === "loading" && !orders.length) return <Skeleton className="h-64 w-full rounded-2xl" />;
  if (state === "error") return <ErrorState title="Kitchen board failed" text={fault} onRetry={() => load()} />;

  return (
    <div className="grid gap-3 lg:grid-cols-5">
      {kitchenColumns.map((column) => (
        <section key={column.id} className="rounded-2xl border border-navy/10 bg-[#faf8f4] p-3">
          <p className="text-[11px] font-medium tracking-[0.14em] text-muted uppercase">
            {column.label} · {grouped[column.id].length}
          </p>
          <ul className="mt-2 grid gap-2">
            {grouped[column.id].map((order) => (
              <li key={order.id} className="rounded-xl bg-white p-3 text-sm shadow-[0_8px_20px_rgba(7,27,43,0.05)]">
                <p className="font-semibold text-navy">{order.orderNumber}</p>
                <p className="text-xs text-muted">Room {order.roomNumber || "—"} · {order.guestName || "Guest"}</p>
                <p className="mt-1 text-xs text-navy/80">
                  {order.lines.map((line) => `${line.quantity}× ${line.name}`).join(", ")}
                </p>
                <p className="mt-1 font-semibold text-navy">${order.subtotal}</p>
                <div className="mt-2 flex flex-wrap gap-1">
                  {nextKitchen[order.status] ? (
                    <button
                      type="button"
                      className="cursor-pointer rounded-full bg-navy px-3 py-1 text-xs font-semibold text-white"
                      onClick={() =>
                        api(`/dining/orders/${order.id}`, { method: "PATCH", body: { status: nextKitchen[order.status] } })
                          .then(() => { onNote?.(`Order → ${nextKitchen[order.status]}`); load(true); })
                          .catch((error) => onNote?.(error.message))
                      }
                    >
                      Advance
                    </button>
                  ) : null}
                  {!["delivered", "cancelled"].includes(order.status) ? (
                    <button
                      type="button"
                      className="cursor-pointer rounded-full border border-navy/15 px-3 py-1 text-xs font-semibold"
                      onClick={() =>
                        api(`/dining/orders/${order.id}`, { method: "PATCH", body: { status: "cancelled" } })
                          .then(() => { onNote?.("Order cancelled."); load(true); })
                          .catch((error) => onNote?.(error.message))
                      }
                    >
                      Cancel
                    </button>
                  ) : null}
                </div>
              </li>
            ))}
            {!grouped[column.id].length ? <li className="text-xs text-muted">Empty</li> : null}
          </ul>
        </section>
      ))}
    </div>
  );
}

function TablesPanel({ onNote, pulse, canManage }) {
  const [tables, setTables] = useState([]);
  const [bookings, setBookings] = useState([]);
  const [state, setState] = useState("loading");
  const [fault, setFault] = useState("");
  const [label, setLabel] = useState("");

  function load(quiet = false) {
    if (!quiet) setState("loading");
    Promise.all([api("/dining/tables"), api("/dining/table-bookings")])
      .then(([tableData, bookingData]) => {
        setTables(tableData.tables || []);
        setBookings(bookingData.bookings || []);
        setState("ready");
      })
      .catch((error) => {
        setFault(error.message);
        setState("error");
      });
  }

  useEffect(() => {
    load(Boolean(tables.length));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pulse]);

  if (state === "loading" && !tables.length) return <Skeleton className="h-48 w-full rounded-2xl" />;
  if (state === "error") return <ErrorState title="Tables failed" text={fault} onRetry={() => load()} />;

  const openBookings = bookings.filter((row) => ["requested", "seated"].includes(row.status));

  return (
    <div className="grid gap-5">
      {canManage ? (
        <form
          className="flex flex-wrap gap-2"
          onSubmit={(event) => {
            event.preventDefault();
            api("/dining/tables", { method: "POST", body: { label, capacity: 4 } })
              .then(() => { setLabel(""); onNote?.("Table added."); load(true); })
              .catch((error) => onNote?.(error.message));
          }}
        >
          <input className="bay-field px-3" placeholder="Label e.g. T9" value={label} onChange={(event) => setLabel(event.target.value)} required />
          <button type="submit" className="h-11 cursor-pointer rounded-full bg-gold px-4 text-sm font-semibold text-navy">Add table</button>
        </form>
      ) : null}

      <ul className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
        {tables.map((table) => (
          <li key={table.id} className="rounded-2xl border border-navy/10 bg-white p-3 text-sm">
            <p className="font-semibold text-navy">{table.label} · {table.zone}</p>
            <p className="text-muted">Seats {table.capacity} · {table.status}</p>
            <select
              className="bay-field mt-2 w-full px-2 text-sm"
              value={table.status}
              onChange={(event) =>
                api(`/dining/tables/${table.id}`, { method: "PATCH", body: { status: event.target.value } })
                  .then(() => load(true))
                  .catch((error) => onNote?.(error.message))
              }
            >
              {["free", "seated", "reserved", "blocked"].map((status) => (
                <option key={status} value={status}>{status}</option>
              ))}
            </select>
          </li>
        ))}
      </ul>

      <section>
        <h3 className="mb-2 font-display text-xl text-navy">Table requests</h3>
        {!openBookings.length ? <EmptyState title="No open table requests." /> : null}
        <ul className="grid gap-2">
          {openBookings.map((booking) => (
            <li key={booking.id} className="rounded-2xl border border-navy/10 bg-white p-3 text-sm">
              <p className="font-semibold text-navy">
                {booking.guestName || "Guest"} · Room {booking.roomNumber || "—"} · {booking.partySize} guests
              </p>
              <p className="text-muted">
                {booking.slot} · {new Date(booking.date).toLocaleDateString()} · {booking.status}
                {booking.tableLabel ? ` · ${booking.tableLabel}` : ""}
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                <select
                  className="bay-field px-2 text-sm"
                  defaultValue={booking.tableId || ""}
                  onChange={(event) => {
                    if (!event.target.value) return;
                    api(`/dining/table-bookings/${booking.id}`, {
                      method: "PATCH",
                      body: { tableId: event.target.value, status: "seated" },
                    })
                      .then(() => { onNote?.("Seated."); load(true); })
                      .catch((error) => onNote?.(error.message));
                  }}
                >
                  <option value="">Assign table</option>
                  {tables.filter((table) => table.active).map((table) => (
                    <option key={table.id} value={table.id}>{table.label} ({table.status})</option>
                  ))}
                </select>
                <button
                  type="button"
                  className="cursor-pointer rounded-full border border-navy/15 px-3 py-1 text-xs font-semibold"
                  onClick={() =>
                    api(`/dining/table-bookings/${booking.id}`, { method: "PATCH", body: { status: "completed" } })
                      .then(() => load(true))
                      .catch((error) => onNote?.(error.message))
                  }
                >
                  Complete
                </button>
                <button
                  type="button"
                  className="cursor-pointer rounded-full border border-navy/15 px-3 py-1 text-xs font-semibold"
                  onClick={() =>
                    api(`/dining/table-bookings/${booking.id}`, { method: "PATCH", body: { status: "no_show" } })
                      .then(() => load(true))
                      .catch((error) => onNote?.(error.message))
                  }
                >
                  No-show
                </button>
              </div>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}

function ReportsPanel({ onNote }) {
  const [summary, setSummary] = useState(null);
  const [state, setState] = useState("loading");
  const [fault, setFault] = useState("");

  function load() {
    setState("loading");
    api("/dining/reports/summary")
      .then((data) => {
        setSummary(data);
        setState("ready");
      })
      .catch((error) => {
        setFault(error.message);
        setState("error");
      });
  }

  useEffect(load, []);

  if (state === "loading") return <Skeleton className="h-40 w-full rounded-2xl" />;
  if (state === "error") return <ErrorState title="Reports failed" text={fault} onRetry={load} />;
  if (!summary) return null;

  return (
    <div className="grid gap-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <Stat label="Orders" value={summary.orderCount} />
        <Stat label="Revenue" value={`$${summary.revenue}`} />
        <Stat label="Table bookings" value={summary.tableBookings} />
      </div>
      <div className="rounded-2xl border border-navy/10 bg-white p-4">
        <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
          <h3 className="font-display text-xl text-navy">Popular items</h3>
          <button
            type="button"
            className="cursor-pointer rounded-full border border-navy/15 px-3 py-1 text-sm font-semibold"
            onClick={() => {
              const rows = [
                ["name", "quantity", "revenue"],
                ...(summary.popular || []).map((row) => [row.name, row.quantity, row.revenue]),
              ];
              const csv = rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")).join("\n");
              const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
              const url = URL.createObjectURL(blob);
              const link = document.createElement("a");
              link.href = url;
              link.download = "dining-popular.csv";
              link.click();
              URL.revokeObjectURL(url);
              onNote?.("CSV downloaded.");
            }}
          >
            Export CSV
          </button>
        </div>
        <ul className="grid gap-1 text-sm">
          {(summary.popular || []).map((row) => (
            <li key={row.name} className="flex justify-between gap-2">
              <span>{row.name}</span>
              <span className="text-muted">{row.quantity} · ${row.revenue}</span>
            </li>
          ))}
          {!summary.popular?.length ? <li className="text-muted">No orders in range yet.</li> : null}
        </ul>
      </div>
    </div>
  );
}

function Stat({ label, value }) {
  return (
    <div className="rounded-2xl border border-navy/10 bg-white p-4">
      <p className="text-[11px] font-medium tracking-[0.14em] text-muted uppercase">{label}</p>
      <p className="mt-1 font-display text-3xl text-navy">{value}</p>
    </div>
  );
}
