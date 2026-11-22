import { useEffect, useRef } from "react";
import { io } from "socket.io-client";
import { getAccessToken } from "./session";

export function useOpsPulse(onPulse) {
  const handler = useRef(onPulse);
  handler.current = onPulse;

  useEffect(() => {
    const token = getAccessToken();
    const socket = io({
      withCredentials: true,
      auth: token ? { token } : undefined,
    });
    socket.on("ops", () => handler.current());
    return () => socket.close();
  }, []);
}
