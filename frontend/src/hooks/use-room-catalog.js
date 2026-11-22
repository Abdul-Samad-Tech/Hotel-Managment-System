import { useEffect, useState } from "react";
import { rooms as staticRooms } from "../data/rooms";
import { loadRoomCatalog } from "../lib/roomCatalog";

export function useRoomCatalog() {
  const [rooms, setRooms] = useState(staticRooms);
  const [source, setSource] = useState("static");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let active = true;
    loadRoomCatalog().then((result) => {
      if (!active) return;
      setRooms(result.rooms);
      setSource(result.source);
      setReady(true);
    });
    return () => {
      active = false;
    };
  }, []);

  return { rooms, source, ready };
}
