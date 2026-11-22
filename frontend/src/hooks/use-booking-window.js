import { useEffect, useState } from "react";
import { defaultBookingWindow, loadBookingWindow } from "../lib/booking-window";

export function useBookingWindow() {
  const [window, setWindow] = useState(() => defaultBookingWindow());
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let active = true;
    loadBookingWindow().then((next) => {
      if (!active) return;
      setWindow(next);
      setReady(true);
    });
    return () => {
      active = false;
    };
  }, []);

  return { window, ready };
}
