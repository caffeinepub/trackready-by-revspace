import { create } from "zustand";

export type AppView =
  | "dashboard"
  | "events"
  | "cars"
  | "checklist"
  | "tire-logs"
  | "lap-notes"
  | "wear";

interface AppState {
  currentView: AppView;
  selectedEventId: string | null;
  selectedCarId: string | null;
  setView: (view: AppView) => void;
  setSelectedEventId: (id: string | null) => void;
  setSelectedCarId: (id: string | null) => void;
}

export const useAppStore = create<AppState>((set) => ({
  currentView: "dashboard",
  selectedEventId: null,
  selectedCarId: null,
  setView: (view) => set({ currentView: view }),
  setSelectedEventId: (id) => set({ selectedEventId: id }),
  setSelectedCarId: (id) => set({ selectedCarId: id }),
}));
