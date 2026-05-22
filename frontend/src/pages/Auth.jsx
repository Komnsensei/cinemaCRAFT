import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { Film } from "lucide-react";

export default function Auth() {
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const { login, register } = useAuth();
  const nav = useNavigate();

  const onSubmit = async (e) => {
    e.preventDefault();
    setBusy(true);
    try {
      if (mode === "login") await login(email, password);
      else await register(email, username, password);
      toast.success(mode === "login" ? "Welcome back" : "Account forged");
      nav("/");
    } catch (err) {
      toast.error(err.response?.data?.detail || "Failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 relative overflow-hidden" data-testid="auth-page">
      <div className="absolute inset-0">
        <img src="https://images.unsplash.com/photo-1489846986031-7cea03ab8fd0?crop=entropy&cs=srgb&fm=jpg&w=2000&q=85" alt="" className="absolute inset-0 w-full h-full object-cover opacity-30" />
        <div className="absolute inset-0 bg-gradient-to-br from-[#0a050f] via-[#0a050f]/85 to-[#1a0a1f]/85" />
      </div>

      <div className="relative w-full max-w-md glass-strong rounded-3xl p-8 ring-shimmer">
        <Link to="/" className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center crimson-glow" style={{background:"linear-gradient(135deg,#dc143c,#5a0b8a)"}}>
            <Film className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="font-display text-2xl leading-none">CinemaForge</div>
            <div className="text-[10px] uppercase tracking-[0.25em] text-white/40 mt-1">create · stream · evolve</div>
          </div>
        </Link>

        <h1 className="font-display text-3xl mb-2">{mode === "login" ? "Welcome back, forger" : "Forge your account"}</h1>
        <p className="text-white/50 text-sm mb-6">{mode === "login" ? "Pick up where you left off." : "Your name above the marquee."}</p>

        <form onSubmit={onSubmit} className="space-y-4">
          {mode === "register" && (
            <input
              data-testid="auth-username"
              required
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Username"
              className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-crimson"
            />
          )}
          <input
            data-testid="auth-email"
            required
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-crimson"
          />
          <input
            data-testid="auth-password"
            required
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-3 text-sm focus:outline-none focus:border-crimson"
          />
          <button
            data-testid="auth-submit"
            disabled={busy}
            className="w-full py-3 rounded-lg text-white font-semibold disabled:opacity-60"
            style={{background:"linear-gradient(90deg,#dc143c,#7a1bbf)"}}
          >
            {busy ? "…" : (mode === "login" ? "Sign in" : "Create account")}
          </button>
        </form>

        <div className="mt-5 text-center text-sm text-white/55">
          {mode === "login" ? "New here?" : "Already a forger?"}{" "}
          <button data-testid="auth-toggle" onClick={() => setMode(mode === "login" ? "register" : "login")} className="text-crimson hover:underline">
            {mode === "login" ? "Create account" : "Sign in"}
          </button>
        </div>
        <div className="mt-3 text-center">
          <Link to="/" className="text-xs text-white/40 hover:text-white">← Continue browsing as guest</Link>
        </div>
      </div>
    </div>
  );
}
