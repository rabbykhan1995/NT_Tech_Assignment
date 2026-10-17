import { create } from "zustand";

// 1️⃣ State & Actions type define
interface LoadingState {
  globalLoader: boolean;
  setGlobalLoader: (val: boolean) => void;
}

// 2️⃣ Create store with types
export const loadingStore = create<LoadingState>((set) => ({
  globalLoader: false,
  setGlobalLoader: (val: boolean) => set({ globalLoader: val }),
}));