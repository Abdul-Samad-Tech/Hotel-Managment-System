import * as DropdownMenu from "@radix-ui/react-dropdown-menu";
import { flexRender, getCoreRowModel, getFilteredRowModel, getPaginationRowModel, getSortedRowModel, useReactTable } from "@tanstack/react-table";
import { MoreHorizontal } from "lucide-react";
import { useCallback, useMemo, useState } from "react";
import { EmptyState } from "../ui/EmptyState";
import { ErrorState } from "../ui/ErrorState";
import { Sheet } from "../ui/Sheet";
import { TableRowSkeleton } from "../ui/Skeleton";
import { MoveDatesForm } from "./MoveDatesForm";

const statuses = ["all", "pending", "confirmed", "checked_in", "checked_out", "cancelled", "no_show"];

const statusWord = {
  pending: "Pending",
  confirmed: "Confirmed",
  checked_in: "In house",
  checked_out: "Departed",
  cancelled: "Cancelled",
  no_show: "No-show",
};

function GuestName({ name }) {
  const [origin, setOrigin] = useState("left");

  return (
    <span
      className="group/guest relative inline-block max-w-[14rem] font-display text-[1.35rem] leading-none text-navy"
      onMouseEnter={(event) => {
        const box = event.currentTarget.getBoundingClientRect();
        setOrigin(event.clientX > box.left + box.width / 2 ? "right" : "left");
      }}
    >
      {name || "Guest"}
      <span
        aria-hidden="true"
        className="absolute -bottom-1 left-0 h-px w-full origin-left scale-x-0 bg-gold transition-transform duration-[480ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover/guest:scale-x-100 motion-reduce:transition-none"
        style={{ transformOrigin: origin }}
      />
    </span>
  );
}

/**
 * Front-desk reservations table.
 * Row ⋮ menu: Details (sheet), Check in / No-show (confirmed), Check out (in house), Invoice.
 */
