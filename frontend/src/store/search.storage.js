function memoryStorage() {
  const memory = new Map();
  return {
    getItem(name) {
      return memory.get(name) ?? null;
    },
    setItem(name, value) {
      memory.set(name, value);
    },
    removeItem(name) {
      memory.delete(name);
    },
  };
}

function canUseLocalStorage() {
  if (typeof window === "undefined") return false;
  try {
    const probe = "__azure-bay-storage-probe__";
    window.localStorage.setItem(probe, "1");
    window.localStorage.removeItem(probe);
    return true;
  } catch {
    return false;
  }
}

export function createSafeStorage() {
  if (!canUseLocalStorage()) return memoryStorage();
  return {
    getItem(name) {
      try {
        return window.localStorage.getItem(name);
      } catch {
        return null;
      }
    },
    setItem(name, value) {
      try {
        window.localStorage.setItem(name, value);
      } catch {
        return undefined;
      }
    },
    removeItem(name) {
      try {
        window.localStorage.removeItem(name);
      } catch {
        return undefined;
      }
    },
  };
}
