import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import api from "@/lib/api";
import { toast } from "sonner";
import { X, Flame, Sparkles, Loader2 } from "lucide-react";

export default function TipDialog({ open, onClose, movie }) {
  const nav = useNavigate();
  const [pkgs, setPkgs] = useState([]);
  const [picked, setPicked] = useState("ember");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (open) api.get("/tips/packages").then((r) => setPkgs(r.data));
  }, [open]);

  if (!open || !movie) return null;

  const onTip = async () => {
    setBusy(true);
    try {
      const r = await api.post("/tips/checkout", {
        movie_id: movie.id,
        package_id: picked,
        origin_url: window.location.origin,
      });
      window.location.href = r.data.url;
    } catch (e) {
      if (e.response?.status === 401) { toast.error("Sign in to tip"); nav("/auth"); }
      else toast.error(e.response?.data?.detail || "Tip failed");
      setBusy(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" data-testid="tip-dialog">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md glass-strong rounded-3xl p-6 ring-shimmer">
        <button onClick={onClose} className="absolute top-4 right-4 text-white/60 hover:text-white" data-testid="tip-close">
          <X className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-full flex items-center justify-center crimson-glow" style={{background:"linear-gradient(135deg,#dc143c,#5a0b8a)"}}>
            <Flame className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="font-display text-2xl leading-none">Tip the Forger</div>
            <div className="text-[10px] uppercase tracking-[0.25em] text-white/45 mt-1">Support {movie.creator_name}</div>
          </div>
        </div>
        <p className="text-sm text-white/55 mb-5">100% goes to keeping their next forge alive.</p>

        <div className="grid grid-cols-2 gap-3 mb-6" data-testid="tip-packages">
          {pkgs.map((p) => (
            <button
              key={p.id}
              data-testid={`tip-pkg-${p.id}`}
              onClick={() => setPicked(p.id)}
              className={`p-4 rounded-xl border text-left transition ${
                picked === p.id ? "border-crimson bg-crimson/10" : "border-white/10 hover:border-white/30"
              }`}
            >
              <div className="flex items-center justify-between mb-1">
                <div className="font-display text-xl">{p.label}</div>
                <Sparkles className={`w-4 h-4 ${picked === p.id ? "text-crimson" : "text-white/30"}`} />
              </div>
              <div className="text-white/70 text-sm">${p.amount.toFixed(2)}</div>
            </button>
          ))}
        </div>

        <button
          data-testid="tip-confirm"
          onClick={onTip}
          disabled={busy || !pkgs.length}
          className="w-full py-3 rounded-xl text-white font-semibold disabled:opacity-50 flex items-center justify-center gap-2"
          style={{background:"linear-gradient(90deg,#dc143c,#7a1bbf)"}}
        >
          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Flame className="w-4 h-4" />}
          {busy ? "Opening checkout…" : "Continue to Stripe"}
        </button>
        <p className="text-[11px] text-white/40 text-center mt-3">Powered by Stripe · test mode</p>
      </div>
    </div>
  );
}
