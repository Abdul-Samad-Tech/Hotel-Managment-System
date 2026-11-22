import { Heart, X } from "lucide-react";
import { Link } from "react-router-dom";
import { roomById } from "../../lib/compare";
import { useWishlistIds, useWishlistStore } from "../../store/wishlistStore";
import { WISHLIST_COPY } from "../../store/wishlist.constant";
import { toggleWishlistWithUndo } from "./wishlist-actions";
import { Sheet } from "../ui/Sheet";
import { SmartImage } from "../ui/SmartImage";
import { WishlistEmptyState } from "../ui/SmartEmpty";

export function WishlistSheet({ open, onOpenChange }) {
  const ids = useWishlistIds();
  const rooms = ids.map((id) => roomById(id)).filter(Boolean);

  return (
    <Sheet open={open} onOpenChange={onOpenChange} title={WISHLIST_COPY.panelTitle}>
      {rooms.length === 0 ? (
        <WishlistEmptyState onBrowse={() => onOpenChange(false)} />
      ) : (
        <ul className="grid gap-3">
          {rooms.map((room) => (
            <li key={room.id} className="flex gap-3 rounded-2xl bg-cream p-2">
              <SmartImage
                src={room.image}
                alt=""
                width={96}
                height={72}
                className="h-[4.5rem] w-24 shrink-0 rounded-xl"
              />
              <div className="min-w-0 flex-1">
                <p className="truncate font-display text-lg text-navy">{room.name}</p>
                <div className="mt-2 flex flex-wrap gap-2">
                  <Link
                    to={`/rooms/${room.id}`}
                    onClick={() => onOpenChange(false)}
                    className="inline-flex h-11 items-center rounded-full bg-gold px-4 text-sm font-semibold text-navy focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
                  >
                    {WISHLIST_COPY.viewRoom}
                  </Link>
                  <button
                    type="button"
                    aria-label={`Remove ${room.name}`}
                    onClick={() => toggleWishlistWithUndo(room.id)}
                    className="inline-flex h-11 w-11 cursor-pointer items-center justify-center rounded-full text-navy focus-visible:outline-2 focus-visible:outline-gold"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Sheet>
  );
}

export function WishlistTrigger({ className = "" }) {
  const ids = useWishlistIds();
  const open = useWishlistStore((state) => state.panelOpen);
  const setPanelOpen = useWishlistStore((state) => state.setPanelOpen);

  return (
    <>
      <button
        type="button"
        aria-label={WISHLIST_COPY.panelTitle}
        onClick={() => setPanelOpen(true)}
        className={className}
      >
        <Heart className={`h-4 w-4 ${ids.length ? "fill-gold text-gold" : ""}`} aria-hidden="true" />
        {ids.length ? <span className="sr-only">{ids.length} saved</span> : null}
      </button>
      <WishlistSheet open={open} onOpenChange={setPanelOpen} />
    </>
  );
}
