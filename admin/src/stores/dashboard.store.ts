import { create } from "zustand";

interface DashboardState {
  sidePanel: boolean;
  setSidePanel: (value: boolean) => void;
}

export const dashboardStore = create<DashboardState>((set) => ({
  sidePanel: true,
  setSidePanel: (value) => set({ sidePanel: value }),
}));
