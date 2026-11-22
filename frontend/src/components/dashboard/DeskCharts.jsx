import { Area, AreaChart, Bar, BarChart, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

const navy = "#0B1F33";
const gold = "#F2C078";
const cream = "#FAF8F4";
const muted = "#5e6d78";
const sand = "#E8D5B5";

const statusFill = {
  available: muted,
  occupied: navy,
  reserved: gold,
  cleaning: sand,
  maintenance: "#8A9AA6",
};

const tipStyle = {
  background: cream,
  border: "1px solid rgba(11, 31, 51, 0.12)",
  borderRadius: 12,
  color: navy,
  fontSize: 12,
};

export function arrivalSeries(reservations) {
  const now = new Date();
  const today = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  const days = [];
  for (let offset = 13; offset >= 0; offset -= 1) {
    const day = new Date(today);
    day.setUTCDate(today.getUTCDate() - offset);
    const key = day.toISOString().slice(0, 10);
    days.push({
      day: key,
      label: new Intl.DateTimeFormat("en", { month: "short", day: "numeric", timeZone: "UTC" }).format(day),
      arrivals: reservations.filter((row) => row.checkIn === key && row.status !== "cancelled" && row.status !== "no_show").length,
    });
  }
  return days;
}

export function arrivalTrend(series) {
  const recent = series.slice(-7).reduce((sum, day) => sum + day.arrivals, 0);
  const previous = series.slice(0, 7).reduce((sum, day) => sum + day.arrivals, 0);
  if (recent === previous) return { recent, text: "Same as the previous 7 days" };
  const delta = recent - previous;
  const word = Math.abs(delta) === 1 ? "arrival" : "arrivals";
  return {
    recent,
    text: delta > 0 ? `Up ${delta} ${word} vs the previous 7 days` : `Down ${Math.abs(delta)} ${word} vs the previous 7 days`,
  };
}

function Sparkline({ points, label }) {
  const max = Math.max(...points, 1);
  const width = 96;
  const height = 28;
  const step = points.length > 1 ? width / (points.length - 1) : 0;
  const path = points
    .map((point, index) => {
      const x = index * step;
      const y = height - 2 - (point / max) * (height - 4);
      return `${index === 0 ? "M" : "L"} ${x.toFixed(1)} ${y.toFixed(1)}`;
    })
    .join(" ");

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="mt-3 h-7 w-24" role="img" aria-label={label}>
      <path d={path} fill="none" stroke={gold} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function DeskVisuals({ occupancy, revenue, feedback, reservations, performance }) {
  const series = reservations ? arrivalSeries(reservations) : null;
  return (
    <>
      <StatCards occupancy={occupancy} revenue={revenue} feedback={feedback} series={series} performance={performance} />
      <DeskCharts occupancy={occupancy} revenue={revenue} series={series} />
    </>
  );
}

export function StatCards({ occupancy, revenue, feedback, series, performance }) {
  const held = occupancy.occupied + occupancy.reserved;
  const trend = series ? arrivalTrend(series) : null;
  const money = [revenue.billed, revenue.collected, revenue.outstanding];
  const mix = [occupancy.available, occupancy.occupied, occupancy.reserved, occupancy.cleaning, occupancy.maintenance];
  const cards = [
    {
      label: "Occupancy",
      value: `${occupancy.occupancyRate}%`,
      trend: `${held} held of ${occupancy.rooms} rooms`,
      spark: <Sparkline points={mix} label="Today's room mix: open, occupied, reserved, cleaning, maintenance" />,
    },
    {
      label: "Collected",
      value: `$${revenue.collected}`,
      trend: revenue.outstanding ? `$${revenue.outstanding} still due` : "Nothing outstanding",
      spark: <Sparkline points={money} label="Billed, collected, and still due" />,
    },
    {
      label: "Arrivals",
      value: trend ? String(trend.recent) : "—",
      trend: trend ? trend.text : "Check-in dates did not load",
      spark: series ? <Sparkline points={series.map((day) => day.arrivals)} label="Arrivals by check-in date over 14 days" /> : null,
    },
    {
      label: "Guest notes",
      value: feedback.count ? feedback.average : "—",
      trend: feedback.count ? `${feedback.average} out of 5 · ${feedback.count} notes` : "No notes on file",
      spark: null,
    },
  ];

  if (performance) {
    cards.push(
      {
        label: "ADR",
        value: `$${performance.adr}`,
        trend: `${performance.from} → ${performance.to} · room revenue / sold nights`,
        spark: null,
      },
      {
        label: "RevPAR",
        value: `$${performance.revpar}`,
        trend: `${performance.occupancyRate}% period occupancy · $${performance.roomRevenue} room revenue`,
        spark: null,
      },
      {
        label: "Demand",
        value: performance.demand?.label || "—",
        trend: performance.demand
          ? `Next ${performance.demand.windowDays} days · ${Math.round((performance.demand.ratio || 0) * 100)}% of capacity booked`
          : "Demand window unavailable",
        spark: null,
      },
    );
  }

  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((card) => (
        <article key={card.label} className="rounded-2xl bg-navy px-4 py-5 text-white">
          <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-gold">{card.label}</p>
          <p className="mt-2 font-display text-4xl">{card.value}</p>
          <p className="mt-2 text-xs text-white/70">{card.trend}</p>
          {card.spark}
        </article>
      ))}
    </div>
  );
}

