import {
  Activity,
  CheckCircle2,
  Gauge,
  Loader2,
  Shield,
  Timer,
  Zap,
} from "lucide-react";
import { motion } from "motion/react";
import { useInternetIdentity } from "../hooks/useInternetIdentity";

const features = [
  {
    icon: CheckCircle2,
    label: "Pre-Event Checklists",
    desc: "Systematic prep for every track day",
  },
  {
    icon: Gauge,
    label: "Tire Pressure Logs",
    desc: "Track PSI and temps per session",
  },
  {
    icon: Timer,
    label: "Lap Notes",
    desc: "Record and analyze lap times",
  },
  {
    icon: Activity,
    label: "Wear Tracking",
    desc: "Monitor brakes and tire tread",
  },
];

export function LoginScreen() {
  const { login, isLoggingIn, isLoginError, loginError } =
    useInternetIdentity();

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background atmosphere */}
      <div className="absolute inset-0 pointer-events-none" aria-hidden="true">
        <div className="absolute top-[-20%] left-[-10%] w-[600px] h-[600px] rounded-full bg-[#FF6B00]/5 blur-[120px]" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] rounded-full bg-[#FF6B00]/4 blur-[100px]" />
        {/* Grid overlay */}
        <div
          className="absolute inset-0 opacity-[0.02]"
          style={{
            backgroundImage:
              "linear-gradient(to right, #fff 1px, transparent 1px), linear-gradient(to bottom, #fff 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 w-full max-w-sm"
      >
        {/* Logo & branding */}
        <div className="flex flex-col items-center mb-10">
          <motion.div
            initial={{ scale: 0.7, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
            className="w-16 h-16 rounded-2xl bg-[#FF6B00] flex items-center justify-center mb-5 shadow-[0_0_40px_rgba(255,107,0,0.35)]"
          >
            <Zap className="w-8 h-8 text-white" strokeWidth={2.5} />
          </motion.div>
          <h1 className="text-3xl font-bold text-white tracking-tight mb-1">
            TrackReady
          </h1>
          <p className="text-zinc-500 text-sm">by RevSpace</p>
        </div>

        {/* Tagline */}
        <div className="text-center mb-8">
          <p className="text-zinc-300 text-base leading-relaxed">
            Your complete track day prep platform.
          </p>
          <p className="text-zinc-500 text-sm mt-1">
            All your data lives securely on-chain — sign in to access your
            garage.
          </p>
        </div>

        {/* Feature pills */}
        <div className="grid grid-cols-2 gap-2 mb-8">
          {features.map((f, i) => {
            const Icon = f.icon;
            return (
              <motion.div
                key={f.label}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  delay: 0.2 + i * 0.07,
                  duration: 0.4,
                  ease: "easeOut",
                }}
                className="bg-zinc-900/70 border border-zinc-800 rounded-xl p-3"
              >
                <Icon className="w-4 h-4 text-[#FF6B00] mb-1.5" />
                <p className="text-xs font-semibold text-zinc-200 leading-tight">
                  {f.label}
                </p>
                <p className="text-[11px] text-zinc-600 mt-0.5 leading-tight">
                  {f.desc}
                </p>
              </motion.div>
            );
          })}
        </div>

        {/* Sign-in button */}
        <motion.button
          type="button"
          data-ocid="login.sign_in.button"
          onClick={login}
          disabled={isLoggingIn}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.4 }}
          whileTap={{ scale: 0.98 }}
          className="w-full flex items-center justify-center gap-3 bg-[#FF6B00] hover:bg-[#e05e00] disabled:opacity-60 disabled:cursor-not-allowed text-white py-4 rounded-xl font-semibold text-base transition-all shadow-[0_0_24px_rgba(255,107,0,0.3)] hover:shadow-[0_0_32px_rgba(255,107,0,0.45)]"
        >
          {isLoggingIn ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Connecting…
            </>
          ) : (
            <>
              <Shield className="w-5 h-5" />
              Sign in with Internet Identity
            </>
          )}
        </motion.button>

        {/* Error */}
        {isLoginError && (
          <motion.p
            data-ocid="login.error_state"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-3 text-red-400 text-xs text-center"
          >
            {loginError?.message ?? "Login failed. Please try again."}
          </motion.p>
        )}

        {/* Security note */}
        <p className="text-center text-zinc-700 text-xs mt-6 leading-relaxed">
          Powered by the Internet Computer.
          <br />
          Your data is private to your identity.
        </p>
      </motion.div>

      {/* Footer */}
      <footer className="absolute bottom-4 text-center">
        <p className="text-[11px] text-zinc-700">
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
