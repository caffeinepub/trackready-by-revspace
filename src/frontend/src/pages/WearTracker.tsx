import {
  Activity,
  AlertTriangle,
  Loader2,
  Pencil,
  Save,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useCars } from "../hooks/useCars";
import { useWear } from "../hooks/useWear";
import { useAppStore } from "../store/appStore";
import type { WearEntry } from "../types";

type Position = "FL" | "FR" | "RL" | "RR";
const POSITIONS: Position[] = ["FL", "FR", "RL", "RR"];

function getBrakeColor(pct: number): string {
  if (pct >= 60) return "#22c55e";
  if (pct >= 20) return "#f59e0b";
  return "#ef4444";
}

function getTireColor(mm: number): string {
  if (mm >= 4) return "#22c55e";
  if (mm >= 2) return "#f59e0b";
  return "#ef4444";
}

interface EditingState {
  id: string;
  type: "brake" | "tire";
  position: Position;
  percentRemaining: number;
  lastChangedDate: string;
  treadDepthMm: number;
  brand: string;
  installDate: string;
  notes: string;
}

export function WearTracker() {
  const { loading, loadForCar, getEntriesForCar, addEntry, updateEntry } =
    useWear();
  const { cars } = useCars();
  const { selectedCarId, setSelectedCarId } = useAppStore();
  const [editing, setEditing] = useState<EditingState | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (selectedCarId) {
      void loadForCar(selectedCarId);
    }
  }, [selectedCarId, loadForCar]);

  const carEntries = selectedCarId ? getEntriesForCar(selectedCarId) : [];

  const getBrakeEntry = (pos: Position): WearEntry | undefined =>
    carEntries.find((e) => e.type === "brake" && e.position === pos);

  const getTireEntry = (pos: Position): WearEntry | undefined =>
    carEntries.find((e) => e.type === "tire" && e.position === pos);

  const criticalBrakes = carEntries.filter(
    (e) => e.type === "brake" && (e.percentRemaining ?? 100) < 20,
  );
  const criticalTires = carEntries.filter(
    (e) => e.type === "tire" && (e.treadDepthMm ?? 10) < 2,
  );

  const startEditBrake = (pos: Position) => {
    const entry = getBrakeEntry(pos);
    setEditing({
      id: entry?.id ?? "",
      type: "brake",
      position: pos,
      percentRemaining: entry?.percentRemaining ?? 100,
      lastChangedDate:
        entry?.lastChangedDate ?? new Date().toISOString().split("T")[0],
      treadDepthMm: 0,
      brand: "",
      installDate: "",
      notes: entry?.notes ?? "",
    });
  };

  const startEditTire = (pos: Position) => {
    const entry = getTireEntry(pos);
    setEditing({
      id: entry?.id ?? "",
      type: "tire",
      position: pos,
      percentRemaining: 0,
      lastChangedDate: "",
      treadDepthMm: entry?.treadDepthMm ?? 7,
      brand: entry?.brand ?? "",
      installDate: entry?.installDate ?? new Date().toISOString().split("T")[0],
      notes: entry?.notes ?? "",
    });
  };

  const handleSave = async () => {
    if (!editing || !selectedCarId) return;
    const payload: Omit<WearEntry, "id" | "updatedAt"> = {
      carId: selectedCarId,
      type: editing.type,
      position: editing.position,
      notes: editing.notes,
      ...(editing.type === "brake"
        ? {
            percentRemaining: editing.percentRemaining,
            lastChangedDate: editing.lastChangedDate,
          }
        : {
            treadDepthMm: editing.treadDepthMm,
            brand: editing.brand,
            installDate: editing.installDate,
          }),
    };

    setSaving(true);
    try {
      if (editing.id) {
        await updateEntry(editing.id, payload);
      } else {
        await addEntry(payload);
      }
      toast.success("Wear data saved!");
      setEditing(null);
    } catch {
      toast.error("Failed to save wear data");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="p-4 lg:p-8 max-w-5xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl lg:text-3xl font-bold text-white">
          Wear Tracker
        </h1>
        <p className="text-zinc-400 text-sm mt-1">
          Monitor brake pads and tire tread depth
        </p>
      </div>

      {/* Car Selector */}
      <div className="mb-6">
        <label
          htmlFor="wear-car-select"
          className="block text-xs font-semibold text-zinc-400 mb-2 uppercase tracking-wide"
        >
          Select Car
        </label>
        <select
          id="wear-car-select"
          data-ocid="wear.car.select"
          value={selectedCarId ?? ""}
          onChange={(e) => setSelectedCarId(e.target.value || null)}
          className="w-full max-w-sm bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#FF6B00] transition-colors"
        >
          <option value="">— Select a car —</option>
          {cars.map((car) => (
            <option key={car.id} value={car.id}>
              {car.year} {car.make} {car.model}
              {car.nickname ? ` (${car.nickname})` : ""}
            </option>
          ))}
        </select>
      </div>

      {!selectedCarId ? (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-12 text-center">
          <Activity className="w-12 h-12 text-zinc-700 mx-auto mb-4" />
          <p className="text-zinc-500 text-sm">
            Select a car to view wear tracking.
          </p>
        </div>
      ) : loading ? (
        <div
          data-ocid="wear.loading_state"
          className="bg-zinc-900 border border-zinc-800 rounded-2xl p-12 flex flex-col items-center justify-center gap-3"
        >
          <Loader2 className="w-8 h-8 text-[#FF6B00] animate-spin" />
          <p className="text-zinc-500 text-sm">Loading wear data…</p>
        </div>
      ) : (
        <>
          {/* Critical Alert */}
          {(criticalBrakes.length > 0 || criticalTires.length > 0) && (
            <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/25">
              <div className="flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-red-400 font-semibold text-sm mb-1">
                    Critical Wear Detected — Do Not Track Until Resolved
                  </p>
                  <div className="space-y-0.5">
                    {criticalBrakes.map((e) => (
                      <p key={e.id} className="text-red-400/70 text-xs">
                        • Brake pad {e.position}: {e.percentRemaining}%
                        remaining
                      </p>
                    ))}
                    {criticalTires.map((e) => (
                      <p key={e.id} className="text-red-400/70 text-xs">
                        • Tire {e.position}: {e.treadDepthMm}mm tread depth
                      </p>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Brake Pads Section */}
          <section className="mb-8">
            <h2 className="text-sm font-bold text-zinc-300 uppercase tracking-widest mb-4 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-red-500 inline-block" />
              Brake Pads
            </h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {POSITIONS.map((pos) => {
                const entry = getBrakeEntry(pos);
                const pct = entry?.percentRemaining ?? null;
                const isCritical = pct !== null && pct < 20;
                const isWarning = pct !== null && pct >= 20 && pct < 60;
                const color = pct !== null ? getBrakeColor(pct) : "#52525b";

                return (
                  <div
                    key={pos}
                    className={`bg-zinc-900 border rounded-xl p-4 ${
                      isCritical
                        ? "border-red-500/40"
                        : isWarning
                          ? "border-yellow-500/30"
                          : "border-zinc-800"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-bold text-zinc-300 text-sm">
                        {pos}
                      </span>
                      <button
                        type="button"
                        data-ocid={`wear.brake.${pos.toLowerCase()}.edit_button`}
                        onClick={() => startEditBrake(pos)}
                        className="p-1.5 text-zinc-500 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {pct !== null ? (
                      <>
                        <div
                          className="text-2xl font-bold font-mono mb-1"
                          style={{ color }}
                        >
                          {pct}%
                        </div>
                        <div className="h-2 bg-zinc-800 rounded-full overflow-hidden mb-2">
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{ width: `${pct}%`, backgroundColor: color }}
                          />
                        </div>
                        {isCritical && (
                          <div className="flex items-center gap-1 text-[10px] text-red-400 font-semibold">
                            <AlertTriangle className="w-2.5 h-2.5" />
                            REPLACE NOW
                          </div>
                        )}
                        {entry?.lastChangedDate && (
                          <p className="text-[10px] text-zinc-600 mt-1">
                            Changed: {entry.lastChangedDate}
                          </p>
                        )}
                        {entry?.notes && (
                          <p className="text-[10px] text-zinc-500 mt-1 line-clamp-2">
                            {entry.notes}
                          </p>
                        )}
                      </>
                    ) : (
                      <button
                        type="button"
                        onClick={() => startEditBrake(pos)}
                        className="text-xs text-zinc-600 hover:text-[#FF6B00] transition-colors mt-1"
                      >
                        + Add data
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </section>

          {/* Tires Section */}
          <section>
            <h2 className="text-sm font-bold text-zinc-300 uppercase tracking-widest mb-4 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-zinc-500 inline-block" />
              Tires
            </h2>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {POSITIONS.map((pos) => {
                const entry = getTireEntry(pos);
                const mm = entry?.treadDepthMm ?? null;
                const isCritical = mm !== null && mm < 2;
                const isWarning = mm !== null && mm >= 2 && mm < 4;
                const color = mm !== null ? getTireColor(mm) : "#52525b";
                const maxDepth = 8;
                const pct =
                  mm !== null ? Math.min(100, (mm / maxDepth) * 100) : 0;

                return (
                  <div
                    key={pos}
                    className={`bg-zinc-900 border rounded-xl p-4 ${
                      isCritical
                        ? "border-red-500/40"
                        : isWarning
                          ? "border-yellow-500/30"
                          : "border-zinc-800"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-bold text-zinc-300 text-sm">
                        {pos}
                      </span>
                      <button
                        type="button"
                        data-ocid={`wear.tire.${pos.toLowerCase()}.edit_button`}
                        onClick={() => startEditTire(pos)}
                        className="p-1.5 text-zinc-500 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {mm !== null ? (
                      <>
                        <div
                          className="text-2xl font-bold font-mono mb-1"
                          style={{ color }}
                        >
                          {mm}
                          <span className="text-sm font-normal text-zinc-500 ml-1">
                            mm
                          </span>
                        </div>
                        <div className="h-2 bg-zinc-800 rounded-full overflow-hidden mb-2">
                          <div
                            className="h-full rounded-full transition-all duration-500"
                            style={{ width: `${pct}%`, backgroundColor: color }}
                          />
                        </div>
                        {isCritical && (
                          <div className="flex items-center gap-1 text-[10px] text-red-400 font-semibold">
                            <AlertTriangle className="w-2.5 h-2.5" />
                            REPLACE NOW
                          </div>
                        )}
                        {entry?.brand && (
                          <p className="text-[10px] text-zinc-500 mt-1 truncate">
                            {entry.brand}
                          </p>
                        )}
                        {entry?.installDate && (
                          <p className="text-[10px] text-zinc-600 mt-0.5">
                            Installed: {entry.installDate}
                          </p>
                        )}
                        {entry?.notes && (
                          <p className="text-[10px] text-zinc-500 mt-1 line-clamp-2">
                            {entry.notes}
                          </p>
                        )}
                      </>
                    ) : (
                      <button
                        type="button"
                        onClick={() => startEditTire(pos)}
                        className="text-xs text-zinc-600 hover:text-[#FF6B00] transition-colors mt-1"
                      >
                        + Add data
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        </>
      )}

      {/* Edit Modal */}
      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div
            data-ocid="wear.edit.modal"
            className="bg-zinc-900 border border-zinc-700 rounded-2xl w-full max-w-md shadow-2xl animate-slide-in"
          >
            <div className="flex items-center justify-between p-5 border-b border-zinc-800">
              <h2 className="font-bold text-lg text-white">
                Edit {editing.type === "brake" ? "Brake Pad" : "Tire"} —{" "}
                {editing.position}
              </h2>
              <button
                type="button"
                data-ocid="wear.edit.modal.close_button"
                onClick={() => setEditing(null)}
                className="text-zinc-500 hover:text-white p-1 rounded-lg hover:bg-zinc-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              {editing.type === "brake" ? (
                <>
                  <div>
                    <label
                      htmlFor="wear-brake-pct"
                      className="block text-xs font-semibold text-zinc-400 mb-1.5 uppercase tracking-wide"
                    >
                      % Remaining (0–100)
                    </label>
                    <input
                      id="wear-brake-pct"
                      data-ocid="wear.edit.percent.input"
                      type="number"
                      value={editing.percentRemaining}
                      onChange={(e) =>
                        setEditing((prev) =>
                          prev
                            ? {
                                ...prev,
                                percentRemaining: Math.min(
                                  100,
                                  Math.max(0, Number(e.target.value)),
                                ),
                              }
                            : prev,
                        )
                      }
                      min={0}
                      max={100}
                      className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#FF6B00] transition-colors font-mono"
                    />
                    <div className="mt-2 h-2 bg-zinc-800 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${editing.percentRemaining}%`,
                          backgroundColor: getBrakeColor(
                            editing.percentRemaining,
                          ),
                        }}
                      />
                    </div>
                  </div>
                  <div>
                    <label
                      htmlFor="wear-last-changed"
                      className="block text-xs font-semibold text-zinc-400 mb-1.5 uppercase tracking-wide"
                    >
                      Last Changed Date
                    </label>
                    <input
                      id="wear-last-changed"
                      data-ocid="wear.edit.last_changed.input"
                      type="date"
                      value={editing.lastChangedDate}
                      onChange={(e) =>
                        setEditing((prev) =>
                          prev
                            ? { ...prev, lastChangedDate: e.target.value }
                            : prev,
                        )
                      }
                      className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#FF6B00] transition-colors"
                    />
                  </div>
                </>
              ) : (
                <>
                  <div>
                    <label
                      htmlFor="wear-tread-depth"
                      className="block text-xs font-semibold text-zinc-400 mb-1.5 uppercase tracking-wide"
                    >
                      Tread Depth (mm)
                    </label>
                    <input
                      id="wear-tread-depth"
                      data-ocid="wear.edit.tread_depth.input"
                      type="number"
                      value={editing.treadDepthMm}
                      onChange={(e) =>
                        setEditing((prev) =>
                          prev
                            ? {
                                ...prev,
                                treadDepthMm: Math.max(
                                  0,
                                  Number(e.target.value),
                                ),
                              }
                            : prev,
                        )
                      }
                      min={0}
                      max={12}
                      step={0.1}
                      className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#FF6B00] transition-colors font-mono"
                    />
                    <div className="mt-2 h-2 bg-zinc-800 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all"
                        style={{
                          width: `${Math.min(100, (editing.treadDepthMm / 8) * 100)}%`,
                          backgroundColor: getTireColor(editing.treadDepthMm),
                        }}
                      />
                    </div>
                  </div>
                  <div>
                    <label
                      htmlFor="wear-tire-brand"
                      className="block text-xs font-semibold text-zinc-400 mb-1.5 uppercase tracking-wide"
                    >
                      Tire Brand
                    </label>
                    <input
                      id="wear-tire-brand"
                      data-ocid="wear.edit.brand.input"
                      type="text"
                      value={editing.brand}
                      onChange={(e) =>
                        setEditing((prev) =>
                          prev ? { ...prev, brand: e.target.value } : prev,
                        )
                      }
                      placeholder="e.g. Michelin Pilot Sport Cup 2"
                      className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-[#FF6B00] transition-colors"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="wear-install-date"
                      className="block text-xs font-semibold text-zinc-400 mb-1.5 uppercase tracking-wide"
                    >
                      Install Date
                    </label>
                    <input
                      id="wear-install-date"
                      data-ocid="wear.edit.install_date.input"
                      type="date"
                      value={editing.installDate}
                      onChange={(e) =>
                        setEditing((prev) =>
                          prev
                            ? { ...prev, installDate: e.target.value }
                            : prev,
                        )
                      }
                      className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#FF6B00] transition-colors"
                    />
                  </div>
                </>
              )}

              <div>
                <label
                  htmlFor="wear-notes"
                  className="block text-xs font-semibold text-zinc-400 mb-1.5 uppercase tracking-wide"
                >
                  Notes
                </label>
                <textarea
                  id="wear-notes"
                  data-ocid="wear.edit.notes.textarea"
                  value={editing.notes}
                  onChange={(e) =>
                    setEditing((prev) =>
                      prev ? { ...prev, notes: e.target.value } : prev,
                    )
                  }
                  placeholder="Condition notes..."
                  rows={2}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-[#FF6B00] transition-colors resize-none"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  data-ocid="wear.edit.modal.cancel_button"
                  onClick={() => setEditing(null)}
                  className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-4 py-2.5 rounded-xl font-semibold text-sm transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  data-ocid="wear.edit.modal.save_button"
                  onClick={() => void handleSave()}
                  disabled={saving}
                  className="flex-1 bg-[#FF6B00] hover:bg-[#e05e00] disabled:opacity-60 text-white px-4 py-2.5 rounded-xl font-semibold text-sm transition-colors flex items-center justify-center gap-2"
                >
                  {saving ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
