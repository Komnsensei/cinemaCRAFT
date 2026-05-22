import { Link } from "react-router-dom";
import { Play, Info } from "lucide-react";

export default function HeroBanner({ movie }) {
  if (!movie) return null;
  return (
    <section className="relative h-[60vh] min-h-[460px] -mx-4 sm:-mx-8 lg:-mx-12 -mt-6 mb-12 overflow-hidden" data-testid="hero-banner">
      <img src={movie.backdrop_url || movie.poster_url} alt="" className="absolute inset-0 w-full h-full object-cover" />
      <div className="absolute inset-0 bg-gradient-to-r from-black via-black/70 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-t from-[#0a050f] via-transparent to-transparent" />
      <div className="absolute inset-0 noise" />

      <div className="relative z-10 h-full flex flex-col justify-end px-4 sm:px-8 lg:px-12 pb-14 max-w-3xl">
        <div className="text-[10px] uppercase tracking-[0.35em] text-crimson mb-3">FEATURED · {movie.genre}</div>
        <h1 className="font-display text-4xl sm:text-5xl lg:text-7xl leading-[0.95] mb-4">{movie.title}</h1>
        <p className="text-white/70 text-base max-w-xl mb-6">{movie.synopsis}</p>
        <div className="flex gap-3">
          <Link to={`/m/${movie.id}`} className="px-6 py-3 rounded-full bg-white text-black font-semibold flex items-center gap-2 hover:bg-white/90 transition" data-testid="hero-play-btn">
            <Play className="w-4 h-4 fill-black" /> Play
          </Link>
          <Link to={`/m/${movie.id}`} className="px-6 py-3 rounded-full bg-white/10 border border-white/15 backdrop-blur-md text-white font-medium flex items-center gap-2 hover:bg-white/20 transition" data-testid="hero-more-btn">
            <Info className="w-4 h-4" /> More info
          </Link>
        </div>
      </div>
    </section>
  );
}
