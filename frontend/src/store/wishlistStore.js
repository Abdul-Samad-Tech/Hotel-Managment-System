import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { isKnownRoomId } from "../lib/compare";
import { createSafeStorage } from "./search.storage";
import { WISHLIST_STORAGE_KEY } from "./wishlist.constant";

function sanitizeIds(input) {
  if (!Array.isArray(input)) return [];
  const next = [];
  for (const id of input) {
    if (typeof id !== "string" || !isKnownRoomId(id) || next.includes(id)) continue;
    next.push(id);
  }
  return next;
}

export const useWishlistStore = create(
  persist(
    (set, get) => ({
      wishlistIds: [],
      panelOpen: false,
      setPanelOpen(open) {
        set({ panelOpen: open === true });
      },
      has(id) {
        return get().wishlistIds.includes(id);
      },
      add(id) {
        if (!isKnownRoomId(id)) return false;
        const { wishlistIds } = get();
        if (wishlistIds.includes(id)) return false;
        set({ wishlistIds: [...wishlistIds, id] });
        return true;
      },
      remove(id) {
        const { wishlistIds } = get();
        if (!wishlistIds.includes(id)) return false;
        set({ wishlistIds: wishlistIds.filter((item) => item !== id) });
        return true;
      },
      toggle(id) {
        if (!isKnownRoomId(id)) return false;
        const { wishlistIds } = get();
        if (wishlistIds.includes(id)) {
          set({ wishlistIds: wishlistIds.filter((item) => item !== id) });
          return false;
        }
        set({ wishlistIds: [...wishlistIds, id] });
        return true;
      },
    }),
    {
      name: WISHLIST_STORAGE_KEY,
      storage: createJSONStorage(() => createSafeStorage()),
      partialize: (state) => ({ wishlistIds: state.wishlistIds }),
      merge: (persisted, current) => ({
        ...current,
        wishlistIds: sanitizeIds(persisted?.wishlistIds),
      }),
    },
  ),
);

export function useWishlistIds() {
  return useWishlistStore((state) => state.wishlistIds);
}

export function useWishlistHas(id) {
  return useWishlistStore((state) => state.wishlistIds.includes(id));
}
