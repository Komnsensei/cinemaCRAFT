import { useEffect, useState } from "react";
import api from "@/lib/api";
import MovieCard from "@/components/movie/MovieCard";

export default function ComingSoon() {
  const [movies, setMovies] = useState([]);
  useEffect(() => { api.get("/movies", { params: { coming_soon: true, limit: 40 } }).then((r) => setMovies(r.data)); }, []);
  return (
    <div data-testid="coming-soon-page">
      <h1 className="font-display text-4xl sm:text-5xl mb-2">Coming Soon</h1>
      <p className="text-white/45 mb-8">Forged but still cooling. Watch this space.</p>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 stagger-in">
        {movies.map((m) => <MovieCard key={m.id} movie={m} />)}
      </div>
    </div>
  );
}
