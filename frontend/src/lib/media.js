import { useEffect, useState } from "react";

export function useMediaQuery(query) {
  const [match, setMatch] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(query);
    const sync = () => setMatch(media.matches);
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, [query]);

  return match;
}
