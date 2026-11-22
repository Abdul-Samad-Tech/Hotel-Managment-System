import { cva } from "class-variance-authority";
import { cn } from "../../lib/cn";

const skeleton = cva("tide-skeleton block bg-[#efe8dc]", {
  variants: {
    shape: {
      line: "h-3 rounded-full",
      block: "rounded-2xl",
      circle: "rounded-full",
    },
  },
  defaultVariants: { shape: "block" },
});

export function Skeleton({ shape = "block", className = "" }) {
  return <span aria-hidden="true" className={cn(skeleton({ shape }), className)} />;
}

export function SkeletonSet({ label, className = "", children }) {
  return (
    <div aria-busy="true" aria-label={label} className={className}>
      {children}
    </div>
  );
}

export function RoomCardSkeleton({ className = "" }) {
  return (
    <div className={cn("overflow-hidden rounded-2xl bg-white shadow-[0_16px_40px_rgba(7,27,43,0.06)]", className)}>
      <Skeleton className="aspect-[4/3] w-full rounded-none" />
      <div className="p-4">
        <Skeleton shape="line" className="w-2/3" />
        <Skeleton shape="line" className="mt-3 w-1/2" />
        <div className="mt-4 flex items-center justify-between gap-3">
          <Skeleton shape="line" className="w-24" />
          <Skeleton shape="circle" className="h-8 w-8" />
        </div>
      </div>
    </div>
  );
}

export function TestimonialSkeleton({ className = "" }) {
  return (
    <div className={cn("rounded-2xl bg-cream p-5", className)}>
      <div className="flex gap-1">
        <Skeleton shape="circle" className="h-3 w-3" />
        <Skeleton shape="circle" className="h-3 w-3" />
        <Skeleton shape="circle" className="h-3 w-3" />
        <Skeleton shape="circle" className="h-3 w-3" />
        <Skeleton shape="circle" className="h-3 w-3" />
      </div>
      <Skeleton shape="line" className="mt-4 w-full" />
      <Skeleton shape="line" className="mt-2 w-5/6" />
      <Skeleton shape="line" className="mt-2 w-2/3" />
      <Skeleton shape="line" className="mt-5 w-1/3" />
    </div>
  );
}

export function GalleryTileSkeleton({ tall = false, className = "" }) {
  return (
    <Skeleton
      className={cn("w-full rounded-2xl", tall ? "aspect-[3/4]" : "aspect-[4/3]", className)}
    />
  );
}

export function TableRowSkeleton({ columns = 4, className = "" }) {
  return (
    <div
      className={cn("grid items-center gap-3 rounded-xl bg-white px-4 py-3", className)}
      style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
    >
      {Array.from({ length: columns }, (_, index) => (
        <Skeleton key={`col-${index}`} shape="line" className="w-full" />
      ))}
    </div>
  );
}
