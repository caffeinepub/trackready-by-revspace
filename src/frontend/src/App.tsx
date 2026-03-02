import { Toaster } from "@/components/ui/sonner";
import { Loader2 } from "lucide-react";
import { ThemeProvider } from "next-themes";
import { LoginScreen } from "./components/LoginScreen";
import { MobileNav } from "./components/MobileNav";
import { Sidebar } from "./components/Sidebar";
import { useInternetIdentity } from "./hooks/useInternetIdentity";
import { Cars } from "./pages/Cars";
import { Checklist } from "./pages/Checklist";
import { Dashboard } from "./pages/Dashboard";
import { Events } from "./pages/Events";
import { LapNotes } from "./pages/LapNotes";
import { TireLogs } from "./pages/TireLogs";
import { WearTracker } from "./pages/WearTracker";
import { useAppStore } from "./store/appStore";

function AppShell() {
  const currentView = useAppStore((s) => s.currentView);

  const renderPage = () => {
    switch (currentView) {
      case "dashboard":
        return <Dashboard />;
      case "events":
        return <Events />;
      case "cars":
        return <Cars />;
      case "checklist":
        return <Checklist />;
      case "tire-logs":
        return <TireLogs />;
      case "lap-notes":
        return <LapNotes />;
      case "wear":
        return <WearTracker />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="flex h-screen bg-zinc-950 text-white overflow-hidden">
      {/* Sidebar (desktop) */}
      <Sidebar />

      {/* Main content */}
      <main className="flex-1 overflow-y-auto pb-20 lg:pb-0">
        <div className="min-h-full">{renderPage()}</div>
      </main>

      {/* Mobile bottom nav */}
      <MobileNav />

      <Toaster
        theme="dark"
        position="bottom-right"
        toastOptions={{
          style: {
            background: "#1a1a1a",
            border: "1px solid #3f3f46",
            color: "#fff",
          },
        }}
      />
    </div>
  );
}

export default function App() {
  const { identity, isInitializing } = useInternetIdentity();
  const isAuthenticated = !!identity;

  return (
    <ThemeProvider attribute="class" defaultTheme="dark" forcedTheme="dark">
      {isInitializing ? (
        <div
          data-ocid="app.loading_state"
          className="min-h-screen bg-zinc-950 flex items-center justify-center"
        >
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="w-8 h-8 text-[#FF6B00] animate-spin" />
            <p className="text-zinc-500 text-sm">Loading TrackReady…</p>
          </div>
        </div>
      ) : !isAuthenticated ? (
        <LoginScreen />
      ) : (
        <AppShell />
      )}
    </ThemeProvider>
  );
}
