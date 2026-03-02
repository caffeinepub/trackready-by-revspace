import { useCallback, useEffect, useState } from "react";
import type { TireLogSession as BackendSession } from "../backend.d";
import type { TireLogSession } from "../types";
import { useActor } from "./useActor";

function toFrontend(s: BackendSession): TireLogSession {
  return {
    id: s.id,
    eventId: s.eventId,
    sessionName: s.sessionName,
    timestamp: new Date(Number(s.timestamp / BigInt(1_000_000))).toISOString(),
    tempUnit: s.tempUnit as "F" | "C",
    targetPsiMin: s.targetPsiMin,
    targetPsiMax: s.targetPsiMax,
    fl: { psi: s.flPsi, temp: s.flTemp },
    fr: { psi: s.frPsi, temp: s.frTemp },
    rl: { psi: s.rlPsi, temp: s.rlTemp },
    rr: { psi: s.rrPsi, temp: s.rrTemp },
  };
}

function toBackend(s: TireLogSession): BackendSession {
  return {
    id: s.id,
    eventId: s.eventId,
    sessionName: s.sessionName,
    timestamp: BigInt(new Date(s.timestamp).getTime()) * BigInt(1_000_000),
    tempUnit: s.tempUnit,
    targetPsiMin: s.targetPsiMin,
    targetPsiMax: s.targetPsiMax,
    flPsi: s.fl.psi,
    flTemp: s.fl.temp,
    frPsi: s.fr.psi,
    frTemp: s.fr.temp,
    rlPsi: s.rl.psi,
    rlTemp: s.rl.temp,
    rrPsi: s.rr.psi,
    rrTemp: s.rr.temp,
  };
}

function genId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

export function useTireLogs() {
  const { actor, isFetching } = useActor();
  const [sessions, setSessions] = useState<TireLogSession[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadedEventId, setLoadedEventId] = useState<string | null>(null);

  const loadForEvent = useCallback(
    async (eventId: string) => {
      if (!actor || isFetching) return;
      setLoading(true);
      try {
        const result = await actor.getTireLogSessionsForEvent(eventId);
        setSessions((prev) => {
          const withoutEvent = prev.filter((s) => s.eventId !== eventId);
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

  const getSessionsForEvent = useCallback(
    (eventId: string): TireLogSession[] => {
      if (loadedEventId !== eventId && actor && !isFetching) {
        void loadForEvent(eventId);
      }
      return sessions.filter((s) => s.eventId === eventId);
    },
    [sessions, loadedEventId, actor, isFetching, loadForEvent],
  );

  const addSession = useCallback(
    async (session: Omit<TireLogSession, "id" | "timestamp">) => {
      if (!actor) return null;
      const newSession: TireLogSession = {
        ...session,
        id: genId(),
        timestamp: new Date().toISOString(),
      };
      setSessions((prev) => [...prev, newSession]);
      try {
        await actor.createTireLogSession(toBackend(newSession));
      } catch (err) {
        console.error(err);
        setSessions((prev) => prev.filter((s) => s.id !== newSession.id));
        throw err;
      }
      return newSession;
    },
    [actor],
  );

  const updateSession = useCallback(
    async (id: string, updates: Partial<Omit<TireLogSession, "id">>) => {
      if (!actor) return;
      const original = sessions.find((s) => s.id === id);
      if (!original) return;
      const merged = { ...original, ...updates };
      setSessions((prev) => prev.map((s) => (s.id === id ? merged : s)));
      try {
        await actor.updateTireLogSession(toBackend(merged));
      } catch (err) {
        console.error(err);
        setSessions((prev) => prev.map((s) => (s.id === id ? original : s)));
        throw err;
      }
    },
    [actor, sessions],
  );

  const deleteSession = useCallback(
    async (id: string) => {
      if (!actor) return;
      const backup = sessions.find((s) => s.id === id);
      setSessions((prev) => prev.filter((s) => s.id !== id));
      try {
        await actor.deleteTireLogSession(id);
      } catch (err) {
        console.error(err);
        if (backup) setSessions((prev) => [...prev, backup]);
        throw err;
      }
    },
    [actor, sessions],
  );

  return {
    sessions,
    loading,
    getSessionsForEvent,
    loadForEvent,
    addSession,
    updateSession,
    deleteSession,
  };
}
