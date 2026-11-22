import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { heroCopy } from "../../data/site";
import { duration, easeFlow, easeTide, tideDelay } from "../../lib/motion";
import { SmartImage } from "../ui/SmartImage";

export function VideoModal({ open, onClose }) {
  const reduce = useReducedMotion();
  const fade = {
    duration: reduce ? duration.micro : duration.ui,
    ease: easeFlow,
  };

  return (
    <Dialog.Root open={open} onOpenChange={(next) => { if (!next) onClose(); }}>
      <AnimatePresence>
        {open && (
          <Dialog.Portal forceMount>
            <Dialog.Overlay asChild forceMount>
              <motion.div
                className="fixed inset-0 z-[80] bg-navy/80 backdrop-blur-sm"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={fade}
              />
            </Dialog.Overlay>
            <Dialog.Content asChild forceMount>
              <motion.div
                className="fixed top-1/2 left-1/2 z-[80] w-[min(56rem,calc(100%-2rem))] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-2xl bg-navy shadow-[0_18px_50px_rgba(7,27,43,0.2)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
                initial={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={reduce ? { opacity: 0 } : { opacity: 0, scale: 0.98 }}
                transition={fade}
              >
                <Dialog.Close asChild>
                  <button
                    type="button"
                    aria-label="Close resort film"
                    className="absolute top-3 right-3 z-10 grid h-11 w-11 cursor-pointer place-items-center rounded-full bg-white/15 text-white hover:bg-white hover:text-navy focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </Dialog.Close>
                <div className="relative aspect-video overflow-hidden">
                  <SmartImage
                    src={heroCopy.poster}
                    alt="Slow view across the Azure Bay infinity pool at sunset"
                    className="h-full w-full"
                    imgClassName="kenburns h-full w-full"
                    width={1280}
                    height={720}
                    priority
                  />
                  <motion.div
                    className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-navy/80 to-transparent p-5"
                    initial={reduce ? false : { opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: reduce ? duration.micro : duration.ui, delay: reduce ? 0 : tideDelay(2), ease: easeTide }}
                  >
                    <Dialog.Title id="resort-film-title" className="font-display text-2xl text-white">
                      Azure Bay
                    </Dialog.Title>
                    <Dialog.Description className="text-sm text-white/75">Resort film</Dialog.Description>
                  </motion.div>
                </div>
              </motion.div>
            </Dialog.Content>
          </Dialog.Portal>
        )}
      </AnimatePresence>
    </Dialog.Root>
  );
}
