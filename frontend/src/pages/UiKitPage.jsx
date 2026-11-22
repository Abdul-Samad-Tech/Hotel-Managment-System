import { ArrowRight } from "lucide-react";
import { useState } from "react";
import { Accordion } from "../components/ui/Accordion";
import { Badge } from "../components/ui/Badge";
import { Button } from "../components/ui/Button";
import { Card } from "../components/ui/Card";
import { Dialog } from "../components/ui/Dialog";
import { Drawer } from "../components/ui/Drawer";
import { EmptyState } from "../components/ui/EmptyState";
import { Input } from "../components/ui/Input";
import { Select } from "../components/ui/Select";
import { Sheet } from "../components/ui/Sheet";
import { Skeleton, RoomCardSkeleton, TestimonialSkeleton, GalleryTileSkeleton, TableRowSkeleton } from "../components/ui/Skeleton";
import { Tabs } from "../components/ui/Tabs";
import { notify } from "../components/ui/Toaster";
import { Tooltip } from "../components/ui/Tooltip";
import { ProposedHomeSections } from "../components/home/ProposedSections";

const rooms = [
  { value: "deluxe", label: "Deluxe sea view" },
  { value: "suite", label: "Ocean suite" },
  { value: "family", label: "Family suite" },
];

export function UiKitPage() {
  const [tab, setTab] = useState("stay");
  const [room, setRoom] = useState("deluxe");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [sheetOpen, setSheetOpen] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);

  return (
    <main className="min-h-svh bg-cream px-4 py-10 text-navy">
      <div className="page-wrap grid gap-8">
        <header>
          <p className="text-[11px] font-medium tracking-[0.22em] text-gold uppercase">Dev only</p>
          <h1 className="mt-2 font-display text-4xl">UI kit</h1>
          <p className="mt-2 max-w-xl text-sm leading-6 text-muted">Navy, cream, and gold. Radius 12–16px. This page is not part of the resort.</p>
        </header>

        <section className="grid gap-3">
          <h2 className="font-display text-2xl">Button</h2>
          <div className="flex flex-wrap items-center gap-3">
            <Button variant="gold">Gold pill</Button>
            <Button variant="navy">Navy pill</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="circle" aria-label="Next">
              <ArrowRight className="h-4 w-4" />
            </Button>
            <Button variant="gold" disabled>
              Disabled
            </Button>
          </div>
        </section>

        <section className="grid gap-3">
          <h2 className="font-display text-2xl">Badge</h2>
          <div className="flex flex-wrap gap-2">
            <Badge>Signature</Badge>
            <Badge tone="navy">Suite</Badge>
            <Badge tone="outline">Open</Badge>
          </div>
        </section>

        <section className="grid gap-3">
          <h2 className="font-display text-2xl">Card</h2>
          <Card title="Ocean suite">
            <p className="text-sm leading-6 text-muted">A quiet room above the lagoon, with the same shadow used on the resort cards.</p>
          </Card>
        </section>

        <section className="grid max-w-md gap-3">
          <h2 className="font-display text-2xl">Input</h2>
          <Input id="kit-name" label="Guest name" />
        </section>

        <section className="grid max-w-md gap-3">
          <h2 className="font-display text-2xl">Select</h2>
          <Select id="kit-room" label="Room" value={room} onValueChange={setRoom} options={rooms} />
        </section>

        <section className="grid gap-3">
          <h2 className="font-display text-2xl">Dialog, sheet, drawer, tooltip</h2>
          <div className="flex flex-wrap gap-3">
            <Button variant="navy" onClick={() => setDialogOpen(true)}>Open dialog</Button>
            <Button variant="outline" onClick={() => setSheetOpen(true)}>Open sheet</Button>
            <Button variant="outline" onClick={() => setDrawerOpen(true)}>Open drawer</Button>
            <Tooltip label="Gold focus, navy tip">
              <Button variant="gold">Hover tip</Button>
            </Tooltip>
          </div>
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen} title="Reserve a stay" description="Dates, guests, and the room stay on the booking bar.">
            <p className="text-sm text-muted">Close with Escape or the round button.</p>
          </Dialog>
          <Sheet open={sheetOpen} onOpenChange={setSheetOpen} title="Room notes">
            <p className="text-sm text-muted">A side panel for longer notes.</p>
          </Sheet>
          <Drawer open={drawerOpen} onOpenChange={setDrawerOpen} title="Arrival">
            <p className="text-sm text-muted">The boat leaves from Velana.</p>
          </Drawer>
        </section>

        <section className="grid gap-3">
          <h2 className="font-display text-2xl">Tabs</h2>
          <Tabs
            value={tab}
            onValueChange={setTab}
            items={[
              { value: "stay", label: "Stay" },
              { value: "dine", label: "Dine" },
              { value: "spa", label: "Spa" },
            ]}
          />
          <p className="text-sm text-muted">{tab === "stay" ? "Rooms and the lagoon." : tab === "dine" ? "Lanterns on the terrace." : "A quiet hour."}</p>
        </section>

        <section className="grid max-w-lg gap-3">
          <h2 className="font-display text-2xl">Accordion</h2>
          <Accordion
            items={[
              { value: "boat", title: "The boat", body: "About forty minutes from the airport." },
              { value: "desk", title: "The desk", body: "The desk confirms the transfer with the room." },
            ]}
          />
        </section>

        <section className="grid max-w-lg gap-3">
          <h2 className="font-display text-2xl">Skeleton</h2>
          <Skeleton className="h-24 w-full" />
          <Skeleton shape="line" className="w-2/3" />
          <RoomCardSkeleton />
          <TestimonialSkeleton />
          <GalleryTileSkeleton />
          <TableRowSkeleton columns={3} />
        </section>

        <section className="grid max-w-lg gap-3">
          <h2 className="font-display text-2xl">Empty state</h2>
          <EmptyState title="No stays yet." text="Reserve one from the booking page." />
        </section>

        <section className="grid gap-3">
          <h2 className="font-display text-2xl">Toast</h2>
          <Button variant="gold" onClick={() => notify("The desk has your note.")}>Show toast</Button>
        </section>
        <ProposedHomeSections />
      </div>
    </main>
  );
}
