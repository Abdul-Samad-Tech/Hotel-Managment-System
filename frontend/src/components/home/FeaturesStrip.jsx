import * as HoverCard from "@radix-ui/react-hover-card";
import { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { features } from "../../data/site";
import { duration, easeTide, tideDelay, viewportOnce } from "../../lib/motion";
import { DrawIcon } from "../motion/DrawIcon";

const iconStrokes = {
  waves: {
    paths: [
      "M2 12q2.5 2 5 0t5 0 5 0 5 0",
      "M2 19q2.5 2 5 0t5 0 5 0 5 0",
      "M2 5q2.5 2 5 0t5 0 5 0 5 0",
    ],
  },
  bed: {
    paths: [
      "M2 20v-8a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v8",
      "M4 10V6a2 2 0 0 1 2-2h12a2 2 0 0 1 2 2v4",
      "M12 4v6",
      "M2 18h20",
    ],
  },
  dining: {
    paths: [
      "m16 2-2.3 2.3a3 3 0 0 0 0 4.2l1.8 1.8a3 3 0 0 0 4.2 0L22 8",
      "M15 15 3.3 3.3a4.2 4.2 0 0 0 0 6l7.3 7.3c.7.7 2 .7 2.8 0L15 15Zm0 0 7 7",
      "m2.1 21.8 6.4-6.3",
      "m19 5-7 7",
    ],
  },
  spa: {
    paths: [
      "M12 5a3 3 0 1 1 3 3m-3-3a3 3 0 1 0-3 3m3-3v1M9 8a3 3 0 1 0 3 3M9 8h1m5 0a3 3 0 1 1-3 3m3-3h-1m-2 3v-1",
      "M12 10v12",
      "M12 22c4.2 0 7-1.667 7-5-4.2 0-7 1.667-7 5Z",
      "M12 22c-4.2 0-7-1.667-7-5 4.2 0 7 1.667 7 5Z",
    ],
    circles: [{ cx: "12", cy: "8", r: "2" }],
  },
  pool: {
    paths: ["M6 16c5 0 7-8 12-8a4 4 0 0 1 0 8c-5 0-7-8-12-8a4 4 0 1 0 0 8"],
  },
  concierge: {
    paths: [
      "M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z",
    ],
  },
};

export function FeaturesStrip() {
  const reduce = useReducedMotion();

  return (
    <section className="overflow-hidden bg-white pt-6 pb-2" aria-label="Resort features">
      <ul className="page-wrap flex gap-0 overflow-x-auto no-scrollbar md:grid md:grid-cols-3 md:overflow-visible xl:grid-cols-6">
        {features.map((feature, index) => (
          <FeatureItem key={feature.title} feature={feature} index={index} last={index === features.length - 1} reduce={reduce} />
        ))}
      </ul>
    </section>
  );
}

function FeatureItem({ feature, index, last, reduce }) {
  const strokes = iconStrokes[feature.icon];
  const delay = tideDelay(index);
  const [draw, setDraw] = useState(0);

  return (
    <li className="relative min-w-[200px] px-4 py-8 md:min-w-0">
      {!last && (
        <motion.span
          aria-hidden="true"
          className="absolute top-10 right-0 bottom-10 w-px origin-top bg-navy/10"
          initial={{ scaleY: reduce ? 1 : 0 }}
          whileInView={{ scaleY: 1 }}
          viewport={viewportOnce}
          transition={{ duration: reduce ? duration.micro : duration.reveal, delay, ease: easeTide }}
        />
      )}
      <HoverCard.Root openDelay={180} closeDelay={80} onOpenChange={(open) => { if (open) setDraw((value) => value + 1); }}>
        <HoverCard.Trigger asChild>
          <button
            type="button"
            className="w-full cursor-pointer rounded-2xl text-left outline-none focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold"
          >
            <motion.span
              className="inline-grid"
              whileHover={reduce ? undefined : { y: -3 }}
              transition={{ duration: duration.micro, ease: easeTide }}
            >
              <motion.span
                className="grid h-12 w-12 place-items-center rounded-full bg-[#f8edd6] text-[#c9953a]"
                initial={reduce ? false : { scale: 0.92, opacity: 0 }}
                whileInView={{ scale: 1, opacity: 1 }}
                viewport={viewportOnce}
                transition={{ duration: reduce ? duration.micro : duration.ui, delay, ease: easeTide }}
              >
                <DrawIcon
                  key={draw}
                  play={draw > 0}
                  paths={strokes.paths}
                  circles={strokes.circles}
                  delay={draw ? 0 : delay}
                  className="h-5 w-5"
                />
              </motion.span>
            </motion.span>
            <motion.h2
              className="mt-4 text-[15px] font-semibold text-navy"
              initial={reduce ? false : { opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={viewportOnce}
              transition={{ duration: reduce ? duration.micro : duration.ui, delay: delay + tideDelay(1), ease: easeTide }}
            >
              {feature.title}
            </motion.h2>
            <motion.p
              className="mt-1 max-w-[22ch] text-[13px] leading-5 text-muted"
              initial={reduce ? false : { opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={viewportOnce}
              transition={{ duration: reduce ? duration.micro : duration.ui, delay: delay + tideDelay(2), ease: easeTide }}
            >
              {feature.text}
            </motion.p>
          </button>
        </HoverCard.Trigger>
        <HoverCard.Portal>
          <HoverCard.Content
            side="top"
            sideOffset={8}
            className="bay-modal z-[60] w-56 p-4"
          >
            <p className="text-sm font-semibold">{feature.title}</p>
            <p className="mt-1 text-sm leading-6 text-muted">{feature.text}</p>
          </HoverCard.Content>
        </HoverCard.Portal>
      </HoverCard.Root>
    </li>
  );
}