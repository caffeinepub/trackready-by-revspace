import {
  Calendar,
  Car as CarIcon,
  Check,
  Loader2,
  Pencil,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useCars } from "../hooks/useCars";
import { useEvents } from "../hooks/useEvents";
import type { Car } from "../types";

interface CarFormData {
  make: string;
  model: string;
  year: number;
  nickname: string;
  notes: string;
}

const emptyForm: CarFormData = {
  make: "",
  model: "",
  year: new Date().getFullYear(),
  nickname: "",
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

export function Cars() {
  const { cars, loading, addCar, updateCar, deleteCar } = useCars();
  const { events } = useEvents();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<CarFormData>(emptyForm);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const getEventCount = (carId: string) =>
    events.filter((e) => e.carId === carId).length;

  const getUpcomingEventCount = (carId: string) => {
    const now = new Date();
    return events.filter((e) => e.carId === carId && new Date(e.date) >= now)
      .length;
  };

  const handleOpenAdd = () => {
    setEditingId(null);
    setForm(emptyForm);
    setShowForm(true);
  };

  const handleOpenEdit = (car: Car) => {
    setEditingId(car.id);
    setForm({
      make: car.make,
      model: car.model,
      year: car.year,
      nickname: car.nickname,
      notes: car.notes,
    });
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.make.trim() || !form.model.trim()) {
      toast.error("Make and model are required");
      return;
    }
    setSaving(true);
    try {
      if (editingId) {
        await updateCar(editingId, form);
        toast.success("Car updated");
      } else {
        await addCar(form);
        toast.success("Car added!");
      }
      setShowForm(false);
      setEditingId(null);
    } catch {
      toast.error("Failed to save car");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteCar(id);
      setDeleteConfirm(null);
      toast.success("Car removed");
    } catch {
      toast.error("Failed to delete car");
    }
  };

  return (
    <div className="p-4 lg:p-8 max-w-5xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-white">Cars</h1>
          <p className="text-zinc-400 text-sm mt-1">
            Manage your vehicle profiles
          </p>
        </div>
        <button
          type="button"
          data-ocid="cars.add.button"
          onClick={handleOpenAdd}
          className="flex items-center gap-2 bg-[#FF6B00] hover:bg-[#e05e00] text-white px-4 py-2.5 rounded-xl font-semibold text-sm transition-all shadow-glow-sm"
        >
          <Plus className="w-4 h-4" />
          <span className="hidden sm:inline">Add Car</span>
        </button>
      </div>

      {/* Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div
            data-ocid="cars.modal"
            className="bg-zinc-900 border border-zinc-700 rounded-2xl w-full max-w-lg shadow-2xl animate-slide-in"
          >
            <div className="flex items-center justify-between p-5 border-b border-zinc-800">
              <h2 className="font-bold text-lg text-white">
                {editingId ? "Edit Car" : "Add Car"}
              </h2>
              <button
                type="button"
                data-ocid="cars.modal.close_button"
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
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <FieldLabel htmlFor="car-year">Year *</FieldLabel>
                  <input
                    id="car-year"
                    data-ocid="cars.year.input"
                    type="number"
                    value={form.year}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, year: Number(e.target.value) }))
                    }
                    min={1900}
                    max={new Date().getFullYear() + 2}
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2.5 text-sm text-white focus:outline-none focus:border-[#FF6B00] transition-colors font-mono"
                    required
                  />
                </div>
                <div>
                  <FieldLabel htmlFor="car-make">Make *</FieldLabel>
                  <input
                    id="car-make"
                    data-ocid="cars.make.input"
                    type="text"
                    value={form.make}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, make: e.target.value }))
                    }
                    placeholder="Subaru"
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-[#FF6B00] transition-colors"
                    required
                  />
                </div>
                <div>
                  <FieldLabel htmlFor="car-model">Model *</FieldLabel>
                  <input
                    id="car-model"
                    data-ocid="cars.model.input"
                    type="text"
                    value={form.model}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, model: e.target.value }))
                    }
                    placeholder="WRX STI"
                    className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-[#FF6B00] transition-colors"
                    required
                  />
                </div>
              </div>

              <div>
                <FieldLabel htmlFor="car-nickname">Nickname</FieldLabel>
                <input
                  id="car-nickname"
                  data-ocid="cars.nickname.input"
                  type="text"
                  value={form.nickname}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, nickname: e.target.value }))
                  }
                  placeholder="e.g. Gravel King, Weekend Warrior"
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-[#FF6B00] transition-colors"
                />
              </div>

              <div>
                <FieldLabel htmlFor="car-notes">Notes</FieldLabel>
                <textarea
                  id="car-notes"
                  data-ocid="cars.notes.textarea"
                  value={form.notes}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, notes: e.target.value }))
                  }
                  placeholder="Mods, setup notes, maintenance history..."
                  rows={3}
                  className="w-full bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2.5 text-sm text-white placeholder-zinc-600 focus:outline-none focus:border-[#FF6B00] transition-colors resize-none"
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  data-ocid="cars.modal.cancel_button"
                  onClick={() => setShowForm(false)}
                  className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 px-4 py-2.5 rounded-xl font-semibold text-sm transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  data-ocid="cars.modal.submit_button"
                  disabled={saving}
                  className="flex-1 bg-[#FF6B00] hover:bg-[#e05e00] disabled:opacity-60 text-white px-4 py-2.5 rounded-xl font-semibold text-sm transition-colors flex items-center justify-center gap-2"
                >
                  {saving && <Loader2 className="w-4 h-4 animate-spin" />}
                  {editingId ? "Save Changes" : "Add Car"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Loading State */}
      {loading ? (
        <div
          data-ocid="cars.loading_state"
          className="flex flex-col items-center justify-center py-20 gap-3"
        >
          <Loader2 className="w-8 h-8 text-[#FF6B00] animate-spin" />
          <p className="text-zinc-500 text-sm">Loading cars…</p>
        </div>
      ) : cars.length === 0 ? (
        <div
          data-ocid="cars.empty_state"
          className="bg-zinc-900 border border-zinc-800 rounded-2xl p-12 text-center"
        >
          <CarIcon className="w-12 h-12 text-zinc-700 mx-auto mb-4" />
          <h3 className="text-zinc-400 font-semibold mb-2">No cars yet</h3>
          <p className="text-zinc-600 text-sm mb-4">
            Add your first car to link events and track wear.
          </p>
          <button
            type="button"
            data-ocid="cars.add.button"
            onClick={handleOpenAdd}
            className="inline-flex items-center gap-2 bg-[#FF6B00] hover:bg-[#e05e00] text-white px-5 py-2.5 rounded-xl font-semibold text-sm transition-colors"
          >
            <Plus className="w-4 h-4" />
            Add Car
          </button>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {cars.map((car, idx) => (
            <div
              key={car.id}
              data-ocid={`cars.item.${idx + 1}`}
              className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden hover:border-zinc-700 transition-all duration-150 group"
            >
              <div className="h-1 bg-gradient-to-r from-[#FF6B00] to-[#FF6B00]/30" />
              <div className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl bg-zinc-800 flex items-center justify-center">
                    <CarIcon className="w-5 h-5 text-[#FF6B00]" />
                  </div>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      type="button"
                      data-ocid={`cars.edit_button.${idx + 1}`}
                      onClick={() => handleOpenEdit(car)}
                      className="p-1.5 text-zinc-500 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
                    >
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    {deleteConfirm === car.id ? (
                      <>
                        <button
                          type="button"
                          data-ocid={`cars.delete_button.${idx + 1}`}
                          onClick={() => void handleDelete(car.id)}
                          className="p-1.5 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-lg transition-colors"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setDeleteConfirm(null)}
                          className="p-1.5 text-zinc-500 hover:text-white hover:bg-zinc-800 rounded-lg transition-colors"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </>
                    ) : (
                      <button
                        type="button"
                        data-ocid={`cars.delete_button.${idx + 1}`}
                        onClick={() => setDeleteConfirm(car.id)}
                        className="p-1.5 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                {car.nickname && (
                  <div className="text-[#FF6B00] text-xs font-bold uppercase tracking-widest mb-1">
                    {car.nickname}
                  </div>
                )}
                <h3 className="font-bold text-white text-lg leading-tight">
                  {car.year} {car.make} {car.model}
                </h3>

                <div className="mt-3 flex items-center gap-3">
                  <div className="flex items-center gap-1.5 text-xs text-zinc-500">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>
                      {getEventCount(car.id)} event
                      {getEventCount(car.id) !== 1 ? "s" : ""}
                    </span>
                  </div>
                  {getUpcomingEventCount(car.id) > 0 && (
                    <span className="text-xs bg-[#FF6B00]/15 text-[#FF6B00] px-2 py-0.5 rounded-full font-medium">
                      {getUpcomingEventCount(car.id)} upcoming
                    </span>
                  )}
                </div>

                {car.notes && (
                  <p className="mt-3 text-xs text-zinc-500 line-clamp-2">
                    {car.notes}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
