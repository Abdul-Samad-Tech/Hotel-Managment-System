import { useCallback, useState } from "react";
import { BookingBar } from "../components/home/BookingBar";
import { CtaBanner } from "../components/home/CtaBanner";
import { ExperiencesSection } from "../components/home/ExperiencesSection";
import { FeaturesStrip } from "../components/home/FeaturesStrip";
import { Hero } from "../components/home/Hero";
import { RoomsSection } from "../components/home/RoomsSection";
import { TestimonialsSection } from "../components/home/TestimonialsSection";
import { VideoModal } from "../components/home/VideoModal";
export function HomePage() {
  const [filmOpen, setFilmOpen] = useState(false);
  const closeFilm = useCallback(() => setFilmOpen(false), []);

  return (
    <>
      <main>
        <Hero onPlay={() => setFilmOpen(true)} />
        <BookingBar />
        <FeaturesStrip />
        <RoomsSection />
        <ExperiencesSection />
        <TestimonialsSection />
        <CtaBanner onPlay={() => setFilmOpen(true)} />
      </main>
      <VideoModal open={filmOpen} onClose={closeFilm} />
    </>
  );
}
