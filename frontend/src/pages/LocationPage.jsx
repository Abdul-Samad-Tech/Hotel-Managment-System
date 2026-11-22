import { Copy, MapPin, Navigation } from "lucide-react";
import { lazy, Suspense, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Skeleton } from "../components/ui/Skeleton";
import { beachAccess } from "../data/experiences";
import { gettingHere, nearby, resortAddress, resortPin } from "../data/location";
import { weather } from "../data/site";
import { duration, easeTide, viewportOnce } from "../lib/motion";
import { PageBanner } from "../components/layout/PageBanner";
import { notify } from "../components/ui/BayToaster";
import { Badge } from "../components/ui/Badge";
import { Tabs } from "../components/ui/Tabs";

const ResortMap = lazy(() => import("../components/location/ResortMap.jsx").then((module) => ({ default: module.ResortMap })));

const directionsUrl = `https://www.openstreetmap.org/directions?to=${resortPin.lat}%2C${resortPin.lng}`;

export function LocationPage() {
  const reduce = useReducedMotion();
  const [mode, setMode] = useState("air");
  const current = gettingHere.find((item) => item.value === mode) || gettingHere[0];

  function copyAddress() {
    navigator.clipboard.writeText(resortAddress).then(() => notify("Address copied."));
  }

  return (
    <main>
      <PageBanner
        eyebrow="Find us"
        title="Azure Bay,"
        accent="Maldives"
        text="A beachfront resort on a quiet stretch of lagoon, reached by boat from the capital."
        image={beachAccess.image}
      />
      <section className="bg-cream py-14">
        <div className="page-wrap grid gap-8">
          <div className="overflow-hidden rounded-[18px] shadow-[0_16px_40px_rgba(7,27,43,0.12)]">
            <Suspense fallback={<Skeleton className="bay-map h-[320px] w-full rounded-none lg:h-[420px]" />}>
              <ResortMap lat={resortPin.lat} lng={resortPin.lng} label={resortAddress} />
            </Suspense>
          </div>
          <p className="text-sm text-muted">The pin marks {resortAddress}. It is the atoll named on this page, not a surveyed street point.</p>

          <div className="flex flex-wrap gap-2">
            <a
              href={directionsUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-11 items-center gap-2 rounded-full bg-gold px-4 text-sm font-semibold text-navy focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
            >
              <Navigation className="h-4 w-4" aria-hidden="true" />
              Get directions
            </a>
            <button
              type="button"
              onClick={copyAddress}
              className="inline-flex h-11 cursor-pointer items-center gap-2 rounded-full border border-navy/15 bg-white px-4 text-sm font-semibold text-navy focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
            >
              <Copy className="h-4 w-4" aria-hidden="true" />
              Copy address
            </button>
          </div>

          <div className="grid items-start gap-6 lg:grid-cols-[1fr_1fr]">
            <motion.div
              className="rounded-[18px] bg-white p-6 shadow-[0_16px_40px_rgba(7,27,43,0.08)]"
              initial={reduce ? { opacity: 0 } : { opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={viewportOnce}
              transition={{ duration: reduce ? duration.micro : duration.ui, ease: easeTide }}
            >
              <p className="inline-flex items-center gap-2 font-display text-2xl text-navy">
                <MapPin className="h-5 w-5 text-gold" aria-hidden="true" /> Getting here
              </p>
              <div className="mt-4 overflow-x-auto">
                <Tabs value={mode} onValueChange={setMode} items={gettingHere.map(({ value, label }) => ({ value, label }))} layoutId="getting-here" />
              </div>
              <h2 className="mt-4 font-display text-xl text-navy">{current.title}</h2>
              <p className="mt-2 text-sm leading-6 text-muted">{current.text}</p>
              <p className="mt-4 text-sm text-muted">
                Weather on the coast today: {weather.temp}, {weather.condition}. {weather.place}.
              </p>
            </motion.div>

            <div>
              <h2 className="font-display text-2xl text-navy">Nearby</h2>
              <ul className="mt-4 grid gap-3">
                {nearby.map((place) => (
                  <li key={place.name} className="flex items-center justify-between gap-3 rounded-2xl bg-white px-4 py-3 shadow-[0_8px_24px_rgba(7,27,43,0.06)]">
                    <span className="text-sm font-semibold text-navy">{place.name}</span>
                    <Badge tone="outline" className="normal-case tracking-normal">{place.distance}</Badge>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
