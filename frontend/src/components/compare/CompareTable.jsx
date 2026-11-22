import { Check, X } from "lucide-react";
import { Link } from "react-router-dom";
import { useLocale } from "../../context/LocaleContext";
import { roomSizeLabel, roomViewLabel, unionAmenities } from "../../lib/compare";
import { COMPARE_COPY } from "../../store/compare.constant";
import { useCompareStore } from "../../store/compare.store";
import { CompareEmptyState } from "../ui/SmartEmpty";
import { SmartImage } from "../ui/SmartImage";

export function CompareTable({ rooms: picked, onRemove }) {
  const { format } = useLocale();
  const setPanelOpen = useCompareStore((state) => state.setPanelOpen);
  const amenityKeys = unionAmenities(picked);
  const closePanel = () => setPanelOpen(false);

  if (picked.length === 0) {
    return <CompareEmptyState onBrowse={closePanel} />;
  }

  const factRows = [
    { label: "Price / night", cell: (room) => format(room.price) },
    { label: "Guests", cell: (room) => room.guests },
    { label: "Bed", cell: (room) => room.bed },
    { label: "Size", cell: (room) => roomSizeLabel(room) },
    { label: "View", cell: (room) => roomViewLabel(room) },
  ];

  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[36rem] border-collapse text-left text-sm text-navy">
        <thead>
          <tr>
            <th className="w-28 p-2" scope="col" />
            {picked.map((room) => (
              <th key={room.id} className="p-2 align-bottom font-medium" scope="col">
                <SmartImage src={room.image} alt="" width={240} height={160} className="mb-2 h-20 w-full rounded-xl" />
                <span className="font-display text-base">{room.name}</span>
                <button
                  type="button"
                  onClick={() => onRemove(room.id)}
                  className="mt-1 block min-h-11 cursor-pointer text-xs text-muted underline-offset-4 hover:underline focus-visible:outline-2 focus-visible:outline-gold"
                >
                  {COMPARE_COPY.remove}
                </button>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {factRows.map((row) => (
            <tr key={row.label} className="border-t border-navy/10">
              <th className="p-2 font-semibold" scope="row">
                {row.label}
              </th>
              {picked.map((room) => (
                <td key={room.id} className="p-2 align-top text-muted">
                  {row.cell(room)}
                </td>
              ))}
            </tr>
          ))}
          {amenityKeys.map((amenity) => (
            <tr key={amenity} className="border-t border-navy/10">
              <th className="p-2 font-semibold" scope="row">
                {amenity}
              </th>
              {picked.map((room) => {
                const included = room.amenities.includes(amenity);
                return (
                  <td key={room.id} className="p-2 align-middle">
                    <span className="inline-flex items-center gap-1.5 text-muted">
                      {included ? (
                        <Check className="h-4 w-4 text-navy" aria-hidden="true" />
                      ) : (
                        <X className="h-4 w-4 text-navy/35" aria-hidden="true" />
                      )}
                      <span className="sr-only">
                        {included ? COMPARE_COPY.hasAmenity : COMPARE_COPY.noAmenity}
                      </span>
                    </span>
                  </td>
                );
              })}
            </tr>
          ))}
          <tr className="border-t border-navy/10">
            <th className="p-2 font-semibold" scope="row">
              {COMPARE_COPY.book}
            </th>
            {picked.map((room) => (
              <td key={room.id} className="p-2 align-middle">
                <Link
                  to={`/booking/${room.id}`}
                  onClick={closePanel}
                  className="inline-flex h-11 cursor-pointer items-center rounded-full bg-gold px-4 text-sm font-semibold text-navy focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
                >
                  {COMPARE_COPY.book}
                </Link>
              </td>
            ))}
          </tr>
        </tbody>
      </table>
    </div>
  );
}
