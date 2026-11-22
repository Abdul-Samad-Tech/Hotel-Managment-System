import { useEffect, useState } from "react";
import { getRoomAvailability } from "../../lib/availability";
import { AVAILABILITY_COPY } from "../../lib/availability.constant";

export function useRoomAvailability(roomType, fromIso, toIso) {
  const [tick, setTick] = useState(0);
  const key = `${roomType}|${fromIso}|${toIso}|${tick}`;
  const [payload, setPayload] = useState(null);

  useEffect(() => {
    let live = true;
    getRoomAvailability({ roomType, fromIso, toIso })
      .then((data) => {
        if (!live) return;
        const next = data.nights && typeof data.nights === "object" ? data.nights : {};
        setPayload({ key, nights: next, error: "" });
      })
      .catch((error) => {
        if (!live) return;
        setPayload({
          key,
          nights: {},
          error: error.message || AVAILABILITY_COPY.errorText,
        });
      });
    return () => {
      live = false;
    };
  }, [key, roomType, fromIso, toIso]);

  const matched = payload?.key === key;
  let status = "loading";
  if (!payload) status = "loading";
  else if (matched && payload.error) status = "error";
  else if (matched && Object.keys(payload.nights).length === 0) status = "empty";
  else if (payload.nights && Object.keys(payload.nights).length > 0) status = "ready";
  else if (matched) status = "empty";

  return {
    status,
    nights: payload?.nights ?? {},
    fault: matched ? payload?.error ?? "" : "",
    retry() {
      setTick((current) => current + 1);
    },
  };
}
