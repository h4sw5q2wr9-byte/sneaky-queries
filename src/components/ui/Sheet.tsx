import { useEffect, useRef } from "react";
import type { ReactNode } from "react";
import { X } from "lucide-react";
import { Button, IconButton } from "./Button";

/** Bottom sheet for secondary tasks. Traps focus and closes on Escape. */
export function Sheet({
  title,
  onClose,
  children,
  closeLabel,
  role = "dialog",
  className = "",
}: {
  title: ReactNode;
  onClose: () => void;
  children: ReactNode;
  closeLabel: string;
  role?: "dialog" | "alertdialog";
  className?: string;
}) {
  const panel = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const previous = document.activeElement;
    const target =
      panel.current?.querySelector<HTMLElement>(
        "[autofocus], [data-autofocus]",
      ) || panel.current;
    target?.focus();
    return () => {
      if (previous instanceof HTMLElement && previous.isConnected)
        previous.focus();
    };
  }, []);
  return (
    <div className="sheet-backdrop" onClick={onClose}>
      <div
        ref={panel}
        tabIndex={-1}
        className={`sheet ${className}`}
        role={role}
        aria-modal="true"
        aria-labelledby="sheet-title"
        onClick={(e) => e.stopPropagation()}
        onKeyDown={(e) => {
          if (e.key === "Escape") onClose();
          if (e.key !== "Tab") return;
          const items = Array.from(
            e.currentTarget.querySelectorAll<HTMLElement>(
              "button:not(:disabled), input, [href]",
            ),
          );
          const first = items[0];
          const last = items[items.length - 1];
          if (e.shiftKey && document.activeElement === first) {
            e.preventDefault();
            last?.focus();
          } else if (!e.shiftKey && document.activeElement === last) {
            e.preventDefault();
            first?.focus();
          }
        }}
      >
        <div className="sheet-grip" aria-hidden="true" />
        <div className="sheet-head">
          <h2 id="sheet-title">{title}</h2>
          {role === "dialog" && (
            <IconButton label={closeLabel} onClick={onClose}>
              <X size={18} />
            </IconButton>
          )}
        </div>
        {children}
      </div>
    </div>
  );
}

export function ConfirmSheet({
  text,
  confirmLabel,
  cancelLabel,
  onConfirm,
  onCancel,
  disabled = false,
}: {
  text: string;
  confirmLabel: string;
  cancelLabel: string;
  onConfirm: () => void;
  onCancel: () => void;
  disabled?: boolean;
}) {
  return (
    <Sheet
      title={text}
      onClose={onCancel}
      closeLabel={cancelLabel}
      role="alertdialog"
      className="confirm-sheet"
    >
      <div className="sheet-actions">
        <Button variant="secondary" onClick={onCancel} data-autofocus>
          {cancelLabel}
        </Button>
        <Button disabled={disabled} onClick={onConfirm}>
          {confirmLabel}
        </Button>
      </div>
    </Sheet>
  );
}
