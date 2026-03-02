import {
  Calendar,
  Car as CarIcon,
  Check,
  Loader2,
  MapPin,
  Pencil,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useCars } from "../hooks/useCars";
import { useEvents } from "../hooks/useEvents";
import type { EventType, TrackEvent } from "../types";

function EventTypeBadge({ type }: { type: EventType }) {
  const styles: Record<EventType, string> = {
    "Track Day": "bg-blue-500/15 text-blue-400 border-blue-500/20",
    Autocross: "bg-green-500/15 text-green-400 border-green-500/20",
    "Drag Race": "bg-[#FF6B00]/15 text-[#FF6B00] border-[#FF6B00]/20",
    Drifting: "bg-purple-500/15 text-purple-400 border-purple-500/20",
  };
  return (
    <span
      className={`text-[10px] font-bold px-2 py-0.5 rounded-full border uppercase tracking-wide ${styles[type]}`}
    >
      {type}
    </span>
  );
}

const EVENT_TYPES: EventType[] = [
  "Track Day",
  "Autocross",
  "Drag Race",
  "Drifting",
];

interface EventFormData {
  name: string;
  date: string;
  type: EventType;
  location: string;
  carId: string;
  notes: string;
}

const emptyForm: EventFormData = {
  name: "",
  date: new Date().toISOString().split("T")[0],
  type: "Track Day",
  location: "",
  carId: "",
  notes: "",
};

function FieldLabel({
  htmlFor,
  children,
}: { htmlFor: string; children: React.ReactNode }) {
  return (
    <label
      htmlFor={htmlFor}
      className="block text-xs font-semibold text-zinc-400 mb-1.5 uppercase tracking-wide"
    >
      {children}
    </label>
  );
}

