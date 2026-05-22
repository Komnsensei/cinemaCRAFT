import { useEffect, useState } from "react";
import api from "@/lib/api";
import MovieCard from "@/components/movie/MovieCard";
import { Search as SearchIcon } from "lucide-react";

export default function Search() {
  const [q, setQ] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!q.trim()) { setResults([]); return; }
    setLoading(true);
    const t = setTimeout(() => {
      api.get("/movies", { params: { q, limit: 40 } })
        .then((r) => setResults(r.data))
        .finally(() => setLoading(false));
    }, 300);
    return () => clearTimeout(t);
  }, [q]);

  return (
    <div data-testid="search-page">
      <h1 className="font-display text-4xl sm:text-5xl mb-6">Search the Forge</h1>
      <div className="relative max-w-2xl mb-10">
        <SearchIcon className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
        <input
          data-testid="search-input"
          autoFocus
          value={q}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search titles, prompts, genres…"
          className="w-full bg-black/40 border border-white/10 rounded-full pl-14 pr-6 py-4 focus:outline-none focus:border-crimson placeholder:text-white/30"
        />
      </div>
      {loading && <p className="text-white/50">Hunting…</p>}
      {!loading && q && !results.length && <p className="text-white/50">No matches. Try a vibe instead — "cyberpunk", "noir", "love".</p>}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 stagger-in" data-testid="search-results">
        {results.map((m) => <MovieCard key={m.id} movie={m} />)}
      </div>
    </div>
  );
}
