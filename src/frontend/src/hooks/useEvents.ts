import { useCallback, useEffect, useState } from "react";
import type { Event as BackendEvent } from "../backend.d";
import type { EventType, TrackEvent } from "../types";
import { useActor } from "./useActor";

function toFrontend(e: BackendEvent): TrackEvent {
  return {
    id: e.id,
    name: e.name,
    date: e.date,
    type: e.eventType as EventType,
    location: e.location,
    carId: e.carId,
    notes: e.notes,
    createdAt: new Date(Number(e.createdAt / BigInt(1_000_000))).toISOString(),
  };
}

function toBackend(event: TrackEvent): BackendEvent {
  return {
    id: event.id,
    name: event.name,
    date: event.date,
    eventType: event.type,
    location: event.location,
    carId: event.carId,
    notes: event.notes,
    createdAt: BigInt(new Date(event.createdAt).getTime()) * BigInt(1_000_000),
  };
}

function genId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

export function useEvents() {
  const { actor, isFetching } = useActor();
  const [events, setEvents] = useState<TrackEvent[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!actor || isFetching) return;
    let cancelled = false;
    setLoading(true);
    actor
      .getEvents()
      .then((result) => {
        if (!cancelled) setEvents(result.map(toFrontend));
      })
      .catch(console.error)
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [actor, isFetching]);

  const addEvent = useCallback(
    async (event: Omit<TrackEvent, "id" | "createdAt">) => {
      if (!actor) return null;
      const newEvent: TrackEvent = {
        ...event,
        id: genId(),
        createdAt: new Date().toISOString(),
      };
      setEvents((prev) => [...prev, newEvent]);
      try {
        await actor.createEvent(toBackend(newEvent));
      } catch (err) {
        console.error(err);
        setEvents((prev) => prev.filter((e) => e.id !== newEvent.id));
        throw err;
      }
      return newEvent;
    },
    [actor],
  );

  const updateEvent = useCallback(
    async (
      id: string,
      updates: Partial<Omit<TrackEvent, "id" | "createdAt">>,
    ) => {
      if (!actor) return;
      const original = events.find((e) => e.id === id);
      if (!original) return;
      const merged = { ...original, ...updates };
      setEvents((prev) => prev.map((e) => (e.id === id ? merged : e)));
      try {
        await actor.updateEvent(toBackend(merged));
      } catch (err) {
        console.error(err);
        setEvents((prev) => prev.map((e) => (e.id === id ? original : e)));
        throw err;
      }
    },
    [actor, events],
  );

  const deleteEvent = useCallback(
    async (id: string) => {
      if (!actor) return;
      const backup = events.find((e) => e.id === id);
      setEvents((prev) => prev.filter((e) => e.id !== id));
      try {
        await actor.deleteEvent(id);
      } catch (err) {
        console.error(err);
        if (backup) setEvents((prev) => [...prev, backup]);
        throw err;
      }
    },
    [actor, events],
  );

  return { events, loading, addEvent, updateEvent, deleteEvent };
}
