import { useEffect, useMemo, useState } from "react";
import { api } from "../../lib/api";
import { Skeleton } from "../ui/Skeleton";

/**
 * Admin picker: choose an image already stored in Media (gallery/rooms library).
 * No raw URL typing — upload/name images under the Media tab first.
 */
export function GalleryImagePicker({
  value = "",
  onChange,
  categories = ["gallery", "rooms"],
  label = "Photo from Media library",
  emptyHint = "No library photos yet. Open the Media tab, add an image with a name, then come back.",
}) {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fault, setFault] = useState("");
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    let active = true;
    setLoading(true);
    api("/media?all=1")
      .then((data) => {
        if (!active) return;
        const rows = (data.media || []).filter((item) => item.active !== false && item.url);
        setItems(rows);
        setFault("");
      })
      .catch((error) => {
        if (!active) return;
        setFault(error.message);
        setItems([]);
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const library = useMemo(
    () => items.filter((item) => categories.includes(item.category)),
    [items, categories],
  );

  const visible = useMemo(() => {
    if (filter === "all") return library;
    return library.filter((item) => item.category === filter);
  }, [library, filter]);

  const selected = library.find((item) => item.url === value);

  return (
    <div className="rounded-2xl border border-navy/10 bg-white p-3 sm:col-span-2 lg:col-span-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="text-sm font-semibold text-navy">{label}</p>
          <p className="mt-0.5 text-xs text-muted">
            {selected ? `Selected: ${selected.label || selected.key}` : "Select a photo uploaded under Media."}
          </p>
        </div>
        {value ? (
          <button
            type="button"
            className="cursor-pointer text-xs font-semibold text-navy underline"
            onClick={() => onChange("", null)}
          >
            Clear
          </button>
        ) : null}
      </div>

      {categories.length > 1 ? (
        <div className="mt-2 flex flex-wrap gap-1.5">
          <FilterChip active={filter === "all"} onClick={() => setFilter("all")}>
            All library
          </FilterChip>
          {categories.map((cat) => (
            <FilterChip key={cat} active={filter === cat} onClick={() => setFilter(cat)}>
              {cat}
            </FilterChip>
          ))}
        </div>
      ) : null}

      {loading ? <Skeleton className="mt-3 h-28 w-full" /> : null}
      {fault ? <p className="mt-3 text-sm text-muted">{fault}</p> : null}
      {!loading && !fault && visible.length === 0 ? (
        <p className="mt-3 text-sm text-muted">{emptyHint}</p>
      ) : null}

      {!loading && visible.length > 0 ? (
        <ul className="mt-3 grid max-h-64 grid-cols-2 gap-2 overflow-y-auto sm:grid-cols-3 md:grid-cols-4">
          {visible.map((item) => {
            const active = item.url === value;
            return (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => onChange(item.url, item)}
                  className={`w-full cursor-pointer overflow-hidden rounded-xl border text-left transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold ${
                    active ? "border-gold bg-gold/20 ring-2 ring-gold/50" : "border-navy/10 hover:border-gold/60"
                  }`}
                >
                  <img src={item.url} alt="" className="aspect-[4/3] w-full object-cover" />
                  <span className="block truncate px-2 py-1.5 text-[11px] font-medium text-navy">
                    {item.label || item.key}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      ) : null}

      {selected ? (
        <div className="mt-3 flex items-center gap-3 rounded-xl bg-[#faf8f4] p-2">
          <img src={selected.url} alt="" className="h-14 w-20 rounded-lg object-cover" />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-navy">{selected.label || "Selected photo"}</p>
            <p className="truncate text-xs text-muted">{selected.category}</p>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function FilterChip({ active, onClick, children }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`cursor-pointer rounded-full px-2.5 py-1 text-[11px] font-semibold ${
        active ? "bg-navy text-white" : "border border-navy/15 text-navy"
      }`}
    >
      {children}
    </button>
  );
}
