import {
  Activity,
  Calendar,
  Car,
  ClipboardCheck,
  LayoutDashboard,
  LogOut,
} from "lucide-react";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { type AppView, useAppStore } from "../store/appStore";

const mobileNavItems: {
  label: string;
  view: AppView;
  icon: React.ElementType;
  ocid: string;
}[] = [
  {
    label: "Home",
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
  { label: "Wear", view: "wear", icon: Activity, ocid: "nav.wear.link" },
];

export function MobileNav() {
  const { currentView, setView } = useAppStore();
  const { clear } = useInternetIdentity();

  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 z-50 bg-zinc-950 border-t border-zinc-800">
      <div className="flex items-center justify-around px-2 py-2">
        {mobileNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.view;
          return (
            <button
              key={item.view}
              type="button"
              data-ocid={item.ocid}
              onClick={() => setView(item.view)}
              className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg transition-all duration-150 min-w-[48px]
                ${isActive ? "text-[#FF6B00]" : "text-zinc-500"}`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px] font-medium">{item.label}</span>
            </button>
          );
        })}
        {/* Sign out */}
        <button
          type="button"
          data-ocid="nav.sign_out.button"
          onClick={clear}
          className="flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-lg transition-all duration-150 min-w-[48px] text-zinc-600 hover:text-red-400"
        >
          <LogOut className="w-5 h-5" />
          <span className="text-[10px] font-medium">Out</span>
        </button>
      </div>
    </nav>
  );
}
