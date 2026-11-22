import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { PageTransition } from "../motion/PageTransition";
import { Breadcrumbs } from "./Breadcrumbs";
import { Footer } from "./Footer";
import { Navbar } from "./Navbar";
import { BackToTop, BookNowBar, CookieCard } from "./SiteChrome";
import { StickyMiniBar } from "../booking/StickyMiniBar";
import { CompareTray } from "../compare/CompareTray";
import { QuizHost } from "../quiz/QuizHost";
import { usePastHero } from "../booking/use-past-hero";
import { useCompareIds } from "../../store/compare.store";

export function PublicLayout() {
  const { pathname, hash } = useLocation();
  const isDesk = /^\/(guest|staff|admin|portal)(\/|$)/.test(pathname);
  const pastHero = usePastHero();
  const compareIds = useCompareIds();
  const showCompareDock = !isDesk && (compareIds.length > 0 || pathname === "/rooms");

  useEffect(() => {
    if (/^#[A-Za-z0-9_-]+$/.test(hash)) {
      const target = document.querySelector(hash);
      if (target) {
        target.scrollIntoView({ block: "center" });
        return;
      }
    }
    window.scrollTo(0, 0);
  }, [pathname, hash]);

  return (
    <>
      <a
        href="#content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-[90] focus:rounded-full focus:bg-gold focus:px-4 focus:py-2 focus:text-navy"
      >
        Skip to content
      </a>
      {/* Desk: no public nav. After hero scroll, StickyMiniBar owns the top bar. */}
      {!isDesk && !pastHero && <Navbar />}
      <div className={isDesk ? "" : showCompareDock ? "pb-40 lg:pb-28" : "pb-20 lg:pb-0"}>
        <div id="content" className="relative">
          {!isDesk && <Breadcrumbs />}
          <PageTransition />
        </div>
        {!isDesk && <Footer />}
      </div>
      {!isDesk && (
        <>
          <CookieCard />
          <StickyMiniBar past={pastHero} />
          <CompareTray pastHero={pastHero} />
          <QuizHost />
          <BookNowBar pastHero={pastHero} />
          <BackToTop />
        </>
      )}
    </>
  );
}
