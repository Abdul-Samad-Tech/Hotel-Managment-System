import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { STICKY_SENTINELS } from "../../lib/sticky-bar.constant";

function findSentinel() {
  return STICKY_SENTINELS.map((selector) => document.querySelector(selector)).find(Boolean) ?? null;
}

export function usePastHero() {
  const { pathname } = useLocation();
  const [state, setState] = useState({ path: pathname, past: false });

  useEffect(() => {
    const node = findSentinel();
    if (!node) return undefined;
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (!entry) return;
        const goneUp = !entry.isIntersecting && entry.boundingClientRect.top < 0;
        setState({ path: pathname, past: goneUp });
      },
      { threshold: 0, rootMargin: "-72px 0px 0px 0px" },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [pathname]);

  return state.path === pathname && state.past;
}