export function Events() {
  const { events, loading, addEvent, updateEvent, deleteEvent } = useEvents();
  const { cars } = useCars();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<EventFormData>(emptyForm);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const sortedEvents = [...events].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
  );
  const now = new Date();

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString("en-US", {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    });

  const daysLabel = (dateStr: string) => {
    const diff = Math.ceil(
      (new Date(dateStr).getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
    );
    if (diff === 0) return "Today";
    if (diff > 0) return `In ${diff} days`;
    return `${Math.abs(diff)} days ago`;
  };

  const getCarName = (carId: string) => {
    const car = cars.find((c) => c.id === carId);
    return car
      ? `${car.year} ${car.make} ${car.model}${car.nickname ? ` — ${car.nickname}` : ""}`
      : "—";
  };

  const handleOpenAdd = () => {
    setEditingId(null);
    setForm({ ...emptyForm, carId: cars[0]?.id ?? "" });
    setShowForm(true);
  };

  const handleOpenEdit = (event: TrackEvent) => {
    setEditingId(event.id);
    setForm({
      name: event.name,
      date: event.date,
      type: event.type,
      location: event.location,
      carId: event.carId,
      notes: event.notes,
    });
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim()) {
      toast.error("Event name is required");
      return;
    }
    setSaving(true);
    try {
      if (editingId) {
        await updateEvent(editingId, form);
        toast.success("Event updated");
      } else {
        await addEvent(form);
        toast.success("Event created!");
      }
      setShowForm(false);
      setEditingId(null);
    } catch {
      toast.error("Failed to save event");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteEvent(id);
      setDeleteConfirm(null);
      toast.success("Event deleted");
    } catch {
      toast.error("Failed to delete event");
    }
  };

  return (
    <div className="p-4 lg:p-8 max-w-5xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-white">Events</h1>
          <p className="text-zinc-400 text-sm mt-1">
            Manage your track days, autocross, and drag races
          </p>
        </div>
        <button
          type="button"
          data-ocid="events.add.button"
          onClick={handleOpenAdd}
          className="flex items-center gap-2 bg-[#FF6B00] hover:bg-[#e05e00] text-white px-4 py-2.5 rounded-xl font-semibold text-sm transition-all shadow-glow-sm"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">New Event</span>
        </button>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div
            data-ocid="events.modal"
            className="bg-zinc-900 border border-zinc-700 rounded-2xl w-full max-w-lg shadow-2xl animate-slide-in"
          >
            <div className="flex items-center justify-between p-5 border-b border-zinc-800">
              <h2 className="font-bold text-lg text-white">
                {editingId ? "Edit Event" : "New Event"}
              </h2>
              <button
                type="button"
                data-ocid="events.modal.close_button"
                onClick={() => setShowForm(false)}
                className="text-zinc-500 hover:text-white transition-colors p-1 rounded-lg hover:bg-zinc-800"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form
              onSubmit={(e) => void handleSubmit(e)}
              className="p-5 space-y-4"
            >
              <div>
                <FieldLabel htmlFor="event-name">Event Name *</FieldLabel>
                <input
                  id="event-name"
                  data-ocid="events.name.input"
                  type="text"
                  value={form.name}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, name: e.target.value }))
                  }
                  placeholder="e.g. Spring Thunderhill Track Day"
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-[#FF6B00] transition-colors"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <FieldLabel htmlFor="event-date">Date *</FieldLabel>
                  <input
                    id="event-date"
                    data-ocid="events.date.input"
                    type="date"
                    value={form.date}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, date: e.target.value }))
                    }
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#FF6B00] transition-colors"
                    required
                  />
                </div>
                <div>
                  <FieldLabel htmlFor="event-type">Type *</FieldLabel>
                  <select
                    id="event-type"
                    data-ocid="events.type.select"
                    value={form.type}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        type: e.target.value as EventType,
                      }))
                    }
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#FF6B00] transition-colors"
                  >
                    {EVENT_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <FieldLabel htmlFor="event-location">Location</FieldLabel>
                <input
                  id="event-location"
                  data-ocid="events.location.input"
                  type="text"
                  value={form.location}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, location: e.target.value }))
                  }
                  placeholder="e.g. Thunderhill Raceway, Willows CA"
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-[#FF6B00] transition-colors"
                />
              </div>

              <div>
                <FieldLabel htmlFor="event-car">Car</FieldLabel>
                <select
                  id="event-car"
                  data-ocid="events.car.select"
                  value={form.carId}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, carId: e.target.value }))
                  }
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#FF6B00] transition-colors"
                >
                  <option value="">— No car assigned —</option>
                  {cars.map((car) => (
                    <option key={car.id} value={car.id}>
                      {car.year} {car.make} {car.model}
                      {car.nickname ? ` (${car.nickname})` : ""}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <FieldLabel htmlFor="event-notes">Notes</FieldLabel>
                <textarea
                  id="event-notes"
                  data-ocid="events.notes.textarea"
                  value={form.notes}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, notes: e.target.value }))
                  }
                  placeholder="Additional notes..."
                  rows={3}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-[#FF6B00] transition-colors resize-none"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  data-ocid="events.modal.cancel_button"
                  onClick={() => setShowForm(false)}
                  className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-4 py-2.5 rounded-xl font-semibold text-sm transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  data-ocid="events.modal.submit_button"
                  disabled={saving}
                  className="flex-1 bg-[#FF6B00] hover:bg-[#e05e00] disabled:opacity-60 text-white px-4 py-2.5 rounded-xl font-semibold text-sm transition-colors flex items-center justify-center gap-2"
                >
                  {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                  {editingId ? "Save Changes" : "Create Event"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Loading state */}
      {loading ? (
        <div
          data-ocid="events.loading_state"
          className="flex flex-col items-center justify-center py-20 gap-3"
        >
          <Loader2 className="w-8 h-8 text-[#FF6B00] animate-spin" />
          <p className="text-zinc-500 text-sm">Loading events…</p>
        </div>
      ) : sortedEvents.length === 0 ? (
        <div
          data-ocid="events.empty_state"
          className="bg-zinc-900 border border-zinc-800 rounded-2xl p-12 text-center"
        >
          <Calendar className="w-12 h-12 text-zinc-700 mx-auto mb-4" />
          <h3 className="text-zinc-400 font-semibold mb-2">No events yet</h3>
          <p className="text-zinc-600 text-sm mb-4">
            Create your first track event to get started.
          </p>
          <button
            type="button"
            data-ocid="events.add.button"
            onClick={handleOpenAdd}
            className="inline-flex items-center gap-2 bg-[#FF6B00] hover:bg-[#e05e00] text-white px-5 py-2.5 rounded-xl font-semibold text-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            Create Event
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {sortedEvents.map((event, idx) => {
            const isPast = new Date(event.date) < now;
            return (
              <div
                key={event.id}
                data-ocid={`events.item.${idx + 1}`}
                className={`bg-zinc-900 border rounded-xl p-4 lg:p-5 hover:border-zinc-600 transition-all duration-150 ${
                  isPast ? "border-zinc-800 opacity-75" : "border-zinc-700"
                }`}
              >
                <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1.5">
                      <EventTypeBadge type={event.type} />
                      <span
                        className={`text-xs font-medium ${isPast ? "text-zinc-600" : "text-[#FF6B00]"}`}
                      >
                        {daysLabel(event.date)}
                      </span>
                    </div>
                    <h3 className="font-bold text-white text-base truncate">
                      {event.name}
                    </h3>
                    <div className="flex flex-wrap items-center gap-3 mt-1.5">
                      {event.location && (
                        <span className="flex items-center gap-1 text-xs text-zinc-500">
                          <MapPin className="w-3 h-3" />
                          {event.location}
                        </span>
                      )}
                      <span className="flex items-center gap-1 text-xs text-zinc-500">
                        <Calendar className="w-3 h-3" />
                        {formatDate(event.date)}
                      </span>
                      {event.carId && (
                        <span className="flex items-center gap-1 text-xs text-zinc-500">
                          <CarIcon className="w-3 h-3" />
                          {getCarName(event.carId)}
                        </span>
                      )}
                    </div>
                    {event.notes && (
                      <p className="mt-2 text-xs text-zinc-500 line-clamp-1">
                        {event.notes}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <button
                      type="button"
                      data-ocid={`events.edit_button.${idx + 1}`}
                      onClick={() => handleOpenEdit(event)}
                      className="p-2 text-zinc-500 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
                      title="Edit event"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                    {deleteConfirm === event.id ? (
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          data-ocid={`events.delete_button.${idx + 1}`}
                          onClick={() => void handleDelete(event.id)}
                          className="p-2 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors"
                          title="Confirm delete"
                        >
                          <Check className="w-4 h-4" />
                        </button>
                        <button
                          type="button"
                          data-ocid={`events.cancel_delete_button.${idx + 1}`}
                          onClick={() => setDeleteConfirm(null)}
                          className="p-2 text-zinc-500 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
                          title="Cancel"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        data-ocid={`events.delete_button.${idx + 1}`}
                        onClick={() => setDeleteConfirm(event.id)}
                        className="p-2 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                        title="Delete event"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
