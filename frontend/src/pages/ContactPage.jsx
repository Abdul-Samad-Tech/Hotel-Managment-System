import { Copy, MessageCircle } from "lucide-react";
import { useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { experiencesIntro } from "../data/experiences";
import { resortAddress } from "../data/location";
import { faqs, weather } from "../data/site";
import { duration, easeTide, springSoft, viewportOnce } from "../lib/motion";
import { PageBanner } from "../components/layout/PageBanner";
import { Accordion } from "../components/ui/Accordion";
import { notify } from "../components/ui/BayToaster";
import { Select } from "../components/ui/Select";
import { useAuth } from "../context/AuthContext";
import { api } from "../lib/api";
import { requireSignedIn } from "../lib/auth-gate";

const empty = { name: "", email: "", phone: "", topic: "stay", message: "" };
const topics = [
  { value: "stay", label: "A stay" },
  { value: "room", label: "A room" },
  { value: "dining", label: "Dining" },
  { value: "spa", label: "The spa" },
  { value: "arrival", label: "Arrival" },
  { value: "general", label: "General" },
  { value: "date_change", label: "Change / extend dates" },
];

const cards = [
  { label: "Address", value: resortAddress },
  { label: "Place", value: weather.place },
  { label: "Desk", value: "The concierge is open all day and night." },
];

export function ContactPage() {
  const reduce = useReducedMotion();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState(empty);
  const [errors, setErrors] = useState({});
  const [sent, setSent] = useState(false);
  const [busy, setBusy] = useState(false);

  function setField(name, value) {
    setSent(false);
    setForm((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: "" }));
  }

  async function onSubmit(event) {
    event.preventDefault();
    const next = {};
    if (!form.message.trim()) next.message = "Add a short message.";
    if (!form.topic) next.topic = "Choose a topic.";
    if (user?.role !== "guest") {
      if (!form.name.trim()) next.name = "Add your name.";
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) next.email = "Enter a valid email so the desk can reply.";
    }
    setErrors(next);
    if (Object.keys(next).length) return;

    if (!requireSignedIn(user, navigate, {
      returnTo: "/contact",
      message: "Sign in as a guest to send a message the desk can reply to in Messages.",
    })) {
      return;
    }
    if (user.role !== "guest") {
      notify("Use the portal Messages tab as staff, or sign in with a guest account.");
      return;
    }

    if (form.topic === "date_change") {
      navigate("/messages?compose=1&topic=date_change");
      return;
    }

    setBusy(true);
    try {
      const data = await api("/desk-messages/threads", {
        method: "POST",
        body: {
          topic: form.topic,
          subject: topics.find((item) => item.value === form.topic)?.label,
          message: form.message.trim(),
        },
      });
      setSent(true);
      setForm(empty);
      notify("Message sent to the front desk.");
      navigate(`/messages?thread=${data.thread.id}`);
    } catch (error) {
      notify(error.message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="relative">
      <PageBanner
        eyebrow="Concierge"
        title="Write to"
        accent="Azure Bay"
        text="Signed-in guests send live messages the desk can reply to. Replies appear under Messages — private to your account."
        image={experiencesIntro.image}
      />
      <section className="bg-cream py-14">
        <div className="page-wrap grid items-start gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <motion.form
            onSubmit={onSubmit}
            noValidate
            className="rounded-[18px] bg-white p-6 shadow-[0_16px_40px_rgba(7,27,43,0.08)]"
            initial={reduce ? { opacity: 0 } : { opacity: 0, y: 22 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={viewportOnce}
            transition={{ duration: reduce ? duration.micro : duration.ui, ease: easeTide }}
          >
            {user?.role === "guest" ? (
              <p className="mb-2 text-sm text-muted">
                Signed in as <strong className="text-navy">{user.name || user.email}</strong>.{" "}
                <Link to="/messages" className="font-semibold text-navy underline">Open Messages</Link>
              </p>
            ) : (
              <p className="mb-2 text-sm text-muted">
                <Link to="/login?return=/contact" className="font-semibold text-navy underline">Sign in</Link>
                {" "}as a guest to send a message and read the desk reply.
              </p>
            )}
            {user?.role !== "guest" ? (
              <>
                <FloatField id="contact-name" label="Name" value={form.name} onChange={(value) => setField("name", value)} autoComplete="name" error={errors.name} />
                <FloatField id="contact-email" label="Email" type="email" value={form.email} onChange={(value) => setField("email", value)} autoComplete="email" error={errors.email} />
                <FloatField id="contact-phone" label="Phone" type="tel" value={form.phone} onChange={(value) => setField("phone", value)} autoComplete="tel" />
              </>
            ) : null}
            <div className="mt-5">
              <Select id="contact-topic" label="Topic" value={form.topic} onValueChange={(value) => setField("topic", value)} options={topics} />
              {errors.topic ? <p className="mt-1.5 text-sm text-rose-700" role="alert">{errors.topic}</p> : null}
            </div>
            <FloatField id="contact-message" label="Message" value={form.message} onChange={(value) => setField("message", value)} error={errors.message} multiline />
            <AnimatePresence>
              {sent && (
                <motion.p
                  className="mt-4 rounded-2xl bg-gold/30 px-4 py-3 text-sm text-navy"
                  role="status"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: reduce ? duration.micro : duration.ui, ease: easeTide }}
                >
                  Sent. Open Messages to continue the conversation with the desk.
                </motion.p>
              )}
            </AnimatePresence>
            <motion.button
              type="submit"
              disabled={busy}
              className="mt-5 inline-flex h-11 cursor-pointer items-center rounded-full bg-gold px-5 text-sm font-semibold text-navy focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold disabled:opacity-50"
              whileTap={reduce ? undefined : { scale: 0.98 }}
              transition={springSoft}
            >
              {busy ? "Sending…" : "Send message"}
            </motion.button>
          </motion.form>

          <div className="grid gap-4">
            {cards.map((card) => (
              <article key={card.label} className="flex items-center justify-between gap-3 rounded-2xl bg-white p-4 shadow-[0_8px_24px_rgba(7,27,43,0.06)]">
                <div>
                  <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-gold">{card.label}</p>
                  <p className="mt-1 text-sm text-navy">{card.value}</p>
                </div>
                <button
                  type="button"
                  aria-label={`Copy ${card.label}`}
                  onClick={() => navigator.clipboard.writeText(card.value).then(() => notify(`${card.label} copied.`))}
                  className="grid h-11 w-11 shrink-0 cursor-pointer place-items-center rounded-full border border-navy/15 text-navy focus-visible:outline-2 focus-visible:outline-gold"
                >
                  <Copy className="h-4 w-4" />
                </button>
              </article>
            ))}
            <div>
              <h2 className="mb-3 font-display text-2xl text-navy">Questions</h2>
              <Accordion
                items={faqs.map((item) => ({
                  value: item.label,
                  title: item.label,
                  body: item.text,
                }))}
              />
            </div>
          </div>
        </div>
      </section>
      <button
        type="button"
        aria-label="Open messages"
        onClick={() => navigate(user?.role === "guest" ? "/messages" : "/login?return=/messages")}
        className="fixed right-4 bottom-24 z-40 grid h-11 w-11 cursor-pointer place-items-center rounded-full bg-gold text-navy shadow-[0_10px_28px_rgba(242,192,120,0.45)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy lg:bottom-4"
      >
        <MessageCircle className="h-5 w-5" aria-hidden="true" />
      </button>
    </main>
  );
}

function FloatField({ id, label, type = "text", value, onChange, autoComplete, error, multiline = false }) {
  const floated =
    "peer-focus:-translate-y-[1.15rem] peer-focus:scale-[0.82] peer-[:not(:placeholder-shown)]:-translate-y-[1.15rem] peer-[:not(:placeholder-shown)]:scale-[0.82]";
  const fieldClass = `peer w-full bg-transparent pt-4 text-sm font-normal text-navy outline-none placeholder:text-transparent`;
  return (
    <div className="mt-5">
      <div className={`relative border-b-2 px-1 ${multiline ? "min-h-24" : "h-14"} ${error ? "border-rose-600" : "border-navy/15"} focus-within:border-gold`}>
        {multiline ? (
          <textarea id={id} value={value} placeholder=" " rows={4} onChange={(event) => onChange(event.target.value)} aria-invalid={error ? true : undefined} aria-describedby={error ? `${id}-error` : undefined} className={fieldClass} />
        ) : (
          <input id={id} type={type} value={value} placeholder=" " autoComplete={autoComplete} onChange={(event) => onChange(event.target.value)} aria-invalid={error ? true : undefined} aria-describedby={error ? `${id}-error` : undefined} className={fieldClass} />
        )}
        <label
          htmlFor={id}
          className={`pointer-events-none absolute left-1 origin-left text-sm font-medium text-navy/45 transition-transform duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] ${multiline ? "top-4" : "top-1/2 -translate-y-1/2"} ${floated}`}
        >
          {label}
        </label>
      </div>
      {error ? (
        <p id={`${id}-error`} className="mt-1.5 text-sm text-rose-700" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
