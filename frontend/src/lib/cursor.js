import { CURSOR_ALLOWED } from "./cursor.constant";

export function cursorLabelFromEvent(event) {
  const node = event.target;
  if (!node?.closest) return { hot: false, label: "" };
  const field = node.closest("input, textarea, select, [contenteditable='true']");
  if (field) return { hot: false, label: "" };
  const labeled = node.closest("[data-cursor]");
  const raw = labeled?.getAttribute("data-cursor") ?? "";
  const label = CURSOR_ALLOWED.includes(raw) ? raw : "";
  const interactive = node.closest("a, button, article, [data-cursor]");
  return { hot: Boolean(interactive), label };
}
