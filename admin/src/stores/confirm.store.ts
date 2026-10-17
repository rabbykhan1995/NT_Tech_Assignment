import { create } from "zustand";
import type { ReactNode } from "react";

export interface ConfirmOptions {
  title?: ReactNode;
  message?: ReactNode;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
}

interface ConfirmStore {
  isOpen: boolean;
  options: ConfirmOptions;
  resolveCallback: ((result: boolean) => void) | null;
  openConfirm: (options: ConfirmOptions) => Promise<boolean>;
  closeConfirm: (result: boolean) => void;
}

export const useConfirmStore = create<ConfirmStore>((set, get) => ({
  isOpen: false,
  options: {},
  resolveCallback: null,
  openConfirm: (options) =>
    new Promise<boolean>((resolve) => {
      set({ isOpen: true, options, resolveCallback: resolve });
    }),
  closeConfirm: (result) => {
    const { resolveCallback } = get();
    set({ isOpen: false, options: {}, resolveCallback: null });
    resolveCallback?.(result);
  },
}));