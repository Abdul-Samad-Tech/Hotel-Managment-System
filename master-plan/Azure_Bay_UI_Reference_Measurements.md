# Azure Bay Hotel & Resort - Reference UI Measurement Sheet

## Reference image
- Supplied reference size: **1024 x 1536 px**.
- Treat this image as the desktop visual baseline.
- The bands below are **implementation estimates read from the screenshot**, not guaranteed source design coordinates. Calibrate in-browser by screenshot comparison before release.

## Vertical composition estimate
| Band | Approx. Y range | Purpose |
|---|---:|---|
| Header | 0-64 | Logo + primary navigation + utility controls + Book Now |
| Hero | 0-450 | Ocean/pool background, editorial copy, weather card, slide rail |
| Booking bar overlap | 390-475 | Glass availability/search control |
| Feature strip | 475-655 | Six benefit tiles |
| Rooms section | 655-915 | Intro + four room cards |
| Experience section | 915-1175 | Dark image band + experience cards |
| Testimonials | 1175-1340 | Guest review cards |
| Final booking CTA | 1340-1450 | Sunset CTA strip |
| Footer | 1450-1536 | Logo, nav, social, legal |

## Horizontal composition estimate
- Global desktop content width is close to **900-920 px** inside the 1024 px reference canvas.
- Header uses a left logo block, centered navigation, and right utility/booking controls.
- Hero text occupies roughly the left **42-46%** of the content area.
- Weather card occupies the upper-right hero area.
- Booking bar uses a single row with five logical areas: Check In, Check Out, Guests, Room Type, Check Availability.
- Feature strip is six roughly equal columns separated by thin vertical rules.
- Rooms section uses a narrow editorial intro column and a wide four-card row.
- Experience section uses a large left/center feature image and two smaller right-side cards.
- Testimonials use a narrow intro column followed by three cards.

## Image treatment
- Hero: full-bleed ocean/resort image, dark left readability gradient.
- Room cards: 16:10-ish image crop, rounded top corners.
- Experience cards: wide cinematic crops with dark bottom overlays.
- Final CTA: full-width sunset/ocean image with dark overlay.
- Use responsive `picture`/`srcset` assets in production to reduce transfer size.

## Interaction behaviors visible in the reference
- Header active-link underline under Home.
- Book Now and Check Availability are emphasized gold CTAs.
- Hero includes secondary video CTA with circular play icon.
- Hero has vertical slide indicator on the right.
- Rooms include horizontal carousel arrows and a `01 / 04` counter.
- Room cards include a small circular arrow action.
- Testimonials include navigation arrows.
- Experience cards include circular arrow controls.

## Screenshot-lock procedure
1. Render the homepage at **1024 x 1536 CSS pixels**.
2. Match section boundaries before tuning typography.
3. Match hero image crop and overlay.
4. Match headline line breaks and CTA widths.
5. Match booking-bar height/radius/blur.
6. Match card widths, gaps, photo crop and price baselines.
7. Match footer height and alignment.
8. Repeat after any major CSS refactor.
