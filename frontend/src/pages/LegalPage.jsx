import { useParams } from "react-router-dom";
import { motion, useReducedMotion } from "framer-motion";
import { legalPages } from "../data/legal";
import { duration, easeTide, tideDelay, viewportOnce } from "../lib/motion";
import { PageBanner } from "../components/layout/PageBanner";
import { heroCopy } from "../data/site";
import { NotFoundPage } from "./NotFoundPage";

export function LegalPage() {
  const reduce = useReducedMotion();
  const { page } = useParams();
  const content = legalPages[page];
  const calm = page === "privacy" || page === "terms" || page === "support";

  if (!content) return <NotFoundPage />;

  return (
    <main>
      <PageBanner eyebrow={content.eyebrow} title={content.title} text={content.text} image={heroCopy.image} />
      <section className="bg-cream py-14">
        <div className="page-wrap grid max-w-3xl gap-4">
          {content.sections.map(([heading, body], index) => (
            <motion.article
              key={heading}
              className="rounded-2xl bg-white p-5 shadow-[0_16px_40px_rgba(7,27,43,0.06)]"
              initial={calm && !reduce ? { opacity: 0, y: 18 } : false}
              whileInView={calm ? { opacity: 1, y: 0 } : undefined}
              viewport={calm ? viewportOnce : undefined}
              transition={calm ? { duration: reduce ? duration.micro : duration.ui, delay: reduce ? 0 : tideDelay(index), ease: easeTide } : undefined}
            >
              <h2 className="font-display text-2xl text-navy">{heading}</h2>
              <p className="mt-2 text-sm leading-7 text-muted">{body}</p>
            </motion.article>
          ))}
        </div>
      </section>
    </main>
  );
}
