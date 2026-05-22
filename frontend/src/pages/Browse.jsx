import { useEffect, useState } from "react";
import api from "@/lib/api";
import MovieCard from "@/components/movie/MovieCard";

const GENRES = ["All", "Sci-Fi", "Thriller", "Drama", "Horror", "Strange AI", "Romance", "Action", "Documentary"];

export default function Browse() {
  const [genre, setGenre] = useState("All");
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    api.get("/movies", { params: { genre, limit: 60 } })
      .then((r) => setMovies(r.data))
      .finally(() => setLoading(false));
  }, [genre]);

  return (
    <div data-testid="browse-page">
      <div className="mb-8">
        <h1 className="font-display text-4xl sm:text-5xl">Browse the Forge</h1>
        <p className="text-white/45 mt-2">Every world the community has dreamed up.</p>
      </div>

      <div className="flex flex-wrap gap-2 mb-8" data-testid="genre-filters">
        {GENRES.map((g) => (
          <button
            key={g}
            data-testid={`genre-${g}`}
            onClick={() => setGenre(g)}
            className={`px-4 py-2 rounded-full text-sm transition ${
              g === genre
                ? "text-white border-crimson"
                : "text-white/60 hover:text-white border-white/10 hover:border-white/30"
            } border`}
            style={g === genre ? { background: "linear-gradient(90deg,#dc143c,#7a1bbf)" } : {}}
          >
            {g}
          </button>
        ))}
      </div>

      {loading && <p className="text-white/50">Loading the vault…</p>}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 stagger-in" data-testid="browse-grid">
        {movies.map((m) => (
          <div key={m.id} className="w-full">
            <MovieCard movie={m} size="md" />
          </div>
        ))}
      </div>
      {!loading && !movies.length && <p className="text-white/50">No movies here yet — try Strange AI ↗</p>}
    </div>
  );
}
