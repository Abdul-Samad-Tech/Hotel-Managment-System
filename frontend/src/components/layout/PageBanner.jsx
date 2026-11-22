import { useRef } from "react";
import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { duration, easeTide, tideDelay, viewportOnce } from "../../lib/motion";
import { RevealText } from "../motion/RevealText";
import { Eyebrow } from "../ui/Buttons";

export function PageBanner({ eyebrow, title, accent, text, image }) {
  const reduce = useReducedMotion();
  const sectionRef = useRef(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });
  const y = useTransform(scrollYProgress, [0, 1], reduce ? ["0%", "0%"] : ["-4%", "4%"]);

  return (
    <section ref={sectionRef} id="page-banner" className="relative overflow-hidden bg-navy pt-28 pb-14 text-white sm:pt-32 sm:pb-16">
      <motion.img
        src={image}
        alt=""
        className="absolute inset-0 h-full w-full object-cover opacity-40"
        style={{ y, scale: reduce ? 1 : 1.08 }}
      />
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(7,22,36,0.92)_0%,rgba(7,22,36,0.72)_48%,rgba(7,22,36,0.45)_100%)]" />
      <div className="page-wrap relative max-w-3xl">
        <motion.div
          initial={reduce ? false : { opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={viewportOnce}
          transition={{ duration: reduce ? duration.micro : duration.ui, ease: easeTide }}
        >
          <Eyebrow>{eyebrow}</Eyebrow>
        </motion.div>
        <RevealText
          as="h1"
          inView
          className="mt-3 font-display text-4xl leading-tight font-medium sm:text-5xl"
          lines={[
            <>
              {title}
              {accent ? <span className="text-gold italic"> {accent}</span> : null}
            </>,
          ]}
        />
        {text ? (
          <motion.p
            className="mt-4 max-w-xl text-sm leading-7 text-white/80"
            initial={reduce ? false : { opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={viewportOnce}
            transition={{ duration: reduce ? duration.micro : duration.ui, delay: reduce ? 0 : tideDelay(1), ease: easeTide }}
          >
            {text}
          </motion.p>
        ) : null}
      </div>
    </section>
  );
}
