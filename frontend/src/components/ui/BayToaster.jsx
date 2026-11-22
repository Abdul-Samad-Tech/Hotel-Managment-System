import { useReducedMotion } from "framer-motion";
import { Toaster } from "sonner";

export { toast as notify } from "sonner";

export function BayToaster() {
  const reduce = useReducedMotion();

  return (
    <Toaster
      position="top-center"
      duration={reduce ? 2500 : 4200}
      toastOptions={{
        style: {
          background: "#FAF8F4",
          color: "#0B1F33",
          border: "1px solid rgba(242, 192, 120, 0.75)",
          borderRadius: "16px",
          boxShadow: "0 16px 40px rgba(7, 27, 43, 0.12)",
          fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif",
        },
      }}
    />
  );
}
