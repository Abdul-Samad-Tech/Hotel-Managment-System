import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { useShallow } from "zustand/react/shallow";
import { isKnownRoomId, roomById } from "../lib/compare";
import { COMPARE_MAX, COMPARE_STATUS, COMPARE_STORAGE_KEY } from "./compare.constant";
import { createSafeStorage } from "./search.storage";

function sanitizeIds(input) {
  if (!Array.isArray(input)) return [];
  const next = [];
  for (const id of input) {
    if (typeof id !== "string" || !isKnownRoomId(id) || next.includes(id)) continue;
    next.push(id);
    if (next.length >= COMPARE_MAX) break;
  }
  return next;
}

function readPersistedIds() {
  try {
    if (typeof window === "undefined") return [];
    const raw = window.localStorage.getItem(COMPARE_STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    const slice = parsed?.state && typeof parsed.state === "object" ? parsed.state : parsed;
    return sanitizeIds(slice?.compareIds);
  } catch {
    return [];
  }
}

const initialIds = readPersistedIds();

export const useCompareStore = create(
  persist(
    (set, get) => ({
      compareIds: initialIds,
      draggingId: "",
      panelOpen: false,
      announce: "",
      add(id) {
        if (!isKnownRoomId(id)) {
          return { status: COMPARE_STATUS.missing };
        }
        const { compareIds } = get();
        if (compareIds.includes(id)) return { status: COMPARE_STATUS.exists };
        if (compareIds.length >= COMPARE_MAX) return { status: COMPARE_STATUS.full };
        const name = roomById(id)?.name ?? id;
        set({
          compareIds: [...compareIds, id],
          announce: `${name} added to compare.`,
        });
        return { status: COMPARE_STATUS.added, name };
      },
      remove(id) {
        const { compareIds } = get();
        if (!compareIds.includes(id)) return { status: COMPARE_STATUS.exists };
        const name = roomById(id)?.name ?? id;
        set({
          compareIds: compareIds.filter((item) => item !== id),
          announce: `${name} removed.`,
        });
        return { status: COMPARE_STATUS.removed, name };
      },
      toggle(id) {
        if (get().compareIds.includes(id)) return get().remove(id);
        return get().add(id);
      },
      clear() {
        if (get().compareIds.length === 0) return { status: COMPARE_STATUS.cleared };
        set({ compareIds: [], announce: "Compare cleared." });
        return { status: COMPARE_STATUS.cleared };
      },
      setDragging(id) {
        set({ draggingId: typeof id === "string" ? id : "" });
      },
      setPanelOpen(open) {
        set({ panelOpen: open === true });
      },
    }),
    {
      name: COMPARE_STORAGE_KEY,
      storage: createJSONStorage(() => createSafeStorage()),
      partialize: (state) => ({ compareIds: state.compareIds }),
      merge: (persisted, current) => ({
        ...current,
        compareIds: sanitizeIds(persisted?.compareIds),
      }),
    },
  ),
);

export function useCompareIds() {
  return useCompareStore(useShallow((state) => state.compareIds));
}
