import * as Dialog from "@radix-ui/react-dialog";
import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import * as NavigationMenu from "@radix-ui/react-navigation-menu";
import { Menu, Search, UserRound, X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { motion, useReducedMotion, useScroll, useSpring } from "framer-motion";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { currencies, useLocale } from "../../context/LocaleContext";
import { Price } from "../ui/Price";
import { SmartImage } from "../ui/SmartImage";
import { navLinks } from "../../data/site";
import { useRoomCatalog } from "../../hooks/use-room-catalog";
import { requireSignedIn } from "../../lib/auth-gate";
import { homeFor } from "../../lib/roles";
import { duration, easeFlow, easeTide, tideDelay } from "../../lib/motion";
import { Logo } from "../ui/Brand";
import { WishlistTrigger } from "../wishlist/WishlistSheet";
import { ResortSearch } from "./ResortSearch";

const iconBtn =
  "inline-flex h-10 w-10 shrink-0 cursor-pointer items-center justify-center rounded-full border border-white/20 bg-white/10 text-white transition-[background-color,border-color,color] duration-200 hover:border-gold/60 hover:bg-white/15 hover:text-gold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold";

const linkClass =
  "relative whitespace-nowrap px-1 py-2 text-[13px] font-medium tracking-wide text-white/85 transition-colors duration-200 outline-none hover:text-white focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold";

const menuItem =
  "flex min-h-11 w-full cursor-pointer items-center rounded-xl px-3 text-left text-sm font-medium text-navy outline-none data-[highlighted]:bg-gold/35";

export function Navbar() {
  const reduce = useReducedMotion();
  const headerRef = useRef(null);
  const lastScroll = useRef(0);
  const [solid, setSolid] = useState(false);
  const [hidden, setHidden] = useState(false);
  const [open, setOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const { user } = useAuth();
  const { rooms } = useRoomCatalog();
  const onHome = pathname === "/";
  const { scrollYProgress } = useScroll();
  const progress = useSpring(scrollYProgress, { stiffness: 120, damping: 24, restDelta: 0.001 });

  useEffect(() => {
    function onKey(event) {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        if (/^\/(guest|staff|admin|portal)(\/|$)/.test(window.location.pathname)) return;
        event.preventDefault();
        setOpen(false);
        setSearchOpen(true);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    const onScroll = () => {
      const y = window.scrollY;
      setSolid(y > 24);
      const focused = headerRef.current?.contains(document.activeElement);
      if (reduce || open || searchOpen || focused) {
        setHidden(false);
      } else if (y > lastScroll.current + 6 && y > 96) {
        setHidden(true);
      } else if (y < lastScroll.current - 6) {
        setHidden(false);
      }
      lastScroll.current = y;
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [open, reduce, searchOpen]);

  function goToBooking() {
    setOpen(false);
    setSearchOpen(false);
    if (!requireSignedIn(user, navigate, {
      returnTo: "/booking",
      message: "Sign in to check availability and book your stay.",
    })) {
      return;
    }
    navigate("/booking");
  }

  const barTone =
    solid || open || !onHome
      ? "bg-navy/95 shadow-[0_10px_28px_rgba(11,31,51,0.28)]"
      : "bg-navy/75 shadow-[0_8px_24px_rgba(11,31,51,0.22)]";

  return (
    <motion.header
      ref={headerRef}
      className={`fixed inset-x-0 top-0 z-50 border-b border-white/10 backdrop-blur-xl transition-[background-color,box-shadow] duration-300 ${barTone}`}
      initial={reduce ? false : { y: -16, opacity: 0 }}
      animate={{ y: hidden ? "-100%" : 0, opacity: 1 }}
      transition={{ duration: duration.ui, ease: easeFlow }}
    >
      <div className="mx-auto flex h-[72px] w-full max-w-[1200px] items-center gap-3 px-4 sm:px-6">
        <div className="shrink-0">
          <Logo compact />
        </div>

        <NavigationMenu.Root className="relative hidden min-w-0 flex-1 justify-center text-white min-[1024px]:flex" delayDuration={120}>
          <NavigationMenu.List className="flex items-center gap-x-1 xl:gap-x-3">
            {navLinks.map((link) =>
              link.label === "Rooms" ? (
                <NavigationMenu.Item key="Rooms">
                  <NavigationMenu.Trigger
                    className={`${linkClass} group inline-flex items-center gap-1 bg-transparent !text-white/90 hover:!text-white ${
                      pathname.startsWith("/rooms") ? "!text-gold" : ""
                    }`}
                    onClick={(event) => {
                      // Click opens /rooms immediately; hover still reveals the mega menu.
                      event.preventDefault();
                      navigate("/rooms");
                      setOpen(false);
                    }}
                    onPointerUp={(event) => {
                      if (event.pointerType === "mouse" && event.button === 0) {
                        navigate("/rooms");
                      }
                    }}
                  >
                    Rooms
                    {pathname.startsWith("/rooms") && <NavUnderline />}
                  </NavigationMenu.Trigger>
                  <NavigationMenu.Content className="w-[min(720px,calc(100vw-3rem))] p-4">
                    <p className="px-1 text-[11px] font-medium tracking-[0.18em] text-gold uppercase">Rooms</p>
                    <ul className="mt-3 grid grid-cols-2 gap-3 lg:grid-cols-4">
                      {rooms.map((room) => (
                        <li key={room.id}>
                          <NavigationMenu.Link asChild>
                            <NavLink
                              to={`/rooms/${room.id}`}
                              className="block rounded-2xl p-1.5 outline-none transition-colors hover:bg-cream focus-visible:outline-2 focus-visible:outline-gold"
                            >
                              <SmartImage src={room.image} alt="" width={320} height={240} className="aspect-[4/3] w-full rounded-xl" />
                              <p className="mt-2 text-sm font-semibold text-navy">{room.name}</p>
                              <p className="text-xs text-muted">
                                <Price value={room.price} /> / night
                              </p>
                            </NavLink>
                          </NavigationMenu.Link>
                        </li>
                      ))}
                    </ul>
                    <NavigationMenu.Link asChild>
                      <NavLink
                        to="/rooms"
                        className="mt-3 inline-flex min-h-11 items-center px-1 text-sm font-semibold text-navy hover:text-gold focus-visible:outline-2 focus-visible:outline-gold"
                      >
                        All rooms
                      </NavLink>
                    </NavigationMenu.Link>
                  </NavigationMenu.Content>
                </NavigationMenu.Item>
              ) : (
                <NavigationMenu.Item key={link.label}>
                  {(() => {
                    const active = link.href === "/" ? pathname === "/" : pathname.startsWith(link.href);
                    return (
                      <NavigationMenu.Link asChild>
                        <NavLink
                          to={link.href}
                          end={link.href === "/"}
                          className={`${linkClass} ${active ? "!text-gold" : "!text-white/90 hover:!text-white"}`}
                        >
                          {link.label}
                          {active ? <NavUnderline /> : null}
                        </NavLink>
                      </NavigationMenu.Link>
                    );
                  })()}
                </NavigationMenu.Item>
              ),
            )}
          </NavigationMenu.List>
          <NavigationMenu.Viewport className="absolute top-full left-1/2 z-[60] mt-3 h-[var(--radix-navigation-menu-viewport-height)] w-[var(--radix-navigation-menu-viewport-width)] -translate-x-1/2 overflow-hidden rounded-2xl bg-white text-navy shadow-[0_18px_50px_rgba(7,27,43,0.2)]" />
        </NavigationMenu.Root>

        <div className="ml-auto flex shrink-0 items-center gap-1.5 sm:gap-2">
          <button
            type="button"
            aria-keyshortcuts="Control+K Meta+K"
            aria-label={searchOpen ? "Close search" : "Search the resort"}
            aria-expanded={searchOpen}
            onClick={() => {
              setOpen(false);
              setSearchOpen((value) => !value);
            }}
            className={iconBtn}
          >
            <Search className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
          </button>

          <WishlistTrigger className={`hidden sm:inline-flex ${iconBtn}`} />

          <div className="hidden items-center gap-1.5 min-[1024px]:flex">
            <CurrencySwitch />
            <AccountMenu />
          </div>

          <button
            type="button"
            onClick={goToBooking}
            className="inline-flex h-10 shrink-0 cursor-pointer items-center justify-center rounded-full bg-gold px-4 text-[13px] font-semibold text-navy shadow-[0_8px_20px_rgba(242,192,120,0.35)] transition-[filter,transform] duration-200 hover:brightness-110 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold sm:px-5"
          >
            Book Now
          </button>

          <button
            type="button"
            className={`${iconBtn} min-[1024px]:hidden`}
            aria-expanded={open}
            aria-label={open ? "Close menu" : "Open menu"}
            onClick={() => {
              setSearchOpen(false);
              setOpen((value) => !value);
            }}
          >
            {open ? <X className="h-5 w-5" aria-hidden="true" /> : <Menu className="h-5 w-5" aria-hidden="true" />}
          </button>
        </div>
      </div>

      <motion.span
        aria-hidden="true"
        className="pointer-events-none absolute inset-x-0 bottom-0 h-0.5 origin-left bg-gold/90"
        style={{ scaleX: reduce ? scrollYProgress : progress }}
      />

      <ResortSearch open={searchOpen} onOpenChange={setSearchOpen} />

      <Dialog.Root open={open} onOpenChange={setOpen}>
        <Dialog.Portal>
          <Dialog.Overlay className="fixed inset-0 z-[70] bg-navy/80 backdrop-blur-sm" />
          <Dialog.Content className="fixed inset-0 z-[80] flex flex-col bg-navy px-6 py-8 text-white outline-none">
            <Dialog.Title className="sr-only">Menu</Dialog.Title>
            <div className="flex items-center justify-between">
              <Logo compact />
              <Dialog.Close
                aria-label="Close menu"
                className="grid h-11 w-11 cursor-pointer place-items-center rounded-full border border-white/20 bg-white/10 text-white hover:text-gold focus-visible:outline-2 focus-visible:outline-gold"
              >
                <X className="h-5 w-5" />
              </Dialog.Close>
            </div>
            <ul className="mx-auto mt-10 grid w-full max-w-md gap-1">
              {navLinks.map((link, index) => (
                <motion.li
                  key={link.label}
                  initial={reduce ? false : { opacity: 0, y: 14 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{
                    duration: reduce ? duration.micro : duration.ui,
                    delay: reduce ? 0 : tideDelay(index),
                    ease: easeTide,
                  }}
                >
                  <NavLink
                    to={link.href}
                    end={link.href === "/"}
                    className="flex min-h-12 items-center rounded-xl px-3 font-display text-3xl text-white transition-colors hover:text-gold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
                    onClick={() => setOpen(false)}
                  >
                    {link.label}
                  </NavLink>
                </motion.li>
              ))}
            </ul>
            <div className="mx-auto mt-8 flex w-full max-w-md flex-wrap items-center gap-2 border-t border-white/10 pt-6">
              <CurrencySwitch />
              <AccountMenu />
              <WishlistTrigger className={iconBtn} />
            </div>
            <div className="mx-auto mt-auto w-full max-w-md pt-6">
              <button
                type="button"
                onClick={goToBooking}
                className="inline-flex h-12 w-full cursor-pointer items-center justify-center rounded-full bg-gold text-sm font-semibold text-navy focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
              >
                Book Now
              </button>
            </div>
          </Dialog.Content>
        </Dialog.Portal>
      </Dialog.Root>
    </motion.header>
  );
}

function NavUnderline() {
  return (
    <motion.span
      layoutId="nav-underline"
      className="absolute inset-x-0 -bottom-0.5 h-0.5 rounded-full bg-gold"
      transition={{ duration: duration.ui, ease: easeTide }}
    />
  );
}

function CurrencySwitch() {
  const { currency, setCurrency } = useLocale();
  return (
    <select
      aria-label="Currency"
      value={currency}
      onChange={(event) => setCurrency(event.target.value)}
      className="h-10 cursor-pointer rounded-full border border-white/20 bg-white/10 px-3 text-xs font-semibold text-white transition-colors duration-200 hover:border-gold/60 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold"
    >
      {currencies.map((code) => (
        <option key={code} className="text-navy">
          {code}
        </option>
      ))}
    </select>
  );
}

function AccountMenu() {
  const { user, ready, logout } = useAuth();
  const navigate = useNavigate();

  if (!ready) {
    return <span className="tide-skeleton h-10 w-10 rounded-full bg-white/15" aria-hidden="true" />;
  }

  const initials = user
    ? user.fullName
        .split(" ")
        .filter(Boolean)
        .slice(0, 2)
        .map((part) => part[0])
        .join("")
        .toUpperCase()
    : "";

  return (
    <DropdownMenu.Root>
      <DropdownMenu.Trigger asChild>
        <button type="button" aria-label={user ? `${user.fullName} account menu` : "Account menu"} className={iconBtn}>
          {user ? (
            <span className="text-[11px] font-bold text-gold">{initials}</span>
          ) : (
            <UserRound className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
          )}
        </button>
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          align="end"
          sideOffset={10}
          className="z-[90] w-60 rounded-2xl bg-white p-2 text-navy shadow-[0_18px_50px_rgba(7,27,43,0.2)]"
        >
          {user ? (
            <>
              <div className="px-3 py-2">
                <p className="text-sm font-semibold">{user.fullName}</p>
                <p className="truncate text-xs text-muted">{user.email}</p>
                <p className="mt-1 text-[10px] font-medium tracking-[0.18em] text-gold uppercase">{user.role}</p>
              </div>
              <DropdownMenu.Item className={menuItem} onSelect={() => navigate(homeFor(user.role))}>
                Open dashboard
              </DropdownMenu.Item>
              {user.role === "guest" && (
                <DropdownMenu.Item className={menuItem} onSelect={() => navigate("/my-bookings")}>
                  My bookings
                </DropdownMenu.Item>
              )}
              {user.role === "guest" && (
                <DropdownMenu.Item className={menuItem} onSelect={() => navigate("/messages")}>
                  Messages
                </DropdownMenu.Item>
              )}
              <DropdownMenu.Item className={menuItem} onSelect={() => logout().then(() => navigate("/"))}>
                Sign out
              </DropdownMenu.Item>
            </>
          ) : (
            <>
              <DropdownMenu.Item className={menuItem} onSelect={() => navigate("/login")}>
                Sign in
              </DropdownMenu.Item>
              <DropdownMenu.Item className={menuItem} onSelect={() => navigate("/register")}>
                Create account
              </DropdownMenu.Item>
            </>
          )}
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}
