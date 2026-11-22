import { confirmHaptic } from "../../lib/haptics";
import { useWishlistStore } from "../../store/wishlistStore";
import { WISHLIST_COPY } from "../../store/wishlist.constant";
import { notify } from "../ui/BayToaster";

export function toggleWishlistWithUndo(roomId) {
  const store = useWishlistStore.getState();
  const wasSaved = store.has(roomId);
  const nowSaved = store.toggle(roomId);
  confirmHaptic();
  const message = nowSaved ? WISHLIST_COPY.added : WISHLIST_COPY.removed;
  notify(message, {
    action: {
      label: WISHLIST_COPY.undo,
      onClick() {
        if (wasSaved) store.add(roomId);
        else store.remove(roomId);
      },
    },
  });
  return nowSaved;
}
