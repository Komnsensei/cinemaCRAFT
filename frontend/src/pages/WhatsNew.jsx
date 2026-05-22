import { useEffect, useState } from "react";
import api from "@/lib/api";
import MovieCard from "@/components/movie/MovieCard";

export default function WhatsNew() {
  const [movies, setMovies] = useState([]);
  useEffect(() => { api.get("/movies", { params: { sort: "new", limit: 40 } }).then((r) => setMovies(r.data)); }, []);
  return (
    <div data-testid="whats-new-page">
      <h1 className="font-display text-4xl sm:text-5xl mb-2">What's New</h1>
      <p className="text-white/45 mb-8">The freshest forged frames, hot off the AI presses.</p>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 stagger-in">
        {movies.map((m) => <MovieCard key={m.id} movie={m} />)}
      </div>
    </div>
  );
}
