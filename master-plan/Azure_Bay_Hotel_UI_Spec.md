# Azure Bay Hotel & Resort - UI / UX Implementation Specification

## 1. Reference contract
The attached image is the visual source of truth for the **public home page**. The implementation should match its section order, hierarchy, proportions, copy, imagery direction, spacing, typography scale, controls, and visual language. Functional pages may reuse the same design system without changing the home-page composition.

## 2. Page composition (top to bottom)
1. **Transparent hero header** over the hero image.
2. **Hero / above-the-fold:** Azure Bay logo, navigation, search/menu controls, Book Now CTA, eyebrow text, headline, body copy, primary/secondary CTAs, weather/location glass card, decorative "Good Vibes Only" treatment, slide indicators.
3. **Floating booking bar:** Check In, Check Out, Guests, Room Type, Check Availability.
4. **Six feature/value tiles:** Beachfront Location, Luxury Rooms & Suites, World-Class Dining, Spa & Wellness, Infinity Pool, 24/7 Concierge.
5. **Rooms showcase:** introductory text on the left; four room cards on the right with photo, badge, guest count, bed type, price, arrow CTA, carousel controls.
6. **Experience by the Sea:** dark image-led band with intro copy, four service icons, CTA, large Ocean View Dining card, plus Infinity Pool and Spa & Wellness cards.
7. **Guest testimonials:** intro column plus three testimonial cards with avatar, quote, name, location and star rating.
8. **Booking CTA strip:** sunset ocean background, title, supporting text, Check Availability CTA, video-tour control and decorative handwritten note.
9. **Footer:** logo, compact nav, social icons, copyright, Privacy, Terms, Support.

## 3. Design tokens (starting values)
Treat these as implementation tokens and tune by screenshot comparison at 1024px wide before finalizing.

```css
:root {
  --navy-950: #071b2b;
  --navy-900: #0b263a;
  --navy-800: #12354c;
  --sand-50: #fbfaf7;
  --sand-100: #f2ede4;
  --gold-400: #f2bf69;
  --gold-300: #f7d08a;
  --text-dark: #0a2233;
  --text-soft: #6f7c87;
  --white: #ffffff;
  --glass: rgba(16, 35, 53, 0.48);
  --border-soft: rgba(255,255,255,.18);
  --radius-lg: 18px;
  --radius-md: 14px;
  --shadow-soft: 0 16px 40px rgba(7,27,43,.10);
}
```

## 4. Typography direction
Use a premium serif for the large editorial headlines and a clean sans-serif for UI/body copy. The reference uses strong contrast: large high-contrast serif headline, small uppercase eyebrow, compact sans-serif navigation and metadata.

Recommended pairing for a web build: **Playfair Display / Cormorant Garamond** for display + **Inter / Manrope** for UI. Use locally hosted or licensed fonts where required.

## 5. Component map
```text
<HomePage>
  <Header />
  <Hero />
    <HeroCopy />
    <HeroWeatherCard />
    <HeroSlideRail />
  <BookingSearchBar />
  <FeatureStrip />
  <RoomsSection>
    <RoomsIntro />
    <RoomCarousel />
  </RoomsSection>
  <ExperiencesSection />
  <TestimonialsSection />
  <BookingCta />
  <Footer />
</HomePage>
```

## 6. Responsive behavior
**Desktop >= 1200px:** full composition as reference; four room cards visible.

**Tablet 768-1199px:** compress header gaps; booking bar wraps into two rows; rooms become 2-column grid; experience cards maintain large featured image.

**Mobile <= 767px:** hamburger navigation; hero copy remains left-aligned; booking bar becomes vertical card; feature strip becomes horizontal scroll; room cards become single-column/peek carousel; experience grid stacks; testimonials scroll horizontally; footer stacks.

The mobile layout should preserve the reference's visual identity rather than simply shrinking desktop elements.

## 7. Pixel-matching checklist
- Keep the hero image position locked; use `background-position`/`object-position` to retain the sunset + pool composition.
- Match the top logo area height and nav spacing first, then hero headline line breaks.
- Preserve the floating booking bar's glass effect, blur, radius, and shadow.
- Match card corner radius, image crop, badge location, price alignment and arrow-button size.
- Use consistent 8px spacing increments, with larger section gutters around 64-96px on desktop.
- Test at the reference screenshot dimensions before making responsive adjustments.
- Prefer CSS overlays/gradients over editing the source image to reproduce dark readability zones.

## 8. Accessibility acceptance
- All controls keyboard reachable.
- Form labels and error messages programmatically associated.
- Meaningful alt text for room/experience images.
- Color contrast checked for text on photos and glass cards.
- Reduced-motion support for carousels/background effects.
- Focus states visible.

## 9. Public routes
`/`, `/rooms`, `/rooms/:slug`, `/dining`, `/experiences`, `/gallery`, `/location`, `/contact`, `/booking`, `/login`, `/register`, `/guest/*`, `/staff/*`, `/admin/*`.

## 10. Screenshot validation workflow
1. Build HomePage from tokens/components.
2. Render at 1024x1536.
3. Compare each major section top and bottom boundaries.
4. Tune typography line breaks, paddings, image crop and card sizes.
5. Re-test at 1440x900, 1280x800, 1024x1366, 768x1024, 390x844.
6. Freeze the home-page visual baseline before implementing secondary pages.
