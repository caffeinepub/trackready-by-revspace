export type EventType = "Track Day" | "Autocross" | "Drag Race" | "Drifting";

export interface Car {
  id: string;
  make: string;
  model: string;
  year: number;
  nickname: string;
  notes: string;
  createdAt: string;
}

export interface TrackEvent {
  id: string;
  name: string;
  date: string; // ISO date
  type: EventType;
  location: string;
  carId: string;
  notes: string;
  createdAt: string;
}

export interface ChecklistItem {
  id: string;
  eventId: string;
  category: string;
  name: string;
  checked: boolean;
  notes: string;
}

export interface TireLogSession {
  id: string;
  eventId: string;
  sessionName: string;
  timestamp: string;
  tempUnit: "F" | "C";
  targetPsiMin: number;
  targetPsiMax: number;
  fl: { psi: number; temp: number };
  fr: { psi: number; temp: number };
  rl: { psi: number; temp: number };
  rr: { psi: number; temp: number };
}

export interface LapNote {
  id: string;
  eventId: string;
  sessionName: string;
  lapNumber: number;
  lapTime: string; // MM:SS.ms
  notes: string;
  timestamp: string;
}

export interface WearEntry {
  id: string;
  carId: string;
  type: "brake" | "tire";
  position: "FL" | "FR" | "RL" | "RR";
  // brake specific
  percentRemaining?: number;
  lastChangedDate?: string;
  // tire specific
  treadDepthMm?: number;
  brand?: string;
  installDate?: string;
  notes: string;
  updatedAt: string;
}
