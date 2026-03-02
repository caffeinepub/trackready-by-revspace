import {
  AlertTriangle,
  ArrowRight,
  Calendar,
  Car,
  ClipboardCheck,
  Loader2,
  Plus,
  Zap,
} from "lucide-react";
import { useCars } from "../hooks/useCars";
import { useEvents } from "../hooks/useEvents";
import { useWear } from "../hooks/useWear";
import { useAppStore } from "../store/appStore";

function EventTypeBadge({ type }: { type: string }) {
  const colors: Record<string, string> = {
    "Track Day": "bg-blue-500/15 text-blue-400 border-blue-500/20",
    Autocross: "bg-green-500/15 text-green-400 border-green-500/20",
    "Drag Race": "bg-[#FF6B00]/15 text-[#FF6B00] border-[#FF6B00]/20",
    Drifting: "bg-purple-500/15 text-purple-400 border-purple-500/20",
  };
  return (
    <span
      className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${colors[type] ?? "bg-zinc-700 text-zinc-300"}`}
    >
      {type}
    </span>
  );
}

export function Dashboard() {
  const setView = useAppStore((s) => s.setView);
  const setSelectedEventId = useAppStore((s) => s.setSelectedEventId);
  const { cars, loading: carsLoading } = useCars();
  const { events, loading: eventsLoading } = useEvents();
  const { getCriticalCount } = useWear();

  const now = new Date();
  const upcomingEvents = events
    .filter((e) => new Date(e.date) >= now)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const lastEvent = events
    .filter((e) => new Date(e.date) < now)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];

  const criticalCount = getCriticalCount();

  const getCarName = (carId: string) => {
    const car = cars.find((c) => c.id === carId);
    return car ? `${car.year} ${car.make} ${car.model}` : "Unknown Car";
  };

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const daysUntil = (dateStr: string) => {
    const diff = Math.ceil(
      (new Date(dateStr).getTime() - now.getTime()) / (1000 * 60 * 60 * 24),
    );
    if (diff === 0) return "Today";
    if (diff === 1) return "Tomorrow";
    if (diff < 0) return `${Math.abs(diff)}d ago`;
    return `In ${diff}d`;
  };

  const handleNavigateToChecklist = (eventId: string) => {
    setSelectedEventId(eventId);
    setView("checklist");
  };

  const isLoading = carsLoading || eventsLoading;

  return (
    <div className="p-4 lg:p-8 max-w-6xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-2 mb-1">
          <Zap className="w-5 h-5 text-[#FF6B00]" />
          <span className="text-xs font-semibold text-[#FF6B00] tracking-widest uppercase">
            TrackReady
          </span>
        </div>
        <h1 className="text-2xl lg:text-3xl font-bold text-white">Dashboard</h1>
        <p className="text-zinc-400 text-sm mt-1">Your race prep at a glance</p>
      </div>

      {/* Loading state */}
      {isLoading ? (
        <div
          data-ocid="dashboard.loading_state"
          className="flex flex-col items-center justify-center py-20 gap-3"
        >
          <Loader2 className="w-8 h-8 text-[#FF6B00] animate-spin" />
          <p className="text-zinc-500 text-sm">Loading your garage…</p>
        </div>
      ) : (
        <>
          {/* Critical Alert Banner */}
          {criticalCount > 0 && (
            <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/25 flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-red-400 flex-shrink-0" />
              <div className="flex-1">
                <p className="text-red-400 font-semibold text-sm">
                  {criticalCount} Critical Wear Alert
                  {criticalCount > 1 ? "s" : ""}
                </p>
                <p className="text-red-400/70 text-xs">
                  One or more components require immediate attention before your
                  next event.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setView("wear")}
                data-ocid="dashboard.wear.link"
                className="text-xs text-red-400 hover:text-red-300 font-semibold flex items-center gap-1 transition-colors"
              >
                Review <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          )}

          {/* Stats Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 mb-8">
            <div
              data-ocid="dashboard.upcoming_events.card"
              className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 hover:border-zinc-700 transition-colors"
            >
              <div className="flex items-center gap-2 mb-3">
                <Calendar className="w-4 h-4 text-blue-400" />
                <span className="text-xs text-zinc-500 font-medium">
                  Upcoming
                </span>
              </div>
              <div className="text-3xl font-bold text-white font-mono">
                {upcomingEvents.length}
              </div>
              <div className="text-xs text-zinc-500 mt-1">events scheduled</div>
            </div>

            <div
              data-ocid="dashboard.last_event.card"
              className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 hover:border-zinc-700 transition-colors"
            >
              <div className="flex items-center gap-2 mb-3">
                <Zap className="w-4 h-4 text-[#FF6B00]" />
                <span className="text-xs text-zinc-500 font-medium">
                  Last Event
                </span>
              </div>
              {lastEvent ? (
                <>
                  <div className="text-sm font-bold text-white truncate">
                    {lastEvent.name}
                  </div>
                  <div className="text-xs text-zinc-500 mt-1">
                    {formatDate(lastEvent.date)}
                  </div>
                </>
              ) : (
                <div className="text-sm text-zinc-600">No past events</div>
              )}
            </div>

            <div
              data-ocid="dashboard.critical_alerts.card"
              className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 hover:border-zinc-700 transition-colors col-span-2 lg:col-span-1"
            >
              <div className="flex items-center gap-2 mb-3">
                <AlertTriangle
                  className={`w-4 h-4 ${criticalCount > 0 ? "text-red-400" : "text-zinc-600"}`}
                />
                <span className="text-xs text-zinc-500 font-medium">
                  Wear Alerts
                </span>
              </div>
              <div
                className={`text-3xl font-bold font-mono ${criticalCount > 0 ? "text-red-400" : "text-white"}`}
              >
                {criticalCount}
              </div>
              <div className="text-xs text-zinc-500 mt-1">
                critical wear items
              </div>
            </div>
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            {/* Upcoming Events */}
            <div className="lg:col-span-2">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider">
                  Upcoming Events
                </h2>
                <button
                  type="button"
                  onClick={() => setView("events")}
                  data-ocid="dashboard.events.link"
                  className="text-xs text-[#FF6B00] hover:text-[#e05e00] flex items-center gap-1 transition-colors"
                >
                  View all <ArrowRight className="w-3 h-3" />
                </button>
              </div>

              {upcomingEvents.length === 0 ? (
                <div
                  data-ocid="dashboard.events.empty_state"
                  className="bg-zinc-900 border border-zinc-800 rounded-xl p-8 text-center"
                >
                  <Calendar className="w-8 h-8 text-zinc-600 mx-auto mb-3" />
                  <p className="text-zinc-500 text-sm">No upcoming events</p>
                  <button
                    type="button"
                    onClick={() => setView("events")}
                    data-ocid="dashboard.new_event.button"
                    className="mt-3 text-xs text-[#FF6B00] hover:text-[#e05e00] transition-colors"
                  >
                    Create your first event →
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {upcomingEvents.slice(0, 3).map((event, idx) => (
                    <div
                      key={event.id}
                      data-ocid={`events.item.${idx + 1}`}
                      className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 hover:border-zinc-700 transition-all duration-150 group"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1 flex-wrap">
                            <EventTypeBadge type={event.type} />
                            <span className="text-xs text-zinc-500">
                              {daysUntil(event.date)}
                            </span>
                          </div>
                          <h3 className="font-semibold text-white truncate">
                            {event.name}
                          </h3>
                          <p className="text-xs text-zinc-500 mt-0.5">
                            {event.location}
                          </p>
                          <p className="text-xs text-zinc-600 mt-0.5">
                            {getCarName(event.carId)}
                          </p>
                        </div>
                        <div className="text-right flex-shrink-0">
                          <div className="text-sm font-semibold text-zinc-300">
                            {formatDate(event.date)}
                          </div>
                          <button
                            type="button"
                            onClick={() => handleNavigateToChecklist(event.id)}
                            className="mt-2 text-xs text-[#FF6B00] opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            Open checklist →
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Quick Actions */}
            <div>
              <h2 className="text-sm font-semibold text-zinc-300 uppercase tracking-wider mb-4">
                Quick Actions
              </h2>
              <div className="space-y-2">
                <button
                  type="button"
                  data-ocid="dashboard.new_event.button"
                  onClick={() => setView("events")}
                  className="w-full flex items-center gap-3 bg-[#FF6B00] hover:bg-[#e05e00] text-white px-4 py-3 rounded-xl font-medium text-sm transition-all duration-150"
                >
                  <Plus className="w-4 h-4" />
                  New Event
                </button>
                <button
                  type="button"
                  data-ocid="dashboard.add_car.button"
                  onClick={() => setView("cars")}
                  className="w-full flex items-center gap-3 bg-zinc-800 hover:bg-zinc-700 text-white px-4 py-3 rounded-xl font-medium text-sm transition-all duration-150"
                >
                  <Car className="w-4 h-4 text-zinc-400" />
                  Add Car
                </button>
                <button
                  type="button"
                  data-ocid="dashboard.new_checklist.button"
                  onClick={() => setView("checklist")}
                  className="w-full flex items-center gap-3 bg-zinc-800 hover:bg-zinc-700 text-white px-4 py-3 rounded-xl font-medium text-sm transition-all duration-150"
                >
                  <ClipboardCheck className="w-4 h-4 text-zinc-400" />
                  New Checklist
                </button>
              </div>

              {/* Car Overview */}
              {cars.length > 0 && (
                <div className="mt-6">
                  <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wider mb-3">
                    Your Cars
                  </h3>
                  <div className="space-y-2">
                    {cars.map((car) => (
                      <div
                        key={car.id}
                        className="bg-zinc-900 border border-zinc-800 rounded-lg p-3 flex items-center gap-3"
                      >
                        <Car className="w-4 h-4 text-zinc-500 flex-shrink-0" />
                        <div className="min-w-0">
                          <div className="text-sm font-medium text-white truncate">
                            {car.nickname ||
                              `${car.year} ${car.make} ${car.model}`}
                          </div>
                          <div className="text-xs text-zinc-500 truncate">
                            {car.year} {car.make} {car.model}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {/* Footer */}
      <footer className="mt-12 pt-6 border-t border-zinc-900 text-center">
        <p className="text-xs text-zinc-700">
          © {new Date().getFullYear()}.{" "}
          <a
            href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-zinc-500 transition-colors"
          >
            Built with ♥ using caffeine.ai
          </a>
        </p>
      </footer>
    </div>
  );
}
