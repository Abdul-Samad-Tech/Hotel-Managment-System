import * as Dialog from "@radix-ui/react-dialog";
import { Command } from "cmdk";
import { Search } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { rooms } from "../../data/rooms";
import { faqs, navLinks } from "../../data/site";
import { SEARCH_EMPTY } from "../../lib/list-empty.constant";
import { QUIZ_COPY, QUIZ_EVENT } from "../../store/quiz.constant";
import { useQuizStore } from "../../store/quiz.store";
import { WISHLIST_COPY } from "../../store/wishlist.constant";
import { useWishlistStore } from "../../store/wishlistStore";
import { EmptyState } from "../ui/EmptyState";

const GROUP_HEADING =
  "[&_[cmdk-group-heading]]:px-3 [&_[cmdk-group-heading]]:py-2 [&_[cmdk-group-heading]]:text-[11px] [&_[cmdk-group-heading]]:font-medium [&_[cmdk-group-heading]]:tracking-[0.18em] [&_[cmdk-group-heading]]:text-gold [&_[cmdk-group-heading]]:uppercase";

export function ResortSearch({ open, onOpenChange }) {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const setQuizOpen = useQuizStore((state) => state.setOpen);
  const setWishlistOpen = useWishlistStore((state) => state.setPanelOpen);

  function close() {
    setQuery("");
    onOpenChange(false);
  }

  function go(path) {
    close();
    navigate(path);
  }

  function openQuiz() {
    close();
    setQuizOpen(true);
    window.dispatchEvent(new CustomEvent(QUIZ_EVENT));
  }

  function openWishlist() {
    close();
    setWishlistOpen(true);
  }

  function onInputKeyDown(event) {
    if (event.key !== "Enter" || !query.trim()) return;
    event.preventDefault();
    go(`/rooms?q=${encodeURIComponent(query.trim())}`);
  }

  return (
    <Dialog.Root open={open} onOpenChange={(next) => (next ? onOpenChange(true) : close())}>
      <Dialog.Portal>
        <Dialog.Overlay className="bay-scrim fixed inset-0 z-[70]" />
        <Dialog.Content aria-describedby={undefined} className="bay-modal fixed top-[12%] left-1/2 z-[80] w-[min(560px,calc(100%-1.5rem))] -translate-x-1/2 p-3">
          <Dialog.Title className="sr-only">Search the resort</Dialog.Title>
          <Command label="Search the resort" className="bg-transparent">
            <div className="relative">
              <Search className="pointer-events-none absolute top-1/2 left-3 h-4 w-4 -translate-y-1/2 text-navy/50" aria-hidden="true" />
              <Command.Input
                value={query}
                onValueChange={setQuery}
                onKeyDown={onInputKeyDown}
                placeholder="Search rooms, pages, questions"
                className="h-11 w-full rounded-full border border-navy/10 bg-white pr-4 pl-10 text-sm text-navy placeholder:text-navy/45 focus:outline-2 focus:outline-gold"
              />
            </div>
            <Command.List className="mt-3 max-h-72 overflow-y-auto">
              <Command.Empty className="p-1">
                <EmptyState title={SEARCH_EMPTY.title} text={SEARCH_EMPTY.text} />
              </Command.Empty>
              <Command.Group heading="Actions" className={GROUP_HEADING}>
                <Command.Item
                  value={`${QUIZ_COPY.cmdk} ${QUIZ_COPY.cmdkHint} quiz room match`}
                  onSelect={openQuiz}
                  className="flex min-h-11 cursor-pointer flex-col justify-center rounded-xl px-3 py-2 text-sm text-navy data-[selected=true]:bg-gold/40"
                >
                  <span>{QUIZ_COPY.cmdk}</span>
                  <span className="text-xs text-muted">{QUIZ_COPY.cmdkHint}</span>
                </Command.Item>
                <Command.Item
                  value={`${WISHLIST_COPY.panelTitle} saved rooms wishlist`}
                  onSelect={openWishlist}
                  className="flex min-h-11 cursor-pointer items-center rounded-xl px-3 text-sm text-navy data-[selected=true]:bg-gold/40"
                >
                  {WISHLIST_COPY.panelTitle}
                </Command.Item>
              </Command.Group>
              <Command.Group heading="Pages" className={GROUP_HEADING}>
                {navLinks.map((link) => (
                  <Command.Item
                    key={link.href}
                    value={link.label}
                    onSelect={() => go(link.href)}
                    className="flex min-h-11 cursor-pointer items-center rounded-xl px-3 text-sm text-navy data-[selected=true]:bg-gold/40"
                  >
                    {link.label}
                  </Command.Item>
                ))}
              </Command.Group>
              <Command.Group heading="Rooms" className={GROUP_HEADING}>
                {rooms.map((room) => (
                  <Command.Item
                    key={room.id}
                    value={`${room.name} ${room.bed} ${room.selectLabel}`}
                    onSelect={() => go(`/rooms/${room.id}`)}
                    className="flex min-h-11 cursor-pointer items-center rounded-xl px-3 text-sm text-navy data-[selected=true]:bg-gold/40"
                  >
                    {room.name}
                  </Command.Item>
                ))}
              </Command.Group>
              <Command.Group heading="Questions" className={GROUP_HEADING}>
                {faqs.map((item) => (
                  <Command.Item
                    key={item.label}
                    value={`${item.label} ${item.text}`}
                    onSelect={() => go(item.href)}
                    className="flex min-h-11 cursor-pointer flex-col justify-center rounded-xl px-3 py-2 text-sm text-navy data-[selected=true]:bg-gold/40"
                  >
                    <span>{item.label}</span>
                    <span className="text-xs text-muted">{item.text}</span>
                  </Command.Item>
                ))}
              </Command.Group>
            </Command.List>
          </Command>
        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
