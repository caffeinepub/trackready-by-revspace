import { useCallback, useState } from "react";
import type { LapNote as BackendLapNote } from "../backend.d";
import type { LapNote } from "../types";
import { useActor } from "./useActor";

function toFrontend(n: BackendLapNote): LapNote {
  return {
    id: n.id,
    eventId: n.eventId,
    sessionName: n.sessionName,
    lapNumber: Number(n.lapNumber),
    lapTime: n.lapTime,
    notes: n.notes,
    timestamp: new Date(Number(n.timestamp / BigInt(1_000_000))).toISOString(),
  };
}

function toBackend(n: LapNote): BackendLapNote {
  return {
    id: n.id,
    eventId: n.eventId,
    sessionName: n.sessionName,
    lapNumber: BigInt(n.lapNumber),
    lapTime: n.lapTime,
    notes: n.notes,
    timestamp: BigInt(new Date(n.timestamp).getTime()) * BigInt(1_000_000),
  };
}

function genId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

function parseLapTime(time: string): number {
  try {
    const [minSec, ms] = time.split(".");
    const [min, sec] = minSec.split(":").map(Number);
    return (min * 60 + sec) * 1000 + Number(ms || 0);
  } catch {
    return Number.MAX_SAFE_INTEGER;
  }
}

export function useLapNotes() {
  const { actor, isFetching } = useActor();
  const [laps, setLaps] = useState<LapNote[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadedEventId, setLoadedEventId] = useState<string | null>(null);

  const loadForEvent = useCallback(
    async (eventId: string) => {
      if (!actor || isFetching) return;
      setLoading(true);
      try {
        const result = await actor.getLapNotesForEvent(eventId);
        setLaps((prev) => {
          const withoutEvent = prev.filter((l) => l.eventId !== eventId);
          return [...withoutEvent, ...result.map(toFrontend)];
        });
        setLoadedEventId(eventId);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    },
    [actor, isFetching],
  );

  const getLapsForEvent = useCallback(
    (eventId: string): LapNote[] => {
      if (loadedEventId !== eventId && actor && !isFetching) {
        void loadForEvent(eventId);
      }
      return laps.filter((l) => l.eventId === eventId);
    },
    [laps, loadedEventId, actor, isFetching, loadForEvent],
  );

  const getBestLapId = useCallback((eventLaps: LapNote[]): string | null => {
    if (eventLaps.length === 0) return null;
    const best = eventLaps.reduce((a, b) =>
      parseLapTime(a.lapTime) < parseLapTime(b.lapTime) ? a : b,
    );
    return best.id;
  }, []);

  const addLap = useCallback(
    async (lap: Omit<LapNote, "id" | "timestamp">) => {
      if (!actor) return null;
      const newLap: LapNote = {
        ...lap,
        id: genId(),
        timestamp: new Date().toISOString(),
      };
      setLaps((prev) => [...prev, newLap]);
      try {
        await actor.createLapNote(toBackend(newLap));
      } catch (err) {
        console.error(err);
        setLaps((prev) => prev.filter((l) => l.id !== newLap.id));
        throw err;
      }
      return newLap;
    },
    [actor],
  );

  const updateLap = useCallback(
    async (id: string, updates: Partial<Omit<LapNote, "id">>) => {
      if (!actor) return;
      const original = laps.find((l) => l.id === id);
      if (!original) return;
      const merged = { ...original, ...updates };
      setLaps((prev) => prev.map((l) => (l.id === id ? merged : l)));
      try {
        await actor.updateLapNote(toBackend(merged));
      } catch (err) {
        console.error(err);
        setLaps((prev) => prev.map((l) => (l.id === id ? original : l)));
        throw err;
      }
    },
    [actor, laps],
  );

  const deleteLap = useCallback(
    async (id: string) => {
      if (!actor) return;
      const backup = laps.find((l) => l.id === id);
      setLaps((prev) => prev.filter((l) => l.id !== id));
      try {
        await actor.deleteLapNote(id);
      } catch (err) {
        console.error(err);
        if (backup) setLaps((prev) => [...prev, backup]);
        throw err;
      }
    },
    [actor, laps],
  );

  return {
    laps,
    loading,
    getLapsForEvent,
    loadForEvent,
    getBestLapId,
    addLap,
    updateLap,
    deleteLap,
  };
}
