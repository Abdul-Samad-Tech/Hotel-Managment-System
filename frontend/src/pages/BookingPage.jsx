import { useSearchParams } from "react-router-dom";
import { BookingBar } from "../components/home/BookingBar";
import { PageBanner } from "../components/layout/PageBanner";
import { heroCopy, roomTypes } from "../data/site";

export function BookingPage() {
  const [params] = useSearchParams();
  const requested = params.get("room");
  const initialRoomType = roomTypes.includes(requested) ? requested : undefined;

  return (
    <main className="bg-cream">
      <PageBanner
        eyebrow="Reservations"
        title="Check"
        accent="availability"
        text="Choose dates, guests and a room type. Signed-in guests can hold a room. The front desk can do the same from the hotel portal."
        image={heroCopy.image}
      />
      <section className="page-wrap py-10">
        <BookingBar overlap={false} initialRoomType={initialRoomType} allowReserve />
      </section>
    </main>
  );
}
