import { create } from "zustand";
import api from "../lib/axios";

/** Minimal owner shape returned by the backend (`SafeOwner`). */
export interface IUser {
  id: number;
  name: string;
  email: string | null;
  mobile: string | null;
}

interface UserState {
  user: IUser | null;
  isLoading: boolean;
  isInitialized: boolean;

  setUser: (user: IUser | null) => void;
  fetchUser: () => Promise<void>;
  logout: () => void;
}

export const userStore = create<UserState>((set) => ({
  user: null,
  isLoading: false,
  isInitialized: false,

  setUser: (user) => set({ user }),

  fetchUser: async () => {
    try {
      set({ isLoading: true, isInitialized: false });

      const res = await api.get("/auth/me");

      if (!res.data.success) {
        set({ user: null, isLoading: false, isInitialized: true });
        return;
      }

      set({
        user: res.data.data,
        isLoading: false,
        isInitialized: true,
      });
    } catch {
      set({ user: null, isLoading: false, isInitialized: true });
    }
  },

  logout: () => {
    set({ user: null, isInitialized: true });
  },
}));
