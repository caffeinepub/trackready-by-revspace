import { AlertTriangle, Gauge, Loader2, Plus, Trash2, X } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useEvents } from "../hooks/useEvents";
import { useTireLogs } from "../hooks/useTireLogs";
import { useAppStore } from "../store/appStore";
import type { TireLogSession } from "../types";

type Corner = "fl" | "fr" | "rl" | "rr";
const CORNERS: Corner[] = ["fl", "fr", "rl", "rr"];
const CORNER_LABELS: Record<Corner, string> = {
  fl: "FL",
  fr: "FR",
  rl: "RL",
  rr: "RR",
};

interface SessionFormData {
  sessionName: string;
  tempUnit: "F" | "C";
  targetPsiMin: number;
  targetPsiMax: number;
  fl: { psi: number; temp: number };
  fr: { psi: number; temp: number };
  rl: { psi: number; temp: number };
  rr: { psi: number; temp: number };
}

const defaultForm: SessionFormData = {
  sessionName: "",
  tempUnit: "F",
  targetPsiMin: 32,
  targetPsiMax: 36,
  fl: { psi: 32, temp: 75 },
  fr: { psi: 32, temp: 75 },
  rl: { psi: 32, temp: 75 },
  rr: { psi: 32, temp: 75 },
};

export function TireLogs() {
  const {
    loading,
    loadForEvent,
    getSessionsForEvent,
    addSession,
    deleteSession,
  } = useTireLogs();
  const { events } = useEvents();
  const { selectedEventId, setSelectedEventId } = useAppStore();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState<SessionFormData>(defaultForm);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (selectedEventId) {
      void loadForEvent(selectedEventId);
    }
  }, [selectedEventId, loadForEvent]);

  const sortedEvents = [...events].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
  );

  const eventSessions = selectedEventId
    ? getSessionsForEvent(selectedEventId)
        .slice()
        .sort(
          (a, b) =>
            new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
        )
    : [];

  const setCornerValue = (
    corner: Corner,
    field: "psi" | "temp",
    value: number,
  ) => {
    setForm((f) => ({ ...f, [corner]: { ...f[corner], [field]: value } }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEventId) return;
    if (!form.sessionName.trim()) {
      toast.error("Session name is required");
      return;
    }
    setSaving(true);
    try {
      await addSession({ ...form, eventId: selectedEventId });
      toast.success("Session logged!");
      setShowForm(false);
      setForm(defaultForm);
    } catch {
      toast.error("Failed to log session");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteSession(id);
      setDeleteConfirm(null);
      toast.success("Session deleted");
    } catch {
      toast.error("Failed to delete session");
    }
  };

  const formatTimestamp = (ts: string) =>
    new Date(ts).toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });

  return (
    <div className="p-4 lg:p-8 max-w-5xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-white">
            Tire Logs
          </h1>
          <p className="text-zinc-400 text-sm mt-1">
            Pressure & temperature tracking per session
          </p>
        </div>
        {selectedEventId && (
          <button
            type="button"
            data-ocid="tire_logs.add_session.button"
            onClick={() => setShowForm(true)}
            className="flex items-center gap-2 bg-[#FF6B00] hover:bg-[#e05e00] text-white px-4 py-2.5 rounded-xl font-semibold text-sm transition-all shadow-glow-sm"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Add Session</span>
          </button>
        )}
      </div>

      {/* Event Selector */}
      <div className="mb-6">
        <label
          htmlFor="tire-logs-event-select"
          className="block text-xs font-semibold text-zinc-400 mb-2 uppercase tracking-wide"
        >
          Select Event
        </label>
        <select
          id="tire-logs-event-select"
          data-ocid="tire_logs.event.select"
          value={selectedEventId ?? ""}
          onChange={(e) => setSelectedEventId(e.target.value || null)}
          className="w-full max-w-sm bg-zinc-900 border border-zinc-700 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-[#FF6B00] transition-colors"
        >
          <option value="">— Select an event —</option>
          {sortedEvents.map((event) => (
            <option key={event.id} value={event.id}>
              {event.date} · {event.name}
            </option>
          ))}
        </select>
      </div>

      {/* Add Session Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm overflow-y-auto">
          <div
            data-ocid="tire_logs.add_session.modal"
            className="bg-zinc-900 border border-zinc-700 rounded-2xl w-full max-w-2xl shadow-2xl animate-slide-in my-4"
          >
            <div className="flex items-center justify-between p-5 border-b border-zinc-800">
              <h2 className="font-bold text-lg text-white">Log Tire Session</h2>
              <button
                type="button"
                data-ocid="tire_logs.modal.close_button"
                onClick={() => setShowForm(false)}
                className="text-zinc-500 hover:text-white p-1 rounded-lg hover:bg-zinc-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form
              onSubmit={(e) => void handleSubmit(e)}
              className="p-5 space-y-5"
            >
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 sm:col-span-1">
                  <label
                    htmlFor="tire-session-name"
                    className="block text-xs font-semibold text-zinc-400 mb-1.5 uppercase tracking-wide"
                  >
                    Session Name *
                  </label>
                  <input
                    id="tire-session-name"
                    data-ocid="tire_logs.session_name.input"
                    type="text"
                    value={form.sessionName}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, sessionName: e.target.value }))
                    }
                    placeholder="e.g. Session 1 — Morning"
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-[#FF6B00] transition-colors"
                    required
                  />
                </div>
                <div>
                  <p className="block text-xs font-semibold text-zinc-400 mb-1.5 uppercase tracking-wide">
                    Temp Unit
                  </p>
                  <div className="flex rounded-lg overflow-hidden border border-zinc-700">
                    {(["F", "C"] as const).map((unit) => (
                      <button
                        key={unit}
                        type="button"
                        data-ocid={`tire_logs.temp_unit_${unit.toLowerCase()}.toggle`}
                        onClick={() =>
                          setForm((f) => ({ ...f, tempUnit: unit }))
                        }
                        className={`flex-1 py-2.5 text-sm font-semibold transition-colors ${
                          form.tempUnit === unit
                            ? "bg-[#FF6B00] text-white"
                            : "bg-zinc-800 text-zinc-400 hover:text-white"
                        }`}
                      >
                        °{unit}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="tire-psi-min"
                    className="block text-xs font-semibold text-zinc-400 mb-1.5 uppercase tracking-wide"
                  >
                    Target PSI Min
                  </label>
                  <input
                    id="tire-psi-min"
                    data-ocid="tire_logs.target_psi_min.input"
                    type="number"
                    value={form.targetPsiMin}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        targetPsiMin: Number(e.target.value),
                      }))
                    }
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#FF6B00] transition-colors font-mono"
                    step={0.5}
                  />
                </div>
                <div>
                  <label
                    htmlFor="tire-psi-max"
                    className="block text-xs font-semibold text-zinc-400 mb-1.5 uppercase tracking-wide"
                  >
                    Target PSI Max
                  </label>
                  <input
                    id="tire-psi-max"
                    data-ocid="tire_logs.target_psi_max.input"
                    type="number"
                    value={form.targetPsiMax}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        targetPsiMax: Number(e.target.value),
                      }))
                    }
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#FF6B00] transition-colors font-mono"
                    step={0.5}
                  />
                </div>
              </div>

              {/* Per-corner inputs */}
              <div>
                <p className="block text-xs font-semibold text-zinc-400 mb-3 uppercase tracking-wide">
                  Corner Readings (PSI / Temp °{form.tempUnit})
                </p>
                <div className="grid grid-cols-2 gap-3">
                  {CORNERS.map((corner) => (
                    <div
                      key={corner}
                      className="bg-zinc-800 rounded-xl p-3 border border-zinc-700"
                    >
                      <div className="text-xs font-bold text-zinc-300 uppercase mb-2">
                        {CORNER_LABELS[corner]}
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label
                            htmlFor={`tire-${corner}-psi`}
                            className="text-[10px] text-zinc-500 block mb-1"
                          >
                            PSI
                          </label>
                          <input
                            id={`tire-${corner}-psi`}
                            data-ocid={`tire_logs.${corner}_psi.input`}
                            type="number"
                            value={form[corner].psi}
                            onChange={(e) =>
                              setCornerValue(
                                corner,
                                "psi",
                                Number(e.target.value),
                              )
                            }
                            className="w-full bg-zinc-700 border border-zinc-600 rounded-lg px-2 py-2 text-sm text-white focus:outline-none focus:border-[#FF6B00] transition-colors font-mono text-center"
                            step={0.5}
                          />
                        </div>
                        <div>
                          <label
                            htmlFor={`tire-${corner}-temp`}
                            className="text-[10px] text-zinc-500 block mb-1"
                          >
                            Temp °{form.tempUnit}
                          </label>
                          <input
                            id={`tire-${corner}-temp`}
                            data-ocid={`tire_logs.${corner}_temp.input`}
                            type="number"
                            value={form[corner].temp}
                            onChange={(e) =>
                              setCornerValue(
                                corner,
                                "temp",
                                Number(e.target.value),
                              )
                            }
                            className="w-full bg-zinc-700 border border-zinc-600 rounded-lg px-2 py-2 text-sm text-white focus:outline-none focus:border-[#FF6B00] transition-colors font-mono text-center"
                            step={1}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  data-ocid="tire_logs.modal.cancel_button"
                  onClick={() => setShowForm(false)}
                  className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-4 py-2.5 rounded-xl font-semibold text-sm transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  data-ocid="tire_logs.modal.submit_button"
                  disabled={saving}
                  className="flex-1 bg-[#FF6B00] hover:bg-[#e05e00] disabled:opacity-60 text-white px-4 py-2.5 rounded-xl font-semibold text-sm transition-colors flex items-center justify-center gap-2"
                >
                  {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                  Log Session
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* No event selected */}
      {!selectedEventId ? (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-12 text-center">
          <Gauge className="w-12 h-12 text-zinc-700 mx-auto mb-4" />
          <p className="text-zinc-500 text-sm">
            Select an event to view tire pressure logs.
          </p>
        </div>
      ) : loading ? (
        <div
          data-ocid="tire_logs.loading_state"
          className="bg-zinc-900 border border-zinc-800 rounded-2xl p-12 flex flex-col items-center justify-center gap-3"
        >
          <Loader2 className="w-8 h-8 text-[#FF6B00] animate-spin" />
          <p className="text-zinc-500 text-sm">Loading sessions…</p>
        </div>
      ) : eventSessions.length === 0 ? (
        <div
          data-ocid="tire_logs.sessions.empty_state"
          className="bg-zinc-900 border border-zinc-800 rounded-2xl p-12 text-center"
        >
          <Gauge className="w-12 h-12 text-zinc-700 mx-auto mb-4" />
          <h3 className="text-zinc-400 font-semibold mb-2">
            No sessions logged
          </h3>
          <p className="text-zinc-600 text-sm mb-4">
            Add your first tire pressure session.
          </p>
          <button
            type="button"
            data-ocid="tire_logs.add_session.button"
            onClick={() => setShowForm(true)}
            className="inline-flex items-center gap-2 bg-[#FF6B00] hover:bg-[#e05e00] text-white px-5 py-2.5 rounded-xl font-semibold text-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Session
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {eventSessions.map((session, idx) => (
            <SessionCard
              key={session.id}
              session={session}
              index={idx}
              onDelete={() => void handleDelete(session.id)}
              deleteConfirm={deleteConfirm}
              setDeleteConfirm={setDeleteConfirm}
              formatTimestamp={formatTimestamp}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function SessionCard({
  session,
  index,
  onDelete,
  deleteConfirm,
  setDeleteConfirm,
  formatTimestamp,
}: {
  session: TireLogSession;
  index: number;
  onDelete: () => void;
  deleteConfirm: string | null;
  setDeleteConfirm: (id: string | null) => void;
  formatTimestamp: (ts: string) => string;
}) {
  const corners: Corner[] = ["fl", "fr", "rl", "rr"];
  const psiOutOfRange = (psi: number) =>
    psi < session.targetPsiMin || psi > session.targetPsiMax;

  const hasAlert = corners.some((c) => psiOutOfRange(session[c].psi));

  return (
    <div
      data-ocid={`tire_logs.session.item.${index + 1}`}
      className={`bg-zinc-900 border rounded-xl overflow-hidden ${
        hasAlert ? "border-[#FF6B00]/30" : "border-zinc-800"
      }`}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-zinc-800">
        <div>
          <div className="flex items-center gap-2">
            {hasAlert && <AlertTriangle className="w-4 h-4 text-[#FF6B00]" />}
            <h3 className="font-bold text-white">{session.sessionName}</h3>
          </div>
          <div className="flex items-center gap-3 mt-1">
            <span className="text-xs text-zinc-500">
              {formatTimestamp(session.timestamp)}
            </span>
            <span className="text-xs text-zinc-600">
              Target: {session.targetPsiMin}–{session.targetPsiMax} PSI
            </span>
            <span className="text-xs text-zinc-600">°{session.tempUnit}</span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {deleteConfirm === session.id ? (
            <>
              <button
                type="button"
                data-ocid={`tire_logs.session.delete_button.${index + 1}`}
                onClick={onDelete}
                className="px-3 py-1.5 bg-red-500/15 text-red-400 text-xs font-semibold rounded-lg border border-red-500/20 hover:bg-red-500/25 transition-colors"
              >
                Confirm
              </button>
              <button
                type="button"
                onClick={() => setDeleteConfirm(null)}
                className="px-3 py-1.5 bg-zinc-800 text-zinc-400 text-xs font-semibold rounded-lg hover:bg-zinc-700 transition-colors"
              >
                Cancel
              </button>
            </>
          ) : (
            <button
              type="button"
              data-ocid={`tire_logs.session.delete_button.${index + 1}`}
              onClick={() => setDeleteConfirm(session.id)}
              className="p-2 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Pressure Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-zinc-950/50">
              <td className="px-4 py-2 text-xs text-zinc-500 font-semibold w-20" />
              {corners.map((c) => (
                <th
                  key={c}
                  className="px-4 py-2 text-xs font-bold text-zinc-300 uppercase text-center"
                >
                  {CORNER_LABELS[c]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr className="border-t border-zinc-800/50">
              <td className="px-4 py-3 text-xs text-zinc-500 font-semibold">
                PSI
              </td>
              {corners.map((c) => {
                const isAlert = psiOutOfRange(session[c].psi);
                return (
                  <td key={c} className="px-4 py-3 text-center">
                    <span
                      className={`font-mono font-bold text-sm px-2 py-1 rounded ${
                        isAlert
                          ? "bg-[#FF6B00]/20 text-[#FF6B00]"
                          : "text-white"
                      }`}
                    >
                      {session[c].psi}
                    </span>
                  </td>
                );
              })}
            </tr>
            <tr className="border-t border-zinc-800/50">
              <td className="px-4 py-3 text-xs text-zinc-500 font-semibold">
                Temp °{session.tempUnit}
              </td>
              {corners.map((c) => (
                <td key={c} className="px-4 py-3 text-center">
                  <span className="font-mono text-sm text-zinc-300">
                    {session[c].temp}
                  </span>
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
