import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import * as Tabs from "@radix-ui/react-tabs";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";
import { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { DeskCommand } from "./DeskCommand";
import { useAuth } from "../../context/AuthContext";
import { duration, easeTide } from "../../lib/motion";

const roleLabel = {
  admin: "Administrator",
  manager: "Manager",
  receptionist: "Front desk",
  housekeeping: "Housekeeping",
  maintenance: "Maintenance",
  guest: "Guest",
};

const menuItem = "flex min-h-11 w-full cursor-pointer items-center rounded-xl px-3 text-left text-sm font-medium text-navy outline-none data-[highlighted]:bg-gold/35";

export function DashboardShell({ title, eyebrow, user, sections, active, onSelect, children }) {
  const reduce = useReducedMotion();
  const desktop = useDesktopNav();
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [collapsed, setCollapsed] = useState(() => window.localStorage.getItem("azure-bay-sidebar") === "collapsed");
  const [palette, setPalette] = useState(false);
  const today = new Intl.DateTimeFormat("en", { weekday: "long", month: "long", day: "numeric" }).format(new Date());
  const current = active || sections[0]?.id;
  const currentLabel = sections.find((section) => section.id === current)?.label || "Desk";
  const iconsOnly = desktop && collapsed;

  useEffect(() => {
    window.localStorage.setItem("azure-bay-sidebar", collapsed ? "collapsed" : "open");
  }, [collapsed]);

  useEffect(() => {
    function onKey(event) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setPalette(true);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <Tabs.Root
      value={current}
      onValueChange={onSelect}
      orientation={desktop ? "vertical" : "horizontal"}
      className="min-h-screen bg-[#f4f0e8] lg:grid lg:grid-cols-[auto_1fr]"
    >
      <motion.aside
        className="overflow-hidden border-b border-white/10 bg-navy text-white lg:sticky lg:top-0 lg:h-screen lg:border-r lg:border-b-0"
        initial={false}
        animate={{ width: desktop ? (collapsed ? 76 : 248) : "100%" }}
        transition={{ duration: reduce ? duration.micro : duration.ui, ease: easeTide }}
      >
        <div className={`flex items-start justify-between gap-2 py-5 ${iconsOnly ? "px-3" : "px-5"}`}>
          <div className="min-w-0">
            <p className="text-[10px] font-medium uppercase tracking-[0.28em] text-gold">{iconsOnly ? "AB" : "Azure Bay"}</p>
            {!iconsOnly && <p className="mt-1 font-display text-2xl leading-none">{title}</p>}
            {!iconsOnly && <p className="mt-2 text-xs text-white/60">{roleLabel[user.role] || user.role}</p>}
          </div>
          <button
            type="button"
            className="hidden h-11 w-11 shrink-0 cursor-pointer place-items-center rounded-full text-white hover:bg-white/10 focus-visible:outline-2 focus-visible:outline-gold lg:grid"
            aria-expanded={!collapsed}
            aria-controls="desk-nav"
            onClick={() => setCollapsed((value) => !value)}
          >
            {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
            <span className="sr-only">{collapsed ? "Expand menu" : "Collapse menu"}</span>
          </button>
        </div>
        <Tabs.List id="desk-nav" className="flex gap-2 overflow-x-auto px-3 pb-4 no-scrollbar lg:grid lg:gap-1" aria-label="Dashboard">
          {sections.map((section) => {
            const Icon = section.icon;
            const selected = section.id === current;
            return (
              <Tabs.Trigger
                key={section.id}
                value={section.id}
                title={section.label}
                className={`relative inline-flex min-h-11 shrink-0 cursor-pointer items-center gap-2.5 rounded-full px-3 py-2.5 text-left text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold lg:rounded-xl ${
                  selected && reduce ? "bg-gold text-navy" : "text-white/80 hover:bg-white/10 hover:text-white"
                } ${selected && !reduce ? "text-navy" : ""}`}
              >
                {selected && !reduce && (
                  <motion.span
                    layoutId="desk-pill"
                    className="absolute inset-0 rounded-full bg-gold lg:rounded-xl"
                    transition={{ duration: duration.ui, ease: easeTide }}
                  />
                )}
                <span className="relative z-10 inline-flex items-center gap-2.5">
                  <Icon className="h-4 w-4 shrink-0" strokeWidth={1.6} />
                  <span className={iconsOnly ? "sr-only" : ""}>{section.label}</span>
                </span>
              </Tabs.Trigger>
            );
          })}
        </Tabs.List>
      </motion.aside>

      <Tabs.Content value={current} className="min-w-0 outline-none">
        <header className="flex flex-wrap items-end justify-between gap-3 border-b border-navy/8 bg-white/70 px-5 py-5 backdrop-blur-sm sm:px-8">
          <div>
            <nav aria-label="Breadcrumb" className="text-[11px] font-medium uppercase tracking-[0.22em] text-gold">
              <ol className="flex flex-wrap items-center gap-2">
                <li>Desk</li>
                <li aria-hidden="true">/</li>
                <li className="text-navy">{currentLabel}</li>
              </ol>
            </nav>
            <p className="mt-2 text-[11px] font-medium uppercase tracking-[0.22em] text-gold">{eyebrow}</p>
            <h1 className="mt-1 font-display text-3xl text-navy sm:text-4xl">
              {greeting()}, {firstName(user.fullName)}
            </h1>
            <p className="mt-1 text-sm text-muted">{today}</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="inline-flex h-11 cursor-pointer items-center gap-2 rounded-full border border-navy/10 bg-white px-4 text-sm text-navy focus-visible:outline-2 focus-visible:outline-gold"
              onClick={() => setPalette(true)}
            >
              <Search className="h-4 w-4" />
              Jump
              <kbd className="rounded-md bg-cream px-1.5 text-[10px] text-muted">Ctrl K</kbd>
            </button>
            <UserMenu user={user} role={roleLabel[user.role] || user.role} onSignOut={() => logout().then(() => navigate("/"))} onSite={() => navigate("/")} />
          </div>
        </header>
        <motion.div
          key={active}
          className="px-5 py-6 sm:px-8"
          initial={reduce ? false : { opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: reduce ? duration.micro : duration.ui, ease: easeTide }}
        >
          {children}
        </motion.div>
      </Tabs.Content>
      <DeskCommand open={palette} onOpenChange={setPalette} sections={sections} onSelect={onSelect} />
    </Tabs.Root>
  );
}

function UserMenu({ user, role, onSignOut, onSite }) {
  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger className="inline-flex h-11 cursor-pointer items-center rounded-full bg-navy px-4 text-sm font-medium text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold">
        {firstName(user.fullName)}
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content className="z-[80] min-w-48 rounded-2xl bg-cream p-2 text-navy shadow-[0_16px_40px_rgba(7,27,43,0.12)]" sideOffset={8} align="end">
          <p className="px-3 py-2 text-xs text-muted">{role}</p>
          <DropdownMenu.Item className={menuItem} onSelect={onSite}>
            Public site
          </DropdownMenu.Item>
          <DropdownMenu.Item className={menuItem} onSelect={onSignOut}>
            Sign out
          </DropdownMenu.Item>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}

function useDesktopNav() {
  const [desktop, setDesktop] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(min-width: 1024px)");
    const onChange = () => setDesktop(media.matches);
    onChange();
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, []);

  return desktop;
}

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function firstName(fullName = "") {
  return fullName.split(" ")[0] || "there";
}
