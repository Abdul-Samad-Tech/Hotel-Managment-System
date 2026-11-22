import { useEffect, useRef, useState } from "react";
import { notify } from "../ui/BayToaster";
import { EmptyState } from "../ui/EmptyState";
import { ErrorState } from "../ui/ErrorState";
import { Skeleton, TableRowSkeleton } from "../ui/Skeleton";
import { SmartImage } from "../ui/SmartImage";

export function RoomTable({ rooms, loading, fault, onOffline, onEdit, onRestore }) {
  const [selectedId, setSelectedId] = useState("");
  const [previews, setPreviews] = useState({});
  const selected = rooms.find((room) => room.id === selectedId) || null;
  const preview = selectedId ? previews[selectedId] : "";
  const previewsRef = useRef(previews);
  previewsRef.current = previews;

  useEffect(() => {
    return () => {
      Object.values(previewsRef.current).forEach((url) => URL.revokeObjectURL(url));
    };
  }, []);

  function takeFile(file) {
    if (!selectedId || !file || !file.type.startsWith("image/")) return;
    const url = URL.createObjectURL(file);
    if (previews[selectedId]) URL.revokeObjectURL(previews[selectedId]);
    setPreviews((current) => ({ ...current, [selectedId]: url }));
    notify("Preview only. This photo is not saved on the room.");
  }

  if (loading) {
    return (
      <div className="mt-4 grid gap-2" aria-busy="true" aria-label="Loading rooms">
        <TableRowSkeleton columns={4} />
        <TableRowSkeleton columns={4} />
        <Skeleton className="h-40 w-full" />
      </div>
    );
  }
  if (fault) {
    return (
      <div className="mt-4">
        <ErrorState title="Rooms could not load" text={fault} />
      </div>
    );
  }
  if (!rooms.length) {
    return (
      <div className="mt-4">
        <EmptyState title="No physical rooms yet." text="Above: add a room type, then add a room number + floor linked to that type." />
      </div>
    );
  }

  return (
    <div className="mt-4 grid gap-4 lg:grid-cols-[1fr_16rem]">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[520px] text-left text-sm">
          <thead>
            <tr className="text-xs font-medium uppercase tracking-[0.12em] text-muted">
              <th className="px-2 py-2">Room</th>
              <th className="px-2 py-2">Type</th>
              <th className="px-2 py-2">Floor</th>
              <th className="px-2 py-2">Status</th>
              <th className="px-2 py-2"> </th>
            </tr>
          </thead>
          <tbody>
            {rooms.map((room) => (
              <tr
                key={room.id}
                className={room.id === selectedId ? "bg-gold/25" : "bg-[#faf8f4]"}
                onClick={() => setSelectedId(room.id)}
              >
                <td className="px-2 py-3">
                  <button type="button" className="cursor-pointer font-medium text-navy" onClick={() => setSelectedId(room.id)}>
                    {room.roomNumber}
                  </button>
                </td>
                <td className="px-2 py-3">{room.roomType}</td>
                <td className="px-2 py-3">{room.floor || "—"}</td>
                <td className="px-2 py-3">{room.active === false ? "inactive" : room.status}</td>
                <td className="px-2 py-3 text-right">
                  <span className="inline-flex flex-wrap justify-end gap-2">
                    {onEdit && (
                      <button
                        type="button"
                        className="cursor-pointer text-navy underline"
                        onClick={(event) => {
                          event.stopPropagation();
                          onEdit(room);
                        }}
                      >
                        Edit
                      </button>
                    )}
                    {room.active !== false && room.status !== "out_of_service" && onOffline && (
                      <button
                        type="button"
                        className="cursor-pointer text-navy underline"
                        onClick={(event) => {
                          event.stopPropagation();
                          onOffline(room.id);
                        }}
                      >
                        Take offline
                      </button>
                    )}
                    {(room.active === false || room.status === "out_of_service") && onRestore && (
                      <button
                        type="button"
                        className="cursor-pointer text-navy underline"
                        onClick={(event) => {
                          event.stopPropagation();
                          onRestore(room.id);
                        }}
                      >
                        Restore
                      </button>
                    )}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <PhotoDrop selected={selected} preview={preview} onFile={takeFile} />
    </div>
  );
}

function PhotoDrop({ selected, preview, onFile }) {
  function onDrop(event) {
    event.preventDefault();
    if (!selected) return;
    onFile(event.dataTransfer.files?.[0]);
  }

  return (
    <div>
      <p className="text-sm font-medium text-navy">Room photo</p>
      <p className="mt-1 text-xs text-muted">The preview stays in this browser. Room records do not store a photo.</p>
      <label
        onDragOver={(event) => event.preventDefault()}
        onDrop={onDrop}
        className={`mt-3 flex min-h-44 cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-navy/20 bg-cream px-4 py-6 text-center text-sm text-muted ${selected ? "" : "cursor-not-allowed opacity-60"}`}
      >
        <input
          type="file"
          accept="image/*"
          className="sr-only"
          disabled={!selected}
          onChange={(event) => onFile(event.target.files?.[0])}
        />
        {preview ? (
          <SmartImage src={preview} alt="" width={320} height={240} className="max-h-36 w-auto rounded-xl" />
        ) : (
          <span>{selected ? `Drop a photo for room ${selected.roomNumber}` : "Choose a room first"}</span>
        )}
      </label>
    </div>
  );
}
