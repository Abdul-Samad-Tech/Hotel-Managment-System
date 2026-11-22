import * as Accordion from "@radix-ui/react-accordion";
import { ArrowUp, ChevronDown } from "lucide-react";
import { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { Link } from "react-router-dom";
import { legalLinks, navLinks } from "../../data/site";
import { duration, easeTide, springSoft, viewportOnce } from "../../lib/motion";
import { FacebookIcon, InstagramIcon, Logo, XIcon, YouTubeIcon } from "../ui/Brand";
import { InlineError } from "../ui/InlineError";

const socials = [
  { label: "Instagram", href: "https://instagram.com", Icon: InstagramIcon },
  { label: "Facebook", href: "https://facebook.com", Icon: FacebookIcon },
  { label: "X", href: "https://x.com", Icon: XIcon },
  { label: "YouTube", href: "https://youtube.com", Icon: YouTubeIcon },
];

export function Footer() {
  const reduce = useReducedMotion();

  return (
    <footer id="contact" className="relative overflow-hidden bg-navy text-white">
      <div className="page-wrap flex flex-col gap-8 py-8 md:flex-row md:items-center md:justify-between">
        <div id="location" className="grid gap-4">
          <Logo />
          <Newsletter />
        </div>

        <nav aria-label="Footer" className="hidden flex-wrap gap-x-5 gap-y-2 text-sm text-white/80 md:flex">
          {navLinks.map((link) => (
            <FooterLink key={link.label} to={link.href}>
              {link.label}
            </FooterLink>
          ))}
        </nav>
        <FooterGroups />

        <div className="flex items-center gap-2">
          {socials.map(({ label, href, Icon }) => (
            <motion.a
              key={label}
              href={href}
              target="_blank"
              rel="noreferrer"
              aria-label={label}
              whileHover={reduce ? undefined : { y: -3 }}
              transition={springSoft}
              className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-white/20 text-white hover:border-gold hover:text-gold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
            >
              <Icon />
            </motion.a>
          ))}
        </div>
      </div>

      <div className="page-wrap flex flex-col gap-3 border-t border-white/10 py-5 text-xs text-white/65 sm:flex-row sm:items-center sm:justify-between">
        <p>© 2025 Azure Bay Hotel & Resort. All rights reserved.</p>
        <button
          type="button"
          onClick={() => window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" })}
          className="inline-flex min-h-11 cursor-pointer items-center gap-2 text-white hover:text-gold focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold"
        >
          Back to top
          <ArrowUp className="h-4 w-4" aria-hidden="true" />
        </button>
        <ul className="hidden gap-4 md:flex">
          {legalLinks.map((item) => (
            <li key={item.href}>
              <FooterLink to={item.href}>{item.label}</FooterLink>
            </li>
          ))}
        </ul>
      </div>

      <svg
        viewBox="0 0 240 28"
        className="pointer-events-none absolute bottom-0 left-1/2 h-7 w-40 -translate-x-1/2 text-gold/80"
        aria-hidden="true"
      >
        <motion.path
          d="M4 18c18-12 36-12 54 0s36 12 54 0 36-12 54 0 36 12 70 0"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.4"
          strokeLinecap="round"
          initial={{ pathLength: reduce ? 1 : 0 }}
          whileInView={{ pathLength: 1 }}
          viewport={viewportOnce}
          transition={{ duration: reduce ? duration.micro : duration.reveal, ease: easeTide }}
        />
      </svg>
    </footer>
  );
}

function Newsletter() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  function onSubmit(event) {
    event.preventDefault();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setSent(false);
      setError("Enter a valid email so the desk can reply.");
      return;
    }
    setError("");
    setSent(true);
    setEmail("");
  }

  return (
    <form onSubmit={onSubmit} noValidate className="max-w-xs">
      <label htmlFor="footer-email" className="text-[11px] font-medium tracking-[0.16em] text-gold uppercase">
        Notes from the bay
      </label>
      <div className="mt-2 flex gap-2">
        <input
          id="footer-email"
          type="email"
          value={email}
          onChange={(event) => {
            setEmail(event.target.value);
            setSent(false);
            setError("");
          }}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? "footer-email-error" : undefined}
          placeholder="Email"
          className="h-11 min-w-0 flex-1 rounded-full border border-white/20 bg-white/10 px-4 text-sm text-white outline-none placeholder:text-white/50 focus:border-gold"
        />
        <button type="submit" className="h-11 cursor-pointer rounded-full bg-gold px-4 text-sm font-semibold text-navy focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold">
          Join
        </button>
      </div>
      {error ? (
        <div className="mt-2 rounded-xl bg-cream px-3">
          <InlineError id="footer-email-error">{error}</InlineError>
        </div>
      ) : null}
      {sent ? (
        <p role="status" className="mt-1.5 text-sm text-gold">
          Noted on this page. Nothing was sent.
        </p>
      ) : null}
    </form>
  );
}

function FooterGroups() {
  const groups = [
    { value: "explore", title: "Explore", links: navLinks },
    { value: "house", title: "House notes", links: legalLinks },
  ];

  return (
    <Accordion.Root type="single" collapsible className="grid gap-2 md:hidden">
      {groups.map((group) => (
        <Accordion.Item key={group.value} value={group.value} className="border-b border-white/10">
          <Accordion.Header>
            <Accordion.Trigger className="group flex min-h-11 w-full cursor-pointer items-center justify-between text-left text-sm font-semibold text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold">
              {group.title}
              <ChevronDown className="h-4 w-4 transition-transform group-data-[state=open]:rotate-180" aria-hidden="true" />
            </Accordion.Trigger>
          </Accordion.Header>
          <Accordion.Content className="grid gap-1 pb-3">
            {group.links.map((link) => (
              <FooterLink key={link.href} to={link.href}>
                {link.label}
              </FooterLink>
            ))}
          </Accordion.Content>
        </Accordion.Item>
      ))}
    </Accordion.Root>
  );
}

function FooterLink({ to, children }) {
  return (
    <Link
      to={to}
      className="group relative inline-flex hover:text-gold focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold"
    >
      {children}
      <span
        aria-hidden="true"
        className="absolute -bottom-0.5 left-0 h-px w-full origin-left scale-x-0 bg-gold transition-transform duration-[480ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-x-100 group-focus-visible:scale-x-100 motion-reduce:transition-none"
      />
    </Link>
  );
}
