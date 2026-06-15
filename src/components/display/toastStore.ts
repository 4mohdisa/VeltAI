// Global toast state. One toast at a time (matches the "one sheet at a time"
// philosophy). Call `showToast(...)` from anywhere; <ToastHost/> renders it.
import { create } from 'zustand';

export type ToastTone = 'info' | 'success' | 'warn' | 'error';
export type ToastPosition = 'top' | 'bottom';

export type ToastInput = {
  message: string;
  tone?: ToastTone;
  position?: ToastPosition;
  actionLabel?: string;
  onAction?: () => void;
  duration?: number;
};

export type ActiveToast = {
  id: number;
  message: string;
  tone: ToastTone;
  position: ToastPosition;
  actionLabel?: string;
  onAction?: () => void;
  duration: number;
};

type ToastState = {
  current: ActiveToast | null;
  show: (input: ToastInput) => void;
  dismiss: () => void;
};

export const useToastStore = create<ToastState>((set) => ({
  current: null,
  show: (input) =>
    set({
      current: {
        id: Date.now(),
        message: input.message,
        tone: input.tone ?? 'info',
        // Info toasts go top-center; action toasts go bottom (UI doc rule).
        position: input.position ?? (input.actionLabel ? 'bottom' : 'top'),
        actionLabel: input.actionLabel,
        onAction: input.onAction,
        duration: input.duration ?? 2800,
      },
    }),
  dismiss: () => set({ current: null }),
}));

/** Imperative helper usable outside React components. */
export function showToast(input: ToastInput) {
  useToastStore.getState().show(input);
}
