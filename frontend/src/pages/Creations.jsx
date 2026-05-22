import { useEffect, useState } from "react";
import api from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import MovieCard from "@/components/movie/MovieCard";

const TABS = [
  { id: "all", label: "All" },
  { id: "originals", label: "Originals" },
  { id: "forks", label: "Evolutions / Forks" },
  { id: "free", label: "Free to Play" },
];

export default function Creations() {
  const { user } = useAuth();
  const [tab, setTab] = useState("all");
  const [movies, setMovies] = useState([]);

  useEffect(() => {
    if (!user) return;
    api.get("/movies", { params: { creator_id: user.id, limit: 80 } }).then((r) => setMovies(r.data));
  }, [user]);

  const filtered = movies.filter((m) => {
    if (tab === "originals") return !m.fork_of;
    if (tab === "forks") return !!m.fork_of;
    if (tab === "free") return m.free_to_play;
    return true;
  });

  return (
    <div data-testid="creations-page">
      <h1 className="font-display text-4xl sm:text-5xl mb-2">Your Creations & Evolutions</h1>
      <p className="text-white/45 mb-6">Forks, originals, deferred — your full forging history.</p>

      <div className="flex gap-2 mb-8 border-b border-white/5 pb-3" data-testid="creations-tabs">
        {TABS.map((t) => (
          <button
            key={t.id}
            data-testid={`tab-${t.id}`}
            onClick={() => setTab(t.id)}
            className={`px-4 py-2 rounded-full text-sm transition ${
              tab === t.id ? "text-white border-crimson" : "text-white/55 hover:text-white border-white/10"
            } border`}
            style={tab === t.id ? { background: "linear-gradient(90deg,#dc143c,#7a1bbf)" } : {}}
          >
            {t.label}
          </button>
        ))}
      </div>

      {!filtered.length && (
        <div className="glass rounded-2xl p-12 text-center">
          <p className="text-white/60 mb-4">Nothing forged here yet.</p>
          <a href="/create" className="inline-block px-6 py-2.5 rounded-full text-white font-medium" style={{ background: "linear-gradient(90deg,#dc143c,#7a1bbf)" }}>Open the Forge</a>
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 stagger-in">
        {filtered.map((m) => <MovieCard key={m.id} movie={m} />)}
      </div>
    </div>
  );
}
