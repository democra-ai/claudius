import { useCallback, useState } from "react";

export type ToastKind = "info" | "success" | "error";
export type Toast = { id: number; kind: ToastKind; message: string };

let nextId = 1;

/**
 * Tiny self-contained toast state. We intentionally avoid pulling in a
 * notification library for v1 — the UI shows one banner at a time at the top.
 */
export function useToasts() {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const push = useCallback((message: string, kind: ToastKind = "info") => {
    const id = nextId++;
    setToasts((current) => [...current, { id, kind, message }]);
    setTimeout(() => {
      setToasts((current) => current.filter((toast) => toast.id !== id));
    }, kind === "error" ? 6000 : 3500);
  }, []);

  const dismiss = useCallback((id: number) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  return { toasts, push, dismiss };
}