export function BookingsTable({ rows, loading, fault, query, onCheckIn, onCheckOut, onNoShow, onMoveDates, onInvoice, onBulk, onNote }) {
  const [sorting, setSorting] = useState([{ id: "checkIn", desc: false }]);
  const [status, setStatus] = useState("all");
  const [rowSelection, setRowSelection] = useState({});
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 8 });
  const [detail, setDetail] = useState(null);

  const openDetail = useCallback((row) => {
    setDetail(row);
  }, []);

  const columns = useMemo(
    () => [
      {
        id: "select",
        header: ({ table }) => (
          <input
            type="checkbox"
            className="size-5 accent-navy"
            aria-label="Select stays on this page"
            checked={table.getIsAllPageRowsSelected()}
            onChange={table.getToggleAllPageRowsSelectedHandler()}
          />
        ),
        cell: ({ row }) => (
          <input
            type="checkbox"
            className="size-5 accent-navy"
            aria-label={`Select ${row.original.confirmationCode}`}
            checked={row.getIsSelected()}
            onChange={row.getToggleSelectedHandler()}
          />
        ),
      },
      {
        accessorKey: "guest",
        header: "Guest",
        cell: ({ getValue }) => <GuestName name={getValue()} />,
      },
      { accessorKey: "confirmationCode", header: "Code" },
      { accessorKey: "roomNumber", header: "Room" },
      { accessorKey: "checkIn", header: "Check in" },
      { accessorKey: "checkOut", header: "Check out" },
      {
        accessorKey: "status",
        header: "Status",
        filterFn: (row, columnId, value) => row.getValue(columnId) === value,
        cell: ({ getValue }) => <span className="text-navy">{statusWord[getValue()] || getValue()}</span>,
      },
      {
        accessorKey: "totalAmount",
        header: "Total",
        cell: ({ getValue }) => `$${getValue()}`,
      },
      {
        id: "actions",
        header: "Actions",
        enableSorting: false,
        cell: ({ row }) => (
          <RowMenu
            row={row.original}
            onOpen={() => openDetail(row.original)}
            onCheckIn={() => onCheckIn?.(row.original.id)}
            onCheckOut={() => onCheckOut?.(row.original.id)}
            onNoShow={() => onNoShow?.(row.original.id)}
            onInvoice={() => onInvoice?.(row.original.id)}
          />
        ),
      },
    ],
    [openDetail, onCheckIn, onCheckOut, onNoShow, onInvoice],
  );

  const columnFilters = useMemo(
    () => (status === "all" ? [] : [{ id: "status", value: status }]),
    [status],
  );

  const table = useReactTable({
    data: rows,
    columns,
    state: {
      sorting,
      rowSelection,
      pagination,
      columnFilters,
    },
    onSortingChange: setSorting,
    onRowSelectionChange: setRowSelection,
    onPaginationChange: setPagination,
    getRowId: (row) => String(row.id),
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    enableRowSelection: true,
  });

  const selected = table.getSelectedRowModel().rows.map((row) => row.original);
  const pageCount = table.getPageCount();

  if (loading) {
    return (
      <div className="grid gap-2" aria-busy="true" aria-label="Loading reservations">
        <TableRowSkeleton columns={5} />
        <TableRowSkeleton columns={5} />
        <TableRowSkeleton columns={5} />
        <TableRowSkeleton columns={5} />
      </div>
    );
  }
  if (fault) return <ErrorState title="Reservations could not load" text={fault} />;

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3 rounded-2xl border border-navy/10 bg-white px-4 py-3 shadow-[0_10px_24px_rgba(7,27,43,0.04)]">
        <label className="text-sm text-navy">
          <span className="mb-1.5 block text-[11px] font-medium tracking-[0.14em] text-muted uppercase">Filter status</span>
          <select
            className="bay-field min-w-[12rem] px-3"
            value={status}
            onChange={(event) => {
              setStatus(event.target.value);
              setPagination((current) => ({ ...current, pageIndex: 0 }));
            }}
          >
            {statuses.map((item) => (
              <option key={item} value={item}>
                {item === "all" ? "All statuses" : statusWord[item]}
              </option>
            ))}
          </select>
        </label>
        <div className="flex flex-wrap items-center gap-2">
          {selected.length ? (
            <span className="text-xs font-semibold text-navy">{selected.length} selected</span>
          ) : (
            <span className="text-xs text-muted">Select rows for bulk actions</span>
          )}
          <button
            type="button"
            className="h-11 cursor-pointer rounded-full border border-navy/15 bg-white px-4 text-sm font-semibold text-navy hover:border-gold focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold disabled:cursor-not-allowed disabled:opacity-40"
            disabled={!selected.length}
            onClick={() => onBulk?.(selected, "copy")}
          >
            Copy codes
          </button>
          <button
            type="button"
            className="h-11 cursor-pointer rounded-full bg-navy px-4 text-sm font-semibold text-white hover:bg-[#16324a] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold disabled:cursor-not-allowed disabled:opacity-40"
            disabled={!selected.length || selected.some((row) => row.status !== "confirmed")}
            onClick={() => onBulk?.(selected, "check-in")}
          >
            Check in selected
          </button>
        </div>
      </div>
      {!rows.length ? (
        <EmptyState title={query ? "No reservation matches that search." : "No reservations on the desk."} />
      ) : !table.getRowModel().rows.length ? (
        <EmptyState title="No stay matches that status." />
      ) : (
        <div className="overflow-x-auto rounded-[22px] bg-white shadow-[0_18px_44px_rgba(7,27,43,0.06)]">
          <table className="w-full min-w-[760px] border-collapse text-left text-sm">
            <thead>
              {table.getHeaderGroups().map((group) => (
                <tr key={group.id} className="border-b border-navy/10">
                  {group.headers.map((header) => (
                    <th key={header.id} className="px-5 pt-6 pb-3 text-left align-bottom font-normal">
                      {header.column.getCanSort() ? (
                        <button
                          type="button"
                          className={`group/sort relative cursor-pointer pb-1 text-[11px] font-medium tracking-[0.16em] uppercase focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-gold ${header.column.getIsSorted() ? "text-navy" : "text-muted hover:text-navy"}`}
                          onClick={header.column.getToggleSortingHandler()}
                        >
                          {flexRender(header.column.columnDef.header, header.getContext())}
                          <span
                            aria-hidden="true"
                            className={`absolute right-0 -bottom-0.5 left-0 h-px origin-left bg-gold transition-transform duration-[480ms] ease-[cubic-bezier(0.22,1,0.36,1)] motion-reduce:transition-none ${header.column.getIsSorted() ? "scale-x-100" : "scale-x-0 group-hover/sort:scale-x-100 group-focus-visible/sort:scale-x-100"}`}
                          />
                          <span className="sr-only">{header.column.getIsSorted() === "asc" ? ", sorted ascending" : header.column.getIsSorted() === "desc" ? ", sorted descending" : ""}</span>
                        </button>
                      ) : (
                        <span className="text-[11px] font-medium tracking-[0.16em] text-muted uppercase">
                          {flexRender(header.column.columnDef.header, header.getContext())}
                        </span>
                      )}
                    </th>
                  ))}
                </tr>
              ))}
            </thead>
            <tbody>
              {table.getRowModel().rows.map((row) => (
                <tr key={row.id} className="border-b border-navy/[0.06] transition-colors duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] last:border-b-0 hover:bg-cream motion-reduce:transition-none">
                  {row.getVisibleCells().map((cell) => (
                    <td key={cell.id} className="px-5 py-5 align-middle text-navy/80">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {pageCount > 1 && (
        <div className="mt-6 flex items-center gap-4 text-sm text-muted">
          <button type="button" className="h-11 cursor-pointer rounded-full border border-navy/15 bg-white px-4 text-navy shadow-[0_10px_24px_rgba(7,27,43,0.05)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold disabled:opacity-40" disabled={!table.getCanPreviousPage()} onClick={() => table.previousPage()}>
            Previous
          </button>
          <span>
            Page {pagination.pageIndex + 1} of {pageCount}
          </span>
          <button type="button" className="h-11 cursor-pointer rounded-full border border-navy/15 bg-white px-4 text-navy shadow-[0_10px_24px_rgba(7,27,43,0.05)] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold disabled:opacity-40" disabled={!table.getCanNextPage()} onClick={() => table.nextPage()}>
            Next
          </button>
        </div>
      )}
      <Sheet open={Boolean(detail)} onOpenChange={(open) => !open && setDetail(null)} title={detail ? detail.confirmationCode : "Stay"}>
        {detail && (
          <div className="grid gap-5 text-sm">
            <div className="rounded-2xl bg-[#faf8f4] p-4">
              <p className="font-display text-3xl leading-none text-navy">{detail.guest || "Guest"}</p>
              <p className="mt-3 text-muted">
                Room {detail.roomNumber || "—"} · {statusWord[detail.status] || detail.status} · ${detail.totalAmount}
              </p>
              <p className="mt-2 text-navy/80">{detail.specialRequests || "No special requests."}</p>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                className="h-11 cursor-pointer rounded-full bg-navy px-4 text-sm font-semibold text-white"
                onClick={() => onInvoice?.(detail.id)}
              >
                Open invoice
              </button>
              <button
                type="button"
                className="h-11 cursor-pointer rounded-full border border-navy/15 px-4 text-sm font-semibold text-navy"
                onClick={() => {
                  navigator.clipboard.writeText(detail.confirmationCode).then(
                    () => onNote?.(`${detail.confirmationCode} copied.`),
                    () => onNote?.(detail.confirmationCode),
                  );
                }}
              >
                Copy code
              </button>
            </div>
            {detail.status === "confirmed" ? (
              <MoveDatesForm
                detail={detail}
                onMoveDates={async (id, checkIn, checkOut) => {
                  await onMoveDates?.(id, checkIn, checkOut);
                  setDetail(null);
                }}
              />
            ) : null}
          </div>
        )}
      </Sheet>
    </div>
  );
}

function RowMenu({ row, onOpen, onCheckIn, onCheckOut, onNoShow, onInvoice }) {
  return (
    <DropdownMenu.Root modal={false}>
      <DropdownMenu.Trigger
        type="button"
        className="grid h-11 w-11 cursor-pointer place-items-center rounded-full hover:bg-gold/30 focus-visible:outline-2 focus-visible:outline-gold"
        aria-label={`Actions for ${row.confirmationCode}`}
        onClick={(event) => event.stopPropagation()}
      >
        <MoreHorizontal className="h-4 w-4" />
      </DropdownMenu.Trigger>
      <DropdownMenu.Portal>
        <DropdownMenu.Content
          className="z-[90] min-w-44 rounded-2xl border border-navy/10 bg-cream p-1.5 text-sm text-navy shadow-[0_18px_44px_rgba(7,27,43,0.12)]"
          sideOffset={8}
          align="end"
          onCloseAutoFocus={(event) => event.preventDefault()}
        >
          <MenuItem onSelect={onOpen}>Details</MenuItem>
          {row.status === "confirmed" ? <MenuItem onSelect={onCheckIn}>Check in</MenuItem> : null}
          {row.status === "confirmed" ? <MenuItem onSelect={onNoShow}>No-show</MenuItem> : null}
          {row.status === "checked_in" ? <MenuItem onSelect={onCheckOut}>Check out</MenuItem> : null}
          <MenuItem onSelect={onInvoice}>Invoice</MenuItem>
        </DropdownMenu.Content>
      </DropdownMenu.Portal>
    </DropdownMenu.Root>
  );
}

function MenuItem({ children, onSelect }) {
  return (
    <DropdownMenu.Item
      className="flex min-h-11 cursor-pointer items-center rounded-lg px-3 outline-none data-[highlighted]:bg-gold/35"
      onSelect={() => {
        onSelect?.();
      }}
    >
      {children}
    </DropdownMenu.Item>
  );
}
