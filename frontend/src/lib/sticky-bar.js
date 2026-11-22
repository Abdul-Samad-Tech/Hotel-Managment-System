export function onBookingPath(pathname) {
  return pathname === "/booking" || pathname.startsWith("/booking/");
}

export function onDeskPath(pathname) {
  return /^\/(guest|staff|admin|portal)(\/|$)/.test(pathname);
}

export function onAuthPath(pathname) {
  return pathname === "/auth" || pathname === "/login" || pathname === "/register";
}

export function showSearchChip(pathname) {
  return pathname !== "/" && !onBookingPath(pathname) && !onDeskPath(pathname) && !onAuthPath(pathname);
}

export function shouldHideBookNow(pathname, pastHero) {
  return stickyStayVisible(pathname, pastHero) || onBookingPath(pathname) || onDeskPath(pathname);
}

export function stickyStayVisible(pathname, past) {
  return past && !onBookingPath(pathname) && !onDeskPath(pathname) && !onAuthPath(pathname);
}
