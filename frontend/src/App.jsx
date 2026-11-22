import { lazy, Suspense } from "react";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { PublicLayout } from "./components/layout/PublicLayout";
import { CustomCursor } from "./components/motion/CustomCursor";
import { BayToaster } from "./components/ui/BayToaster";
import { Preloader } from "./components/motion/Preloader";
import { RouteWipe } from "./components/motion/PageTransition";
import { SmoothScroll } from "./components/motion/SmoothScroll";
import { AuthProvider } from "./context/AuthContext";
import { LocaleProvider } from "./context/LocaleContext";
import { AuthPage } from "./pages/AuthPage";
import { BookingFlowPage } from "./pages/BookingFlowPage";
import { BookingPage } from "./pages/BookingPage";
import { MyBookingsPage } from "./pages/MyBookingsPage";
import { MessagesPage } from "./pages/MessagesPage";
import { ContactPage } from "./pages/ContactPage";
import { DiningPage } from "./pages/DiningPage";
import { ExperiencesPage } from "./pages/ExperiencesPage";
import { GalleryPage } from "./pages/GalleryPage";
import { HomePage } from "./pages/HomePage";
import { LegalPage } from "./pages/LegalPage";
import { NotFoundPage } from "./pages/NotFoundPage";
import { LocationPage } from "./pages/LocationPage";
import { RoomDetailPage } from "./pages/RoomDetailPage";
import { RoomsPage } from "./pages/RoomsPage";
import { Skeleton } from "./components/ui/Skeleton";

const PortalPage = lazy(() => import("./pages/PortalPage.jsx").then((module) => ({ default: module.PortalPage })));
const RoleGate = lazy(() => import("./pages/RoleGate.jsx").then((module) => ({ default: module.RoleGate })));

const UiKitPage = import.meta.env.DEV ? lazy(() => import("./pages/UiKitPage.jsx").then((module) => ({ default: module.UiKitPage }))) : null;

export default function App() {
  return (
    <BrowserRouter>
      <Preloader />
      <RouteWipe />
      <CustomCursor />
      <BayToaster />
      <LocaleProvider>
      <AuthProvider>
      <SmoothScroll>
      <Suspense fallback={<div className="min-h-screen bg-cream px-5 pt-24" aria-busy="true"><Skeleton className="h-40 w-full" /></div>}>
      <Routes>
        {UiKitPage ? <Route path="ui-kit" element={<Suspense fallback={null}><UiKitPage /></Suspense>} /> : null}
        <Route path="auth" element={<AuthPage />} />
        <Route path="login" element={<AuthPage />} />
        <Route path="register" element={<AuthPage />} />
        <Route element={<PublicLayout />}>
          <Route index element={<HomePage />} />
          <Route path="rooms" element={<RoomsPage />} />
          <Route path="rooms/:slug" element={<RoomDetailPage />} />
          <Route path="dining" element={<DiningPage />} />
          <Route path="experiences" element={<ExperiencesPage />} />
          <Route path="gallery" element={<GalleryPage />} />
          <Route path="location" element={<LocationPage />} />
          <Route path="contact" element={<ContactPage />} />
          <Route path="booking" element={<BookingPage />} />
          <Route path="booking/:roomId" element={<BookingFlowPage />} />
          <Route path="my-bookings" element={<MyBookingsPage />} />
          <Route path="messages" element={<MessagesPage />} />
          <Route path="portal" element={<PortalPage />} />
          <Route path="guest/*" element={<RoleGate allow={["guest"]} />} />
          <Route path="staff/*" element={<RoleGate allow={["receptionist", "housekeeping", "maintenance", "manager", "admin"]} />} />
          <Route path="admin/*" element={<RoleGate allow={["admin", "manager"]} />} />
          <Route path=":page" element={<LegalPage />} />
          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Routes>
      </Suspense>
      </SmoothScroll>
      </AuthProvider>
      </LocaleProvider>
    </BrowserRouter>
  );
}
