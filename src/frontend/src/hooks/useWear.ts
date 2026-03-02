import { useCallback, useState } from "react";
import type { WearEntry as BackendWearEntry } from "../backend.d";
import type { WearEntry } from "../types";
import { useActor } from "./useActor";

function toFrontend(e: BackendWearEntry): WearEntry {
  return {
    id: e.id,
    carId: e.carId,
    type: e.wearType as "brake" | "tire",
    position: e.position as "FL" | "FR" | "RL" | "RR",
    percentRemaining: e.percentRemaining !== 0 ? e.percentRemaining : undefined,
    lastChangedDate: e.lastChangedDate || undefined,
    treadDepthMm: e.treadDepthMm !== 0 ? e.treadDepthMm : undefined,
    brand: e.brand || undefined,
    installDate: e.installDate || undefined,
    notes: e.notes,
    updatedAt: new Date(Number(e.updatedAt / BigInt(1_000_000))).toISOString(),
  };
}

function toBackend(e: WearEntry): BackendWearEntry {
  return {
    id: e.id,
    carId: e.carId,
    wearType: e.type,
    position: e.position,
    percentRemaining: e.percentRemaining ?? 0,
    lastChangedDate: e.lastChangedDate ?? "",
    treadDepthMm: e.treadDepthMm ?? 0,
    brand: e.brand ?? "",
    installDate: e.installDate ?? "",
    notes: e.notes,
    updatedAt: BigInt(Date.now()) * BigInt(1_000_000),
  };
}

function genId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

export function useWear() {
  const { actor, isFetching } = useActor();
  const [entries, setEntries] = useState<WearEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadedCarId, setLoadedCarId] = useState<string | null>(null);

  const loadForCar = useCallback(
    async (carId: string) => {
      if (!actor || isFetching) return;
      setLoading(true);
      try {
        const result = await actor.getWearEntriesForCar(carId);
        setEntries((prev) => {
          const withoutCar = prev.filter((e) => e.carId !== carId);
          return [...withoutCar, ...result.map(toFrontend)];
        });
        setLoadedCarId(carId);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    },
    [actor, isFetching],
  );

  const getEntriesForCar = useCallback(
    (carId: string): WearEntry[] => {
      if (loadedCarId !== carId && actor && !isFetching) {
        void loadForCar(carId);
      }
      return entries.filter((e) => e.carId === carId);
    },
    [entries, loadedCarId, actor, isFetching, loadForCar],
  );

  const addEntry = useCallback(
    async (entry: Omit<WearEntry, "id" | "updatedAt">) => {
      if (!actor) return null;
      const newEntry: WearEntry = {
        ...entry,
        id: genId(),
        updatedAt: new Date().toISOString(),
      };
      setEntries((prev) => [...prev, newEntry]);
      try {
        await actor.createWearEntry(toBackend(newEntry));
      } catch (err) {
        console.error(err);
        setEntries((prev) => prev.filter((e) => e.id !== newEntry.id));
        throw err;
      }
      return newEntry;
    },
    [actor],
  );

  const updateEntry = useCallback(
    async (id: string, updates: Partial<Omit<WearEntry, "id">>) => {
      if (!actor) return;
      const original = entries.find((e) => e.id === id);
      if (!original) return;
      const merged = {
        ...original,
        ...updates,
        updatedAt: new Date().toISOString(),
      };
      setEntries((prev) => prev.map((e) => (e.id === id ? merged : e)));
      try {
        await actor.updateWearEntry(toBackend(merged));
      } catch (err) {
        console.error(err);
        setEntries((prev) => prev.map((e) => (e.id === id ? original : e)));
        throw err;
      }
    },
    [actor, entries],
  );

  const deleteEntry = useCallback(
    async (id: string) => {
      if (!actor) return;
      const backup = entries.find((e) => e.id === id);
      setEntries((prev) => prev.filter((e) => e.id !== id));
      try {
        await actor.deleteWearEntry(id);
      } catch (err) {
        console.error(err);
        if (backup) setEntries((prev) => [...prev, backup]);
        throw err;
      }
    },
    [actor, entries],
  );

  const getCriticalCount = useCallback((): number => {
    return entries.filter(
      (e) =>
        (e.type === "brake" && (e.percentRemaining ?? 100) < 20) ||
        (e.type === "tire" && (e.treadDepthMm ?? 10) < 2),
    ).length;
  }, [entries]);

  return {
    entries,
    loading,
    getEntriesForCar,
    loadForCar,
    addEntry,
    updateEntry,
    deleteEntry,
    getCriticalCount,
  };
}
