import {
  CheckSquare,
  ChevronDown,
  ChevronRight,
  ClipboardCheck,
  Loader2,
  Plus,
  RotateCcw,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { useChecklist } from "../hooks/useChecklist";
import { useEvents } from "../hooks/useEvents";
import { useAppStore } from "../store/appStore";

const CATEGORY_ICONS: Record<string, string> = {
  Fluids: "🛢️",
  Brakes: "🔴",
  Tires: "⚫",
  Suspension: "🔧",
  "Safety Gear": "🪖",
  Engine: "⚙️",
  Electrical: "⚡",
};

export function Checklist() {
  const {
    loading,
    loadForEvent,
    getItemsForEvent,
    initializeDefaultChecklist,
    toggleItem,
    updateItem,
    resetChecklist,
    markAllDone,
  } = useChecklist();
  const { events } = useEvents();
  const { selectedEventId, setSelectedEventId } = useAppStore();
  const [collapsedCategories, setCollapsedCategories] = useState<Set<string>>(
    new Set(),
  );
  const [expandedNotes, setExpandedNotes] = useState<Set<string>>(new Set());

  // Load items when selected event changes
  useEffect(() => {
    if (selectedEventId) {
      void loadForEvent(selectedEventId);
    }
  }, [selectedEventId, loadForEvent]);

  const sortedEvents = [...events].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
  );

  const selectedEvent = events.find((e) => e.id === selectedEventId);
  const eventItems = selectedEventId ? getItemsForEvent(selectedEventId) : [];
  const totalItems = eventItems.length;
  const checkedItems = eventItems.filter((i) => i.checked).length;
  const completionPct =
    totalItems > 0 ? Math.round((checkedItems / totalItems) * 100) : 0;

  const categories = [...new Set(eventItems.map((i) => i.category))];

  const toggleCategory = (cat: string) => {
    setCollapsedCategories((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) next.delete(cat);
      else next.add(cat);
      return next;
    });
  };

  const toggleNotes = (id: string) => {
    setExpandedNotes((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleInitialize = async () => {
    if (!selectedEventId) return;
    try {
      await initializeDefaultChecklist(selectedEventId);
      toast.success("Default checklist initialized!");
    } catch {
      toast.error("Failed to initialize checklist");
    }
  };

  const handleMarkAllDone = async () => {
    if (!selectedEventId) return;
    try {
      await markAllDone(selectedEventId);
      toast.success("All items marked complete!");
    } catch {
      toast.error("Failed to update checklist");
    }
  };

  const handleReset = async () => {
    if (!selectedEventId) return;
    try {
      await resetChecklist(selectedEventId);
      toast.info("Checklist reset");
    } catch {
      toast.error("Failed to reset checklist");
    }
  };

  const handleToggle = async (id: string) => {
    try {
      await toggleItem(id);
    } catch {
      toast.error("Failed to update item");
    }
  };

  const handleUpdateNotes = async (id: string, notes: string) => {
    try {
      await updateItem(id, { notes });
    } catch {
      toast.error("Failed to save notes");
    }
  };

  return (
    <div className="p-4 lg:p-8 max-w-4xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl lg:text-3xl font-bold text-white">
          Pre-Event Checklist
        </h1>
        <p className="text-zinc-400 text-sm mt-1">
          Systematic prep for every event
        </p>
      </div>

      {/* Event Selector */}
      <div className="mb-6">
        <label
          htmlFor="checklist-event-select"
          className="block text-xs font-semibold text-zinc-400 mb-2 uppercase tracking-wide"
        >
          Select Event
        </label>
        <select
          id="checklist-event-select"
          data-ocid="checklist.event.select"
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
          <ClipboardCheck className="w-12 h-12 text-zinc-700 mx-auto mb-4" />
          <p className="text-zinc-500 text-sm">
            Select an event to view or manage its checklist.
          </p>
        </div>
      ) : loading ? (
        <div
          data-ocid="checklist.loading_state"
          className="bg-zinc-900 border border-zinc-800 rounded-2xl p-12 flex flex-col items-center justify-center gap-3"
        >
          <Loader2 className="w-8 h-8 text-[#FF6B00] animate-spin" />
          <p className="text-zinc-500 text-sm">Loading checklist…</p>
        </div>
      ) : eventItems.length === 0 ? (
        <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-12 text-center">
          <ClipboardCheck className="w-12 h-12 text-zinc-700 mx-auto mb-4" />
          <h3 className="text-zinc-300 font-semibold mb-2">No checklist yet</h3>
          <p className="text-zinc-500 text-sm mb-5">
            Initialize the default checklist with 34 pre-loaded items across 7
            categories.
          </p>
          <button
            type="button"
            data-ocid="checklist.init.button"
            onClick={() => void handleInitialize()}
            className="inline-flex items-center gap-2 bg-[#FF6B00] hover:bg-[#e05e00] text-white px-6 py-3 rounded-xl font-semibold text-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            Initialize Default Checklist
          </button>
        </div>
      ) : (
        <>
          {/* Progress Bar */}
          <div className="mb-6 bg-zinc-900 border border-zinc-800 rounded-xl p-5">
            <div className="flex items-center justify-between mb-3">
              <div>
                <span className="text-white font-bold text-xl font-mono">
                  {completionPct}%
                </span>
                <span className="text-zinc-500 text-sm ml-2">complete</span>
              </div>
              <span className="text-sm text-zinc-400 font-mono">
                {checkedItems}/{totalItems}
              </span>
            </div>
            <div className="h-2.5 bg-zinc-800 rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${completionPct}%`,
                  background:
                    completionPct === 100
                      ? "#22c55e"
                      : completionPct >= 60
                        ? "#FF6B00"
                        : "#ef4444",
                }}
              />
            </div>
            {completionPct === 100 && (
              <p className="text-green-400 text-xs mt-2 font-semibold">
                ✓ All items complete — ready to race!
              </p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-2 mb-6">
            <button
              type="button"
              data-ocid="checklist.mark_all.button"
              onClick={() => void handleMarkAllDone()}
              className="flex items-center gap-2 bg-green-500/10 hover:bg-green-500/20 text-green-400 border border-green-500/20 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              <CheckSquare className="w-4 h-4" />
              Mark All Done
            </button>
            <button
              type="button"
              data-ocid="checklist.reset.button"
              onClick={() => void handleReset()}
              className="flex items-center gap-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white border border-zinc-700 px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              <RotateCcw className="w-4 h-4" />
              Reset Checklist
            </button>
            <div className="ml-auto flex items-center gap-2">
              {selectedEvent && (
                <span className="text-xs text-zinc-500 bg-zinc-800 px-3 py-2 rounded-lg border border-zinc-700">
                  {selectedEvent.name}
                </span>
              )}
            </div>
          </div>

          {/* Category Groups */}
          <div className="space-y-3">
            {categories.map((category, catIdx) => {
              const catItems = eventItems.filter(
                (i) => i.category === category,
              );
              const catChecked = catItems.filter((i) => i.checked).length;
              const isCollapsed = collapsedCategories.has(category);
              const icon = CATEGORY_ICONS[category] ?? "📋";

              return (
                <div
                  key={category}
                  className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden"
                >
                  <button
                    type="button"
                    data-ocid={`checklist.category.toggle.${catIdx + 1}`}
                    onClick={() => toggleCategory(category)}
                    className="w-full flex items-center gap-3 px-4 py-3.5 hover:bg-zinc-800/50 transition-colors"
                  >
                    <span className="text-lg">{icon}</span>
                    <span className="font-semibold text-white flex-1 text-left">
                      {category}
                    </span>
                    <span
                      className={`text-xs font-mono px-2 py-0.5 rounded-full ${
                        catChecked === catItems.length
                          ? "bg-green-500/15 text-green-400"
                          : "bg-zinc-800 text-zinc-400"
                      }`}
                    >
                      {catChecked}/{catItems.length}
                    </span>
                    {isCollapsed ? (
                      <ChevronRight className="w-4 h-4 text-zinc-500" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-zinc-500" />
                    )}
                  </button>

                  {!isCollapsed && (
                    <div className="border-t border-zinc-800 divide-y divide-zinc-800/50">
                      {catItems.map((item) => {
                        const overallIdx = eventItems.indexOf(item) + 1;
                        const hasNotes = expandedNotes.has(item.id);
                        return (
                          <div
                            key={item.id}
                            data-ocid={`checklist.item.${overallIdx}`}
                            className={`px-4 py-3 transition-colors ${
                              item.checked
                                ? "bg-zinc-950/50"
                                : "hover:bg-zinc-800/30"
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <button
                                type="button"
                                data-ocid={`checklist.checkbox.${overallIdx}`}
                                onClick={() => void handleToggle(item.id)}
                                className={`w-5 h-5 rounded flex items-center justify-center flex-shrink-0 transition-all border ${
                                  item.checked
                                    ? "bg-[#FF6B00] border-[#FF6B00] text-white"
                                    : "border-zinc-600 hover:border-[#FF6B00]"
                                }`}
                              >
                                {item.checked && (
                                  <svg
                                    className="w-3 h-3"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                    strokeWidth={3}
                                    aria-hidden="true"
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      d="M5 13l4 4L19 7"
                                    />
                                  </svg>
                                )}
                              </button>
                              <span
                                className={`text-sm flex-1 ${
                                  item.checked
                                    ? "line-through text-zinc-600"
                                    : "text-zinc-200"
                                }`}
                              >
                                {item.name}
                              </span>
                              <button
                                type="button"
                                onClick={() => toggleNotes(item.id)}
                                className="text-xs text-zinc-600 hover:text-zinc-400 transition-colors px-2 py-0.5 rounded border border-zinc-800 hover:border-zinc-700"
                              >
                                {hasNotes ? "Hide note" : "Add note"}
                              </button>
                            </div>
                            {hasNotes && (
                              <div className="mt-2 ml-8">
                                <textarea
                                  data-ocid={`checklist.notes.textarea.${overallIdx}`}
                                  value={item.notes}
                                  onChange={(e) =>
                                    void handleUpdateNotes(
                                      item.id,
                                      e.target.value,
                                    )
                                  }
                                  placeholder="Notes..."
                                  rows={2}
                                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-[#FF6B00] transition-colors resize-none"
                                />
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
