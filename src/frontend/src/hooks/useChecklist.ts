import { useCallback, useEffect, useState } from "react";
import type { ChecklistItem as BackendItem } from "../backend.d";
import type { ChecklistItem } from "../types";
import { useActor } from "./useActor";

function toFrontend(i: BackendItem): ChecklistItem {
  return {
    id: i.id,
    eventId: i.eventId,
    category: i.category,
    name: i.name,
    checked: i.checked,
    notes: i.notes,
  };
}

function genId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

export function useChecklist() {
  const { actor, isFetching } = useActor();
  const [items, setItems] = useState<ChecklistItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadedEventId, setLoadedEventId] = useState<string | null>(null);

  const loadForEvent = useCallback(
    async (eventId: string) => {
      if (!actor || isFetching) return;
      setLoading(true);
      try {
        const result = await actor.getChecklistItemsForEvent(eventId);
        setItems((prev) => {
          const withoutEvent = prev.filter((i) => i.eventId !== eventId);
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

  const getItemsForEvent = useCallback(
    (eventId: string): ChecklistItem[] => {
      if (loadedEventId !== eventId && actor && !isFetching) {
        void loadForEvent(eventId);
      }
      return items.filter((i) => i.eventId === eventId);
    },
    [items, loadedEventId, actor, isFetching, loadForEvent],
  );

  const initializeDefaultChecklist = useCallback(
    async (eventId: string) => {
      if (!actor) return;
      setLoading(true);
      try {
        await actor.initDefaultChecklist(eventId);
        const result = await actor.getChecklistItemsForEvent(eventId);
        setItems((prev) => {
          const withoutEvent = prev.filter((i) => i.eventId !== eventId);
          return [...withoutEvent, ...result.map(toFrontend)];
        });
        setLoadedEventId(eventId);
      } catch (err) {
        console.error(err);
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [actor],
  );

  const addItem = useCallback(
    async (item: Omit<ChecklistItem, "id">) => {
      if (!actor) return;
      const newItem: ChecklistItem = {
        ...item,
        id: genId(),
      };
      setItems((prev) => [...prev, newItem]);
      try {
        await actor.createChecklistItem(newItem);
      } catch (err) {
        console.error(err);
        setItems((prev) => prev.filter((i) => i.id !== newItem.id));
        throw err;
      }
    },
    [actor],
  );

  const updateItem = useCallback(
    async (id: string, updates: Partial<Omit<ChecklistItem, "id">>) => {
      if (!actor) return;
      const original = items.find((i) => i.id === id);
      if (!original) return;
      const merged = { ...original, ...updates };
      setItems((prev) => prev.map((i) => (i.id === id ? merged : i)));
      try {
        await actor.updateChecklistItem(merged);
      } catch (err) {
        console.error(err);
        setItems((prev) => prev.map((i) => (i.id === id ? original : i)));
        throw err;
      }
    },
    [actor, items],
  );

  const deleteItem = useCallback(
    async (id: string) => {
      if (!actor) return;
      const backup = items.find((i) => i.id === id);
      setItems((prev) => prev.filter((i) => i.id !== id));
      try {
        await actor.deleteChecklistItem(id);
      } catch (err) {
        console.error(err);
        if (backup) setItems((prev) => [...prev, backup]);
        throw err;
      }
    },
    [actor, items],
  );

  const toggleItem = useCallback(
    async (id: string) => {
      if (!actor) return;
      const original = items.find((i) => i.id === id);
      if (!original) return;
      setItems((prev) =>
        prev.map((i) => (i.id === id ? { ...i, checked: !i.checked } : i)),
      );
      try {
        await actor.toggleChecklistItem(id);
      } catch (err) {
        console.error(err);
        setItems((prev) => prev.map((i) => (i.id === id ? original : i)));
        throw err;
      }
    },
    [actor, items],
  );

  const resetChecklist = useCallback(
    async (eventId: string) => {
      if (!actor) return;
      const originals = items.filter((i) => i.eventId === eventId);
      setItems((prev) =>
        prev.map((i) =>
          i.eventId === eventId ? { ...i, checked: false, notes: "" } : i,
        ),
      );
      try {
        const eventItems = items.filter((i) => i.eventId === eventId);
        await Promise.all(
          eventItems.map((item) =>
            actor.updateChecklistItem({ ...item, checked: false, notes: "" }),
          ),
        );
      } catch (err) {
        console.error(err);
        setItems((prev) => {
          const withoutEvent = prev.filter((i) => i.eventId !== eventId);
          return [...withoutEvent, ...originals];
        });
        throw err;
      }
    },
    [actor, items],
  );

  const markAllDone = useCallback(
    async (eventId: string) => {
      if (!actor) return;
      const originals = items.filter((i) => i.eventId === eventId);
      setItems((prev) =>
        prev.map((i) => (i.eventId === eventId ? { ...i, checked: true } : i)),
      );
      try {
        const eventItems = items.filter((i) => i.eventId === eventId);
        await Promise.all(
          eventItems.map((item) =>
            actor.updateChecklistItem({ ...item, checked: true }),
          ),
        );
      } catch (err) {
        console.error(err);
        setItems((prev) => {
          const withoutEvent = prev.filter((i) => i.eventId !== eventId);
          return [...withoutEvent, ...originals];
        });
        throw err;
      }
    },
    [actor, items],
  );

  // Expose loadForEvent so pages can explicitly load items for a selected event
  return {
    items,
    loading,
    getItemsForEvent,
    loadForEvent,
    initializeDefaultChecklist,
    addItem,
    updateItem,
    deleteItem,
    toggleItem,
    resetChecklist,
    markAllDone,
  };
}
