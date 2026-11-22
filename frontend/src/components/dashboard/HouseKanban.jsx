import { DndContext, PointerSensor, closestCorners, useDraggable, useDroppable, useSensor, useSensors } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import { GripVertical } from "lucide-react";
import { EmptyState } from "../ui/EmptyState";
import { ErrorState } from "../ui/ErrorState";
import { Skeleton } from "../ui/Skeleton";

const columns = [
  { id: "assigned", label: "Assigned" },
  { id: "in_progress", label: "In progress" },
  { id: "blocked", label: "Blocked" },
  { id: "completed", label: "Done" },
];

export function HouseKanban({ tasks, loading, fault, canUpdate, canAssign, staff, onMove, onAssign }) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  if (loading) {
    return (
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4" aria-busy="true">
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }
  if (fault) return <ErrorState title="Tasks could not load" text={fault} />;
  if (!tasks.length) {
    return <EmptyState title="No cleaning tasks yet." text="Check-out turn-downs and guest room-care requests appear here." />;
  }

  return (
    <div>
      {!canUpdate && <p className="mb-3 text-xs text-muted">The desk can see the board. Housekeeping moves a card.</p>}
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragEnd={(event) => {
          const next = event.over?.id;
          const task = tasks.find((item) => item.id === event.active.id);
          if (!canUpdate || !task || !next || next === task.status || task.status === "completed") return;
          onMove(task.id, String(next));
        }}
      >
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {columns.map((column) => (
            <Column
              key={column.id}
              column={column}
              tasks={tasks.filter((task) => task.status === column.id)}
              canUpdate={canUpdate}
              canAssign={canAssign}
              staff={staff}
              onAssign={onAssign}
              onMove={onMove}
            />
          ))}
        </div>
      </DndContext>
    </div>
  );
}

function Column({ column, tasks, canUpdate, canAssign, staff, onAssign, onMove }) {
  const { setNodeRef, isOver } = useDroppable({ id: column.id });
  return (
    <section ref={setNodeRef} className={`min-h-48 rounded-2xl bg-[#faf8f4] p-3 ${isOver ? "ring-2 ring-gold" : ""}`}>
      <h3 className="text-[11px] font-medium uppercase tracking-[0.16em] text-gold">
        {column.label} · {tasks.length}
      </h3>
      <ul className="mt-3 grid gap-2">
        {tasks.map((task) => (
          <TaskCard key={task.id} task={task} canUpdate={canUpdate} canAssign={canAssign} staff={staff} onAssign={onAssign} onMove={onMove} />
        ))}
      </ul>
    </section>
  );
}

function TaskCard({ task, canUpdate, canAssign, staff, onAssign, onMove }) {
  const locked = !canUpdate || task.status === "completed";
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({ id: task.id, disabled: locked });
  const style = {
    transform: CSS.Translate.toString(transform),
    opacity: isDragging ? 0.65 : 1,
  };

  return (
    <li ref={setNodeRef} style={style} className="rounded-xl border border-navy/8 bg-white p-3 text-sm">
      <div className="flex items-start gap-2">
        {!locked && (
          <button type="button" className="mt-0.5 grid h-11 w-11 shrink-0 cursor-grab place-items-center rounded-full hover:bg-gold/30 focus-visible:outline-2 focus-visible:outline-gold" aria-label={`Drag room ${task.roomNumber}`} {...listeners} {...attributes}>
            <GripVertical className="h-4 w-4" />
          </button>
        )}
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-1.5">
            <p className="font-medium text-navy">Room {task.roomNumber}</p>
            <SourceBadge source={task.source} type={task.type} />
          </div>
          <p className="text-muted">
            {task.typeLabel || task.type}
            {task.assignedTo ? ` · ${task.assignedTo}` : ""}
          </p>
          {task.notes ? <p className="mt-1 text-xs text-muted">{task.notes}</p> : null}
        </div>
      </div>
      {canUpdate && task.status !== "completed" && (
        <label className="mt-2 block text-xs text-muted">
          Move to
          <select
            className="bay-field mt-1 w-full px-3"
            value=""
            onChange={(event) => {
              if (event.target.value) onMove(task.id, event.target.value);
            }}
          >
            <option value="">Choose a column</option>
            {columns
              .filter((column) => column.id !== task.status)
              .map((column) => (
                <option key={column.id} value={column.id}>
                  {column.label}
                </option>
              ))}
          </select>
        </label>
      )}
      {canAssign && staff.length > 0 && task.status !== "completed" && (
        <select
          className="bay-field mt-2 w-full px-3"
          aria-label={`Assign room ${task.roomNumber}`}
          value={task.assignedToId || ""}
          onChange={(event) => onAssign(task.id, event.target.value)}
        >
          <option value="">Assign</option>
          {staff.map((person) => (
            <option key={person._id} value={person._id}>
              {person.fullName}
            </option>
          ))}
        </select>
      )}
    </li>
  );
}

function SourceBadge({ source, type }) {
  if (type === "dnd") {
    return (
      <span className="rounded-full bg-navy/10 px-2 py-0.5 text-[10px] font-semibold tracking-wide text-navy uppercase">
        DND
      </span>
    );
  }
  if (source === "guest" || type === "guest_makeup") {
    return (
      <span className="rounded-full bg-gold/35 px-2 py-0.5 text-[10px] font-semibold tracking-wide text-navy uppercase">
        Guest
      </span>
    );
  }
  if (source === "checkout" || type === "checkout-clean") {
    return (
      <span className="rounded-full border border-navy/15 px-2 py-0.5 text-[10px] font-semibold tracking-wide text-muted uppercase">
        Check-out
      </span>
    );
  }
  return null;
}
