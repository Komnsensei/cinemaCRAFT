import { useEffect, useState } from "react";
import { useParams, useSearchParams, useNavigate } from "react-router-dom";
import api from "@/lib/api";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";
import { Sparkles, Globe, Loader2, X, Check, Flame } from "lucide-react";

const TIER_ORDER = ["one_time", "series", "feature", "lifetime"];

export default function AssetDetail() {
  const { kind, id } = useParams(); // kind = "character" | "world"
  const { user } = useAuth();
  const nav = useNavigate();
  const [asset, setAsset] = useState(null);
  const [tiers, setTiers] = useState([]);
  const [picked, setPicked] = useState("series");
  const [busy, setBusy] = useState(false);
  const [searchParams, setSearchParams] = useSearchParams();
  const [owned, setOwned] = useState([]);

  useEffect(() => {
    const ep = kind === "character" ? `/characters/${id}` : `/worlds/${id}`;
    api.get(ep).then((r) => setAsset(r.data)).catch(() => toast.error("Asset not found"));
    api.get("/marketplace/tiers").then((r) => setTiers(kind === "character" ? r.data.character : r.data.world));
    if (user) api.get("/licenses/my").then((r) => setOwned(r.data.filter(l => l.asset_id === id)));
  }, [kind, id, user]);

  // Poll license status after Stripe return
  useEffect(() => {
    const sid = searchParams.get("license_session_id");
    const cancelled = searchParams.get("license_cancelled");
    if (cancelled) {
      toast.message("Purchase cancelled");
      searchParams.delete("license_cancelled");
      setSearchParams(searchParams, { replace: true });
      return;
    }
    if (!sid) return;
    let cancel = false;
    let attempts = 0;
    const poll = async () => {
      if (cancel) return;
      if (attempts >= 6) {
        toast.message("License is processing — refresh in a moment.");
        searchParams.delete("license_session_id");
        setSearchParams(searchParams, { replace: true });
        return;
      }
      attempts++;
      try {
        const r = await api.get(`/licenses/status/${sid}`);
        if (r.data.payment_status === "paid") {
          toast.success("License acquired. Use it in your next forge.");
          const mine = await api.get("/licenses/my");
          setOwned(mine.data.filter(l => l.asset_id === id));
          searchParams.delete("license_session_id");
          setSearchParams(searchParams, { replace: true });
          return;
        }
        if (r.data.status === "expired") {
          toast.error("Session expired");
          searchParams.delete("license_session_id");
          setSearchParams(searchParams, { replace: true });
          return;
        }
        setTimeout(poll, 2000);
      } catch {
        setTimeout(poll, 2500);
      }
    };
    poll();
    return () => { cancel = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams.get("license_session_id"), searchParams.get("license_cancelled"), id]);

  const onBuy = async () => {
    if (!user) return nav("/auth");
    setBusy(true);
    try {
      const r = await api.post("/licenses/checkout", {
        asset_type: kind, asset_id: id, tier: picked,
        origin_url: window.location.origin,
      });
      window.location.href = r.data.url;
    } catch (e) {
      toast.error(e.response?.data?.detail || "Purchase failed");
      setBusy(false);
    }
  };

  if (!asset) return <div className="text-white/50" data-testid="asset-loading">Loading…</div>;
  const Icon = kind === "character" ? Sparkles : Globe;

  return (
    <div data-testid={`asset-detail-${id}`}>
      {/* Hero */}
      <div className="relative h-[50vh] min-h-[380px] -mx-4 sm:-mx-8 lg:-mx-12 -mt-6 mb-8 overflow-hidden rounded-b-3xl">
        <img src={asset.image_url} alt="" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a050f] via-[#0a050f]/80 to-transparent" />
        <div className="absolute inset-0 noise" />
        <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-8 lg:p-12 max-w-4xl">
          <div className="flex items-center gap-2 text-[10px] uppercase tracking-[0.35em] text-crimson mb-3">
            <Icon className="w-3.5 h-3.5" /> {kind === "character" ? "AI Character" : "World"} · by {asset.creator_name}
          </div>
          <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl leading-[0.95] mb-3">{asset.name}</h1>
          <p className="text-white/75 max-w-2xl text-lg">{asset.tagline}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* About */}
        <div className="lg:col-span-7 glass rounded-2xl p-6">
          <h2 className="font-display text-2xl mb-3">About this {kind}</h2>
          <p className="text-white/75 leading-relaxed mb-6">{asset.description}</p>

          {kind === "character" ? (
            <dl className="grid grid-cols-2 gap-4 text-sm">
              <div><dt className="text-white/40 text-[10px] uppercase tracking-[0.2em]">Vibe</dt><dd>{asset.vibe || "—"}</dd></div>
              <div><dt className="text-white/40 text-[10px] uppercase tracking-[0.2em]">Voice</dt><dd>{asset.voice || "—"}</dd></div>
            </dl>
          ) : (
            <dl className="grid grid-cols-2 gap-4 text-sm">
              <div><dt className="text-white/40 text-[10px] uppercase tracking-[0.2em]">Era</dt><dd>{asset.era || "—"}</dd></div>
              <div><dt className="text-white/40 text-[10px] uppercase tracking-[0.2em]">Palette</dt><dd>{asset.palette || "—"}</dd></div>
            </dl>
          )}

          <div className="flex flex-wrap gap-1.5 mt-5">
            {(asset.tags || []).map((t) => (
              <span key={t} className="text-[10px] uppercase tracking-[0.2em] text-white/55 px-2 py-1 rounded-full border border-white/10">{t}</span>
            ))}
          </div>
        </div>

        {/* License picker */}
        <aside className="lg:col-span-5 glass rounded-2xl p-6 self-start sticky top-24">
          <h2 className="font-display text-2xl mb-1">Acquire a license</h2>
          <p className="text-white/45 text-sm mb-5">Pay the creator. Use it in your forges. Your story, their character.</p>

          <div className="space-y-2 mb-5" data-testid="tier-picker">
            {tiers.map((t) => {
              const own = owned.some((o) => o.tier === t.id);
              const active = picked === t.id;
              return (
                <button
                  key={t.id}
                  data-testid={`tier-${t.id}`}
                  onClick={() => setPicked(t.id)}
                  className={`w-full text-left p-4 rounded-xl border flex items-start justify-between gap-4 transition ${
                    active ? "border-crimson bg-crimson/10" : "border-white/10 hover:border-white/30"
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <div className="font-display text-lg">{t.label}</div>
                      {own && <span className="text-[10px] uppercase tracking-[0.2em] text-emerald-400 flex items-center gap-1"><Check className="w-3 h-3" />owned</span>}
                    </div>
                    <div className="text-white/55 text-sm mt-0.5">{t.blurb}</div>
                  </div>
                  <div className="font-display text-2xl">${t.amount.toFixed(2)}</div>
                </button>
              );
            })}
          </div>

          <button
            data-testid="license-confirm"
            onClick={onBuy}
            disabled={busy}
            className="w-full py-3 rounded-xl text-white font-semibold flex items-center justify-center gap-2 disabled:opacity-50"
            style={{ background: "linear-gradient(90deg,#dc143c,#7a1bbf)" }}
          >
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Flame className="w-4 h-4" />}
            {busy ? "Opening checkout…" : `License for $${tiers.find(t=>t.id===picked)?.amount.toFixed(2) || ""}`}
          </button>
          <p className="text-[11px] text-white/40 text-center mt-3">Powered by Stripe · test mode</p>

          <div className="mt-6 pt-5 border-t border-white/5">
            <div className="text-[10px] uppercase tracking-[0.25em] text-white/40 mb-2">Lifetime sales</div>
            <div className="font-display text-2xl">{asset.license_count || 0} <span className="text-white/40 text-base font-normal">licenses</span></div>
          </div>
        </aside>
      </div>
    </div>
  );
}