export function DeskCharts({ occupancy, revenue, series }) {
  const slices = [
    { name: "Open", value: occupancy.available, fill: statusFill.available },
    { name: "Occupied", value: occupancy.occupied, fill: statusFill.occupied },
    { name: "Reserved", value: occupancy.reserved, fill: statusFill.reserved },
    { name: "Cleaning", value: occupancy.cleaning, fill: statusFill.cleaning },
    { name: "Maintenance", value: occupancy.maintenance, fill: statusFill.maintenance },
  ].filter((slice) => slice.value > 0);

  const money = [
    { name: "Billed", amount: revenue.billed, fill: navy },
    { name: "Collected", amount: revenue.collected, fill: gold },
    { name: "Due", amount: revenue.outstanding, fill: muted },
  ];

  return (
    <div className="mt-4 grid gap-3 lg:grid-cols-3">
      <figure className="rounded-2xl border border-navy/8 bg-cream p-4 lg:col-span-1">
        <figcaption className="text-sm font-medium text-navy">Arrivals by check-in date</figcaption>
        <p className="mt-1 text-xs text-muted">Fourteen days from the reservation list. Cancelled and no-show stays are left out.</p>
        <div className="mt-3 h-52">
          {series ? (
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={series} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <XAxis dataKey="label" tick={{ fill: muted, fontSize: 11 }} interval={2} axisLine={false} tickLine={false} />
                <YAxis allowDecimals={false} width={24} tick={{ fill: muted, fontSize: 11 }} axisLine={false} tickLine={false} />
                <Tooltip contentStyle={tipStyle} />
                <Area type="monotone" dataKey="arrivals" stroke={navy} fill={gold} fillOpacity={0.45} strokeWidth={1.6} />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-muted">Arrivals could not load.</p>
          )}
        </div>
      </figure>
      <figure className="rounded-2xl border border-navy/8 bg-cream p-4">
        <figcaption className="text-sm font-medium text-navy">Invoices</figcaption>
        <p className="mt-1 text-xs text-muted">Billed, collected, and still due, in dollars.</p>
        <div className="mt-3 h-52">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={money} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
              <XAxis dataKey="name" tick={{ fill: muted, fontSize: 11 }} axisLine={false} tickLine={false} />
              <YAxis width={36} tick={{ fill: muted, fontSize: 11 }} axisLine={false} tickLine={false} />
              <Tooltip contentStyle={tipStyle} />
              <Bar dataKey="amount" radius={[6, 6, 0, 0]}>
                {money.map((row) => (
                  <Cell key={row.name} fill={row.fill} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </figure>
      <figure className="rounded-2xl border border-navy/8 bg-cream p-4">
        <figcaption className="text-sm font-medium text-navy">Rooms today</figcaption>
        <p className="mt-1 text-xs text-muted">Active rooms by status.</p>
        <div className="mt-3 h-52">
          {slices.length ? (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={slices} dataKey="value" nameKey="name" innerRadius={52} outerRadius={74} paddingAngle={2} stroke={cream}>
                  {slices.map((slice) => (
                    <Cell key={slice.name} fill={slice.fill} />
                  ))}
                </Pie>
                <Tooltip contentStyle={tipStyle} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-sm text-muted">No active rooms.</p>
          )}
        </div>
        <ul className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted">
          {slices.map((slice) => (
            <li key={slice.name} className="inline-flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full" style={{ background: slice.fill }} />
              {slice.name} {slice.value}
            </li>
          ))}
        </ul>
      </figure>
    </div>
  );
}
