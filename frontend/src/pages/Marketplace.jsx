import { useEffect, useState } from "react";
import api from "@/lib/api";
import { Link } from "react-router-dom";
import { Sparkles, Globe, Crown } from "lucide-react";

const TABS = [
  { id: "characters", label: "AI Characters", icon: Sparkles },
  { id: "worlds", label: "Worlds", icon: Globe },
];

export default function Marketplace() {
  const [tab, setTab] = useState("characters");
  const [characters, setCharacters] = useState([]);
  const [worlds, setWorlds] = useState([]);
  const [tiers, setTiers] = useState({ character: [], world: [] });

  useEffect(() => {
    api.get("/characters").then((r) => setCharacters(r.data));
    api.get("/worlds").then((r) => setWorlds(r.data));
    api.get("/marketplace/tiers").then((r) => setTiers(r.data));
  }, []);

  const items = tab === "characters" ? characters : worlds;
  const itemTiers = tab === "characters" ? tiers.character : tiers.world;

  return (
    <div data-testid="marketplace-page">
      <div className="flex items-end gap-4 mb-3">
        <Crown className="w-10 h-10 text-amber-400" />
        <div>
          <h1 className="font-display text-4xl sm:text-5xl">Marketplace</h1>
          <p className="text-white/45 mt-1">License AI actors and step inside legendary worlds. Be your own story.</p>
        </div>
      </div>

      <div className="glass rounded-2xl p-4 mb-8 flex flex-wrap gap-4" data-testid="tier-strip">
        <div className="text-[10px] uppercase tracking-[0.3em] text-white/45 self-center">License tiers</div>
        {itemTiers.map((t) => (
          <div key={t.id} className="px-3 py-2 rounded-lg border border-white/10 bg-black/30">
            <div className="text-xs text-white/55">{t.label}</div>
            <div className="font-display text-lg leading-none mt-0.5">${t.amount.toFixed(2)}</div>
            <div className="text-[10px] text-white/40 mt-1 max-w-[180px]">{t.blurb}</div>
          </div>
        ))}
      </div>

      <div className="flex gap-2 mb-8 border-b border-white/5 pb-3" data-testid="marketplace-tabs">
        {TABS.map((t) => (
          <button
            key={t.id}
            data-testid={`mkt-tab-${t.id}`}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2 rounded-full text-sm flex items-center gap-2 transition ${
              tab === t.id ? "text-white border-crimson" : "text-white/55 hover:text-white border-white/10"
            } border`}
            style={tab === t.id ? { background: "linear-gradient(90deg,#dc143c,#7a1bbf)" } : {}}
          >
            <t.icon className="w-4 h-4" /> {t.label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 stagger-in" data-testid="marketplace-grid">
        {items.map((a) => (
          <Link
            key={a.id}
            to={`/marketplace/${tab === "characters" ? "character" : "world"}/${a.id}`}
            data-testid={`mkt-card-${a.id}`}
            className="group glass rounded-2xl overflow-hidden hover-lift block"
          >
            <div className="relative aspect-[5/4] overflow-hidden">
              <img src={a.image_url} alt="" className="absolute inset-0 w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-transparent" />
              <div className="absolute bottom-3 left-4 right-4">
                <div className="text-[10px] uppercase tracking-[0.25em] text-crimson mb-1">
                  {tab === "characters" ? "AI Character" : "World"} · by {a.creator_name}
                </div>
                <h3 className="font-display text-2xl leading-tight">{a.name}</h3>
              </div>
            </div>
            <div className="p-4">
              <p className="text-sm text-white/65 line-clamp-2">{a.tagline}</p>
              <div className="flex flex-wrap gap-1.5 mt-3">
                {(a.tags || []).slice(0, 4).map((t) => (
                  <span key={t} className="text-[10px] uppercase tracking-[0.2em] text-white/50 px-2 py-0.5 rounded-full border border-white/10">{t}</span>
                ))}
              </div>
              <div className="flex items-center justify-between mt-4 pt-3 border-t border-white/5 text-xs">
                <div className="text-white/50">From <span className="text-white font-medium">${itemTiers[0]?.amount.toFixed(2) || "—"}</span></div>
                <div className="text-violet group-hover:text-crimson transition">License →</div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
