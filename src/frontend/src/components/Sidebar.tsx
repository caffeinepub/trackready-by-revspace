import {
  Activity,
  Calendar,
  Car,
  ClipboardCheck,
  Gauge,
  LayoutDashboard,
  LogOut,
  Timer,
  Zap,
} from "lucide-react";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { type AppView, useAppStore } from "../store/appStore";

const navItems: {
  label: string;
  view: AppView;
  icon: React.ElementType;
  ocid: string;
}[] = [
  {
    label: "Dashboard",
    view: "dashboard",
    icon: LayoutDashboard,
    ocid: "nav.dashboard.link",
  },
  { label: "Events", view: "events", icon: Calendar, ocid: "nav.events.link" },
  { label: "Cars", view: "cars", icon: Car, ocid: "nav.cars.link" },
  {
    label: "Checklist",
    view: "checklist",
    icon: ClipboardCheck,
    ocid: "nav.checklist.link",
  },
  {
    label: "Tire Logs",
    view: "tire-logs",
    icon: Gauge,
    ocid: "nav.tire_logs.link",
  },
  {
    label: "Lap Notes",
    view: "lap-notes",
    icon: Timer,
    ocid: "nav.lap_notes.link",
  },
  {
    label: "Wear Tracker",
    view: "wear",
    icon: Activity,
    ocid: "nav.wear.link",
  },
];

function truncatePrincipal(principal: string): string {
  if (principal.length <= 16) return principal;
  return `${principal.slice(0, 8)}…${principal.slice(-5)}`;
}

export function Sidebar() {
  const { currentView, setView } = useAppStore();
  const { identity, clear } = useInternetIdentity();
  const principal = identity?.getPrincipal().toString() ?? "";

  return (
    <aside className="hidden lg:flex flex-col w-60 min-h-screen bg-zinc-950 border-r border-zinc-800 flex-shrink-0">
      {/* Branding */}
      <div className="px-5 py-6 border-b border-zinc-800">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#FF6B00] flex items-center justify-center flex-shrink-0">
            <Zap className="w-4 h-4 text-white" />
          </div>
          <div>
            <div className="font-bold text-lg leading-tight text-white tracking-tight">
              TrackReady
            </div>
            <div className="text-[10px] text-zinc-500 leading-tight">
              by RevSpace
            </div>
          </div>
        </div>
        <p className="mt-2 text-[11px] text-zinc-500 leading-snug">
          Prep Your Car for Events
        </p>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.view;
          return (
            <button
              key={item.view}
              type="button"
              data-ocid={item.ocid}
              onClick={() => setView(item.view)}
              className={`
                w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium
                transition-all duration-150 text-left
                ${
                  isActive
                    ? "bg-[#FF6B00]/15 text-[#FF6B00] border border-[#FF6B00]/20"
                    : "text-zinc-400 hover:text-white hover:bg-zinc-800/60"
                }
              `}
            >
              <Icon
                className={`w-4 h-4 flex-shrink-0 ${isActive ? "text-[#FF6B00]" : "text-zinc-500"}`}
              />
              {item.label}
              {isActive && (
                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-[#FF6B00]" />
              )}
            </button>
          );
        })}
      </nav>

      {/* Identity & Sign Out */}
      <div className="px-3 py-3 border-t border-zinc-800">
        {principal && (
          <div className="px-3 py-2 mb-1 rounded-lg bg-zinc-900">
            <p className="text-[10px] text-zinc-600 mb-0.5">Signed in as</p>
            <p className="text-[11px] text-zinc-400 font-mono truncate">
              {truncatePrincipal(principal)}
            </p>
          </div>
        )}
        <button
          type="button"
          data-ocid="nav.sign_out.button"
          onClick={clear}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-zinc-500 hover:text-red-400 hover:bg-red-500/10 transition-all duration-150 text-left"
        >
          <LogOut className="w-4 h-4 flex-shrink-0" />
          Sign Out
        </button>
      </div>

      {/* Footer */}
      <div className="px-5 py-4 border-t border-zinc-800">
        <p className="text-[10px] text-zinc-600 leading-snug">
          © {new Date().getFullYear()}.{" "}
          <a
            href={`https://caffeine.ai?utm_source=caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="hover:text-zinc-400 transition-colors"
          >
            Built with caffeine.ai
          </a>
        </p>
      </div>
    </aside>
  );
}
