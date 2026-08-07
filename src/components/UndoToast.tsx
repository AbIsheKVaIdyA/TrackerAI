"use client";

import { useEffect } from "react";

interface Props {
  message: string;
  onUndo: () => void;
  onDismiss: () => void;
}

export function UndoToast({ message, onUndo, onDismiss }: Props) {
  useEffect(() => {
    const t = setTimeout(onDismiss, 6000);
    return () => clearTimeout(t);
  }, [onDismiss, message]);

  return (
    <div className="fixed bottom-[4.5rem] md:bottom-5 inset-x-0 z-[70] flex justify-center px-3 pointer-events-none">
      <div className="pointer-events-auto flex max-w-md items-center gap-3 rounded-full border border-line bg-surface-elevated px-4 py-2.5 shadow-xl">
        <p className="min-w-0 flex-1 text-sm text-ink truncate">{message}</p>
        <button
          type="button"
          onClick={onUndo}
          className="shrink-0 text-sm font-medium text-accent-strong hover:underline"
        >
          Undo
        </button>
        <button
          type="button"
          onClick={onDismiss}
          className="shrink-0 text-ink-dim hover:text-ink text-sm"
          aria-label="Dismiss"
        >
          ×
        </button>
      </div>
    </div>
  );
}
