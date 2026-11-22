import { createContext, useContext, useMemo, useState } from "react";

/** Display rates only. AED follows the peg. PKR is a fixed page rate, not a live desk quote. */
export const currencies = ["USD", "PKR", "AED"];

export const rates = { USD: 1, PKR: 278, AED: 3.67 };
const storageKey = "azure-bay-currency";

export function formatMoney(usd, currency = "USD") {
  const rate = rates[currency] || 1;
  const amount = Math.round(Number(usd) * rate);
  const grouped = amount.toLocaleString("en-US");
  if (currency === "USD") return `$${grouped}`;
  if (currency === "AED") return `AED ${grouped}`;
  return `Rs ${grouped}`;
}

const LocaleContext = createContext(null);

export function LocaleProvider({ children }) {
  const [currency, setCurrency] = useState(() => {
    const saved = window.localStorage.getItem(storageKey);
    return currencies.includes(saved) ? saved : "USD";
  });

  const value = useMemo(
    () => ({
      currency,
      setCurrency(next) {
        if (!currencies.includes(next)) return;
        window.localStorage.setItem(storageKey, next);
        setCurrency(next);
      },
      format(usd) {
        return formatMoney(usd, currency);
      },
    }),
    [currency],
  );

  return <LocaleContext.Provider value={value}>{children}</LocaleContext.Provider>;
}

export function useLocale() {
  return useContext(LocaleContext);
}
