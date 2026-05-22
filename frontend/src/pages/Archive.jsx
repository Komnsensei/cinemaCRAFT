import { useEffect, useState } from "react";
import api from "@/lib/api";
import MovieCard from "@/components/movie/MovieCard";

export default function Archive() {
  const [movies, setMovies] = useState([]);
  useEffect(() => {
    api.get("/movies", { params: { archived: true, limit: 60 } }).then((r) => setMovies(r.data));
  }, []);
  return (
    <div data-testid="archive-page">
      <h1 className="font-display text-4xl sm:text-5xl mb-2">Archive</h1>
      <p className="text-white/45 mb-8">Vaulted, retired, but never forgotten.</p>
      {!movies.length && (
        <div className="glass rounded-2xl p-10 text-center text-white/55">
          The archive is empty. Creators can archive their own works from any movie page.
        </div>
      )}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 stagger-in">
        {movies.map((m) => <MovieCard key={m.id} movie={m} />)}
      </div>
    </div>
  );
}
