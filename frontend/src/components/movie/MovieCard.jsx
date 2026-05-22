import { Link } from "react-router-dom";
import { Play, Heart, Star } from "lucide-react";

const LENGTH_LABELS = {
  trailer: "Trailer · 2m",
  short25: "Short · 25m",
  episode45: "Episode · 45m",
  feature90: "Feature · 1.5h",
};

export default function MovieCard({ movie, size = "md" }) {
  const rating = movie.rating_count ? (movie.rating_sum / movie.rating_count).toFixed(1) : "—";
  const sizes = {
    sm: "w-44 h-64",
    md: "w-56 h-80",
    lg: "w-72 h-[26rem]",
  };
  return (
    <Link
      to={`/m/${movie.id}`}
      data-testid={`movie-card-${movie.id}`}
      className={`group relative flex-shrink-0 ${sizes[size]} rounded-2xl overflow-hidden hover-lift block`}
    >
      <img src={movie.poster_url} alt={movie.title} className="absolute inset-0 w-full h-full object-cover" loading="lazy" />
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/40 to-transparent" />

      {movie.coming_soon && (
        <div className="absolute top-3 left-3 px-2 py-1 text-[10px] uppercase tracking-[0.2em] rounded-full bg-black/70 border border-violet/40 text-violet" data-testid={`coming-soon-${movie.id}`}>Coming Soon</div>
      )}
      {movie.fork_of && (
        <div className="absolute top-3 right-3 px-2 py-1 text-[10px] uppercase tracking-[0.2em] rounded-full bg-black/70 border border-crimson/40 text-crimson">Evolution</div>
      )}

      <div className="absolute bottom-0 left-0 right-0 p-4">
        <div className="text-[10px] uppercase tracking-[0.25em] text-white/50 mb-1">{movie.genre} · {LENGTH_LABELS[movie.length] || movie.length}</div>
        <h3 className="font-display text-lg leading-tight text-white">{movie.title}</h3>
        <div className="flex items-center gap-3 mt-2 text-[11px] text-white/60">
          <span className="flex items-center gap-1"><Star className="w-3 h-3 text-amber-400" />{rating}</span>
          <span className="flex items-center gap-1"><Heart className="w-3 h-3 text-crimson" />{Intl.NumberFormat("en", {notation:"compact"}).format(movie.likes||0)}</span>
          <span className="flex items-center gap-1"><Play className="w-3 h-3" />{Intl.NumberFormat("en", {notation:"compact"}).format(movie.watches||0)}</span>
        </div>
      </div>

      <div className="absolute inset-0 ring-0 group-hover:ring-2 ring-crimson/60 transition-all rounded-2xl pointer-events-none" />
    </Link>
  );
}
