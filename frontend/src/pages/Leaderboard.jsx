import { useEffect, useState } from "react";
import api from "@/lib/api";
import { Link } from "react-router-dom";
import { Crown, Eye, MousePointer, Star } from "lucide-react";

const COLS = [
  { key: "best_rated", label: "Best Rated", icon: Star, accent: "#fbbf24" },
  { key: "most_watched", label: "Most Watched", icon: Eye, accent: "#dc143c" },
  { key: "most_clicked", label: "Most Clicked", icon: MousePointer, accent: "#b06bff" },
];

export default function Leaderboard() {
  const [data, setData] = useState({});

  useEffect(() => {
    api.get("/movies/leaderboard").then((r) => setData(r.data));
  }, []);

  return (
    <div data-testid="leaderboard-page">
      <div className="flex items-end gap-4 mb-8">
        <Crown className="w-10 h-10 text-amber-400" />
        <div>
          <h1 className="font-display text-4xl sm:text-5xl">Leaderboard</h1>
          <p className="text-white/45 mt-1">Where the best forged creations rise.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {COLS.map((col) => (
          <div key={col.key} className="glass rounded-2xl p-5" data-testid={`board-${col.key}`}>
            <div className="flex items-center gap-2 mb-5">
              <col.icon className="w-4 h-4" style={{ color: col.accent }} />
              <h2 className="text-sm uppercase tracking-[0.3em] text-white/70">{col.label}</h2>
            </div>
            <ol className="space-y-3">
              {(data[col.key] || []).map((m, i) => (
                <Link to={`/m/${m.id}`} key={m.id} className="flex items-center gap-3 group">
                  <div className="w-7 text-center font-mono-d text-sm" style={{ color: i < 3 ? col.accent : "#ffffff60" }}>
                    {String(i + 1).padStart(2, "0")}
                  </div>
                  <img src={m.poster_url} alt="" className="w-12 h-16 rounded-md object-cover" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm text-white group-hover:text-crimson transition truncate">{m.title}</div>
                    <div className="text-[11px] text-white/40 truncate">{m.genre} · by {m.creator_name}</div>
                  </div>
                  <div className="text-xs text-white/55 font-mono-d">
                    {col.key === "best_rated" && m.rating_count ? (m.rating_sum / m.rating_count).toFixed(1) : null}
                    {col.key === "most_watched" && Intl.NumberFormat("en", { notation: "compact" }).format(m.watches || 0)}
                    {col.key === "most_clicked" && Intl.NumberFormat("en", { notation: "compact" }).format(m.clicks || 0)}
                  </div>
                </Link>
              ))}
            </ol>
          </div>
        ))}
      </div>
    </div>
  );
}
