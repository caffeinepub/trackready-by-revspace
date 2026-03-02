import {
  Download,
  Loader2,
  Plus,
  Timer,
  Trash2,
  Trophy,
  X,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useEvents } from "../hooks/useEvents";
import { useLapNotes } from "../hooks/useLapNotes";
import { useAppStore } from "../store/appStore";

const LAP_TIME_REGEX = /^\d{1,2}:\d{2}\.\d{1,3}$/;

export function LapNotes() {
  const {
    loading,
    loadForEvent,
    getLapsForEvent,
    getBestLapId,
    addLap,
    deleteLap,
  } = useLapNotes();
  const { events } = useEvents();
  const { selectedEventId, setSelectedEventId } = useAppStore();
  const [sessionName, setSessionName] = useState("Session 1");
  const [lapTime, setLapTime] = useState("");
  const [lapNotes, setLapNotes] = useState("");
  const [lapTimeError, setLapTimeError] = useState("");
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

  const eventLaps = selectedEventId
    ? getLapsForEvent(selectedEventId)
        .slice()
        .sort((a, b) => a.lapNumber - b.lapNumber)
    : [];

  const bestLapId = getBestLapId(eventLaps);

  const nextLapNumber =
    eventLaps.length > 0
      ? Math.max(...eventLaps.map((l) => l.lapNumber)) + 1
      : 1;

  const validateLapTime = (value: string) => {
    if (!value) return "Lap time is required";
    if (!LAP_TIME_REGEX.test(value)) return "Format: M:SS.ms (e.g. 1:42.831)";
    return "";
  };

  const handleAddLap = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEventId) return;

    const error = validateLapTime(lapTime);
    if (error) {
      setLapTimeError(error);
      return;
    }

    setSaving(true);
    try {
      await addLap({
        eventId: selectedEventId,
        sessionName,
        lapNumber: nextLapNumber,
        lapTime,
        notes: lapNotes,
      });

      toast.success(`Lap ${nextLapNumber} logged!`);
      setLapTime("");
      setLapNotes("");
      setLapTimeError("");
    } catch {
      toast.error("Failed to log lap");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteLap(id);
      setDeleteConfirm(null);
      toast.success("Lap deleted");
    } catch {
      toast.error("Failed to delete lap");
    }
  };

  const handleExport = () => {
    if (!selectedEventId) return;
    const event = events.find((e) => e.id === selectedEventId);
    const eventName = event?.name ?? "Unknown Event";
    const exportLaps = [...eventLaps];

    let content = "TrackReady Lap Notes\n";
    content += `Event: ${eventName}\n`;
    content += `Date: ${event?.date ?? ""}\n`;
    content += `Exported: ${new Date().toLocaleString()}\n`;
    content += `${"=".repeat(50)}\n\n`;

    const sessions = [...new Set(exportLaps.map((l) => l.sessionName))];
    for (const session of sessions) {
      const sessionLaps = exportLaps.filter((l) => l.sessionName === session);
      content += `Session: ${session}\n${"-".repeat(30)}\n`;
      for (const lap of sessionLaps) {
        const isBest = lap.id === bestLapId;
        content += `Lap ${lap.lapNumber}: ${lap.lapTime}${isBest ? " *** BEST ***" : ""}`;
        if (lap.notes) content += `\n  Notes: ${lap.notes}`;
        content += "\n";
      }
      content += "\n";
    }

    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${eventName.replace(/[^a-z0-9]/gi, "_")}_laps.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Lap notes exported!");
  };

  const selectedEvent = events.find((e) => e.id === selectedEventId);

  return (
    <div className="p-4 lg:p-8 max-w-4xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-white">
            Lap Notes
          </h1>
          <p className="text-zinc-400 text-sm mt-1">
            Record and analyze your lap times
          </p>
        </div>
        {selectedEventId && eventLaps.length > 0 && (
          <button
            type="button"
            data-ocid="lap_notes.export.button"
            onClick={handleExport}
            className="flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white px-4 py-2.5 rounded-xl font-semibold text-sm transition-all border border-zinc-700"
          >
            <Download className="w-4 h-4" />
            <span className="hidden sm:inline">Export</span>
          </button>
        )}
      </div>

      {/* Event Selector */}
      <div className="mb-6">
        <label
          htmlFor="lap-notes-event-select"
          className="block text-xs font-semibold text-zinc-400 mb-2 uppercase tracking-wide"
        >
          Select Event
        </label>
        <select
          id="lap-notes-event-select"
          data-ocid="lap_notes.event.select"
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

      {!selectedEventId ? (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-12 text-center">
          <Timer className="w-12 h-12 text-zinc-700 mx-auto mb-4" />
          <p className="text-zinc-500 text-sm">
            Select an event to view or add lap notes.
          </p>
        </div>
      ) : loading ? (
        <div
          data-ocid="lap_notes.loading_state"
          className="bg-zinc-900 border border-zinc-800 rounded-2xl p-12 flex flex-col items-center justify-center gap-3"
        >
          <Loader2 className="w-8 h-8 text-[#FF6B00] animate-spin" />
          <p className="text-zinc-500 text-sm">Loading laps…</p>
        </div>
      ) : (
        <div className="grid lg:grid-cols-5 gap-6">
          {/* Add Lap Form */}
          <div className="lg:col-span-2">
            <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-5 sticky top-4">
              <h2 className="font-bold text-white mb-4 flex items-center gap-2">
                <Plus className="w-4 h-4 text-[#FF6B00]" />
                Add Lap
              </h2>
              <form
                onSubmit={(e) => void handleAddLap(e)}
                className="space-y-3"
              >
                <div>
                  <label
                    htmlFor="lap-session-name"
                    className="block text-xs font-semibold text-zinc-400 mb-1.5 uppercase tracking-wide"
                  >
                    Session Name
                  </label>
                  <input
                    id="lap-session-name"
                    data-ocid="lap_notes.session_name.input"
                    type="text"
                    value={sessionName}
                    onChange={(e) => setSessionName(e.target.value)}
                    placeholder="Session 1"
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-[#FF6B00] transition-colors"
                  />
                </div>

                <div>
                  <label
                    htmlFor="lap-number"
                    className="block text-xs font-semibold text-zinc-400 mb-1.5 uppercase tracking-wide"
                  >
                    Lap Number
                  </label>
                  <input
                    id="lap-number"
                    type="number"
                    value={nextLapNumber}
                    readOnly
                    className="w-full bg-zinc-800/50 border border-zinc-700 rounded-lg px-3 py-2.5 text-sm text-zinc-500 cursor-not-allowed font-mono"
                  />
                </div>

                <div>
                  <label
                    htmlFor="lap-time"
                    className="block text-xs font-semibold text-zinc-400 mb-1.5 uppercase tracking-wide"
                  >
                    Lap Time (M:SS.ms) *
                  </label>
                  <input
                    id="lap-time"
                    data-ocid="lap_notes.lap_time.input"
                    type="text"
                    value={lapTime}
                    onChange={(e) => {
                      setLapTime(e.target.value);
                      if (lapTimeError)
                        setLapTimeError(validateLapTime(e.target.value));
                    }}
                    placeholder="1:42.831"
                    className={`w-full bg-zinc-800 border rounded-lg px-3 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none transition-colors font-mono ${
                      lapTimeError
                        ? "border-red-500 focus:border-red-400"
                        : "border-zinc-700 focus:border-[#FF6B00]"
                    }`}
                    required
                  />
                  {lapTimeError && (
                    <p
                      data-ocid="lap_notes.lap_time.error_state"
                      className="text-red-400 text-xs mt-1"
                    >
                      {lapTimeError}
                    </p>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="lap-notes-textarea"
                    className="block text-xs font-semibold text-zinc-400 mb-1.5 uppercase tracking-wide"
                  >
                    Notes
                  </label>
                  <textarea
                    id="lap-notes-textarea"
                    data-ocid="lap_notes.notes.textarea"
                    value={lapNotes}
                    onChange={(e) => setLapNotes(e.target.value)}
                    placeholder="Observations, incidents, setup feedback..."
                    rows={3}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-[#FF6B00] transition-colors resize-none"
                  />
                </div>

                <button
                  type="submit"
                  data-ocid="lap_notes.add.button"
                  disabled={saving}
                  className="w-full bg-[#FF6B00] hover:bg-[#e05e00] disabled:opacity-60 text-white px-4 py-2.5 rounded-xl font-semibold text-sm transition-colors flex items-center justify-center gap-2"
                >
                  {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                  Log Lap
                </button>
              </form>
            </div>
          </div>

          {/* Lap Table */}
          <div className="lg:col-span-3">
            {eventLaps.length === 0 ? (
              <div
                data-ocid="lap_notes.laps.empty_state"
                className="bg-zinc-900 border border-zinc-800 rounded-xl p-10 text-center"
              >
                <Timer className="w-10 h-10 text-zinc-700 mx-auto mb-3" />
                <p className="text-zinc-500 text-sm">No laps logged yet.</p>
              </div>
            ) : (
              <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
                <div className="px-5 py-4 border-b border-zinc-800 flex items-center justify-between">
                  <h3 className="font-semibold text-white text-sm">
                    {selectedEvent?.name} — {eventLaps.length} lap
                    {eventLaps.length !== 1 ? "s" : ""}
                  </h3>
                  {bestLapId && (
                    <div className="flex items-center gap-1.5 text-xs text-yellow-400">
                      <Trophy className="w-3.5 h-3.5" />
                      <span className="font-mono font-bold">
                        {eventLaps.find((l) => l.id === bestLapId)?.lapTime}
                      </span>
                    </div>
                  )}
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-zinc-950/50">
                        <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wide w-16">
                          Lap
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wide w-32">
                          Time
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-semibold text-zinc-500 uppercase tracking-wide">
                          Notes
                        </th>
                        <th className="px-4 py-3 w-10" />
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-800/50">
                      {eventLaps.map((lap, idx) => {
                        const isBest = lap.id === bestLapId;
                        return (
                          <tr
                            key={lap.id}
                            data-ocid={`lap_notes.item.${idx + 1}`}
                            className={`transition-colors ${
                              isBest
                                ? "bg-yellow-500/5 border-l-2 border-l-yellow-400"
                                : "hover:bg-zinc-800/30"
                            }`}
                          >
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-1.5">
                                {isBest && (
                                  <Trophy className="w-3 h-3 text-yellow-400 flex-shrink-0" />
                                )}
                                <span className="font-mono text-sm font-bold text-zinc-300">
                                  {lap.lapNumber}
                                </span>
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <span
                                className={`font-mono text-sm font-bold ${
                                  isBest ? "text-yellow-400" : "text-white"
                                }`}
                              >
                                {lap.lapTime}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              <span className="text-xs text-zinc-500 line-clamp-1">
                                {lap.notes || (
                                  <span className="text-zinc-700">—</span>
                                )}
                              </span>
                            </td>
                            <td className="px-4 py-3">
                              {deleteConfirm === lap.id ? (
                                <div className="flex items-center gap-1">
                                  <button
                                    type="button"
                                    data-ocid={`lap_notes.delete_button.${idx + 1}`}
                                    onClick={() => void handleDelete(lap.id)}
                                    className="text-red-400 hover:text-red-300 p-1 transition-colors text-xs font-semibold"
                                  >
                                    Yes
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => setDeleteConfirm(null)}
                                    className="text-zinc-500 hover:text-white p-1 transition-colors"
                                  >
                                    <X className="w-3 h-3" />
                                  </button>
                                </div>
                              ) : (
                                <button
                                  type="button"
                                  data-ocid={`lap_notes.delete_button.${idx + 1}`}
                                  onClick={() => setDeleteConfirm(lap.id)}
                                  className="text-zinc-600 hover:text-red-400 p-1 transition-colors"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
