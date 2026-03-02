import { useCallback, useEffect, useState } from "react";
import type { Car as BackendCar } from "../backend.d";
import type { Car } from "../types";
import { useActor } from "./useActor";

function toFrontend(c: BackendCar): Car {
  return {
    id: c.id,
    make: c.make,
    model: c.model,
    year: Number(c.year),
    nickname: c.nickname,
    notes: c.notes,
    createdAt: new Date(Number(c.createdAt / BigInt(1_000_000))).toISOString(),
  };
}

function toBackend(car: Car): BackendCar {
  return {
    id: car.id,
    make: car.make,
    model: car.model,
    year: BigInt(car.year),
    nickname: car.nickname,
    notes: car.notes,
    createdAt: BigInt(new Date(car.createdAt).getTime()) * BigInt(1_000_000),
  };
}

function genId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2);
}

export function useCars() {
  const { actor, isFetching } = useActor();
  const [cars, setCars] = useState<Car[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!actor || isFetching) return;
    let cancelled = false;
    setLoading(true);
    actor
      .getCars()
      .then((result) => {
        if (!cancelled) setCars(result.map(toFrontend));
      })
      .catch(console.error)
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [actor, isFetching]);

  const addCar = useCallback(
    async (car: Omit<Car, "id" | "createdAt">) => {
      if (!actor) return null;
      const newCar: Car = {
        ...car,
        id: genId(),
        createdAt: new Date().toISOString(),
      };
      setCars((prev) => [...prev, newCar]);
      try {
        await actor.createCar(toBackend(newCar));
      } catch (err) {
        console.error(err);
        setCars((prev) => prev.filter((c) => c.id !== newCar.id));
        throw err;
      }
      return newCar;
    },
    [actor],
  );

  const updateCar = useCallback(
    async (id: string, updates: Partial<Omit<Car, "id" | "createdAt">>) => {
      if (!actor) return;
      setCars((prev) =>
        prev.map((c) => (c.id === id ? { ...c, ...updates } : c)),
      );
      const updated = cars.find((c) => c.id === id);
      if (!updated) return;
      const merged = { ...updated, ...updates };
      try {
        await actor.updateCar(toBackend(merged));
      } catch (err) {
        console.error(err);
        setCars((prev) => prev.map((c) => (c.id === id ? updated : c)));
        throw err;
      }
    },
    [actor, cars],
  );

  const deleteCar = useCallback(
    async (id: string) => {
      if (!actor) return;
      const backup = cars.find((c) => c.id === id);
      setCars((prev) => prev.filter((c) => c.id !== id));
      try {
        await actor.deleteCar(id);
      } catch (err) {
        console.error(err);
        if (backup) setCars((prev) => [...prev, backup]);
        throw err;
      }
    },
    [actor, cars],
  );

  return { cars, loading, addCar, updateCar, deleteCar };
}
