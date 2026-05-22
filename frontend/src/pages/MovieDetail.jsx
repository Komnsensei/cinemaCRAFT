import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { Play, Heart, Star, Share2, GitFork, Archive as ArchiveIcon, Loader2 } from "lucide-react";

const LENGTH_LABELS = {
  trailer: "Trailer · 2 min",
  short25: "Short · 25 min",
  episode45: "Episode · 45 min",
  feature90: "Feature · 1.5 hr",
};

export default function MovieDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const nav = useNavigate();
  const [movie, setMovie] = useState(null);
  const [forks, setForks] = useState([]);
  const [playing, setPlaying] = useState(false);
  const [rating, setRating] = useState(0);
  const [liked, setLiked] = useState(false);

  useEffect(() => {
    api.get(`/movies/${id}`).then((r) => setMovie(r.data));
    api.get("/movies", { params: { fork_of: id, limit: 20 } }).then((r) => setForks(r.data));
  }, [id]);

  const onPlay = async () => {
    setPlaying(true);
    api.post(`/movies/${id}/watch`).catch(()=>{});
  };

  const onLike = async () => {
    if (!user) return nav("/auth");
    const r = await api.post(`/movies/${id}/like`);
    setLiked(r.data.liked);
    setMovie((m) => ({ ...m, likes: m.likes + (r.data.liked ? 1 : -1) }));
  };

  const onRate = async (n) => {
    if (!user) return nav("/auth");
    setRating(n);
    await api.post(`/movies/${id}/rate`, { rating: n });
    toast.success(`Rated ${n}/5`);
  };

  const onFork = async () => {
    if (!user) return nav("/auth");
    const r = await api.post(`/movies/${id}/fork`);
    toast.success("Forked into your Evolutions");
    nav(`/m/${r.data.id}`);
  };

  const onShare = () => {
    navigator.clipboard?.writeText(window.location.href);
    toast.success("Share link copied");
  };

  const onArchive = async () => {
    const r = await api.post(`/movies/${id}/archive`);
    toast.success(r.data.archived ? "Archived" : "Restored");
    setMovie((m) => ({ ...m, archived: r.data.archived }));
  };

  if (!movie) return <div className="text-white/50" data-testid="movie-loading">Loading…</div>;

  const avgRating = movie.rating_count ? (movie.rating_sum / movie.rating_count).toFixed(1) : "—";
  const isOwner = user?.id === movie.creator_id;

  return (
    <div data-testid={`movie-detail-${movie.id}`}>
      {/* Backdrop */}
      <div className="relative h-[55vh] min-h-[420px] -mx-4 sm:-mx-8 lg:-mx-12 -mt-6 mb-8 overflow-hidden rounded-b-3xl">
        <img src={movie.backdrop_url} alt="" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-t from-[#0a050f] via-[#0a050f]/70 to-transparent" />
        <div className="absolute inset-0 noise" />

        {playing ? (
          <div className="absolute inset-0 bg-black flex items-center justify-center" data-testid="movie-player">
            <div className="text-center">
              <Loader2 className="w-10 h-10 text-crimson animate-spin mx-auto mb-4" />
              <div className="font-display text-2xl mb-2">Rendering frames…</div>
              <p className="text-white/50 text-sm max-w-md">Video generation provider not configured yet. Plug in your Sora 2 / Veo / Runway key in Settings → Integrations and this player will stream live AI footage.</p>
              <button onClick={()=>setPlaying(false)} className="mt-6 px-5 py-2 rounded-full bg-white/10 border border-white/15 text-sm" data-testid="player-close">Close preview</button>
            </div>
          </div>
        ) : (
          <div className="absolute bottom-0 left-0 right-0 p-6 sm:p-8 lg:p-12 max-w-4xl">
            <div className="text-[10px] uppercase tracking-[0.35em] text-crimson mb-3">{movie.genre} · {LENGTH_LABELS[movie.length]} · {movie.format}</div>
            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl leading-[0.95] mb-3">{movie.title}</h1>
            <p className="text-white/70 max-w-2xl">{movie.synopsis}</p>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex flex-wrap gap-3 mb-10" data-testid="movie-actions">
        <button onClick={onPlay} className="px-6 py-3 rounded-full bg-white text-black font-semibold flex items-center gap-2 hover:bg-white/90 transition" data-testid="play-btn">
          <Play className="w-4 h-4 fill-black" /> Play
        </button>
        <button onClick={onLike} className={`px-5 py-3 rounded-full border flex items-center gap-2 transition ${liked ? "border-crimson text-crimson bg-crimson/10" : "border-white/15 text-white/80 hover:text-white"}`} data-testid="like-btn">
          <Heart className={`w-4 h-4 ${liked ? "fill-crimson" : ""}`} /> {movie.likes}
        </button>
        <button onClick={onFork} className="px-5 py-3 rounded-full border border-violet/40 text-violet hover:bg-violet/10 flex items-center gap-2 transition" data-testid="fork-btn">
          <GitFork className="w-4 h-4" /> Evolve / Fork
        </button>
        <button onClick={onShare} className="px-5 py-3 rounded-full border border-white/15 text-white/80 hover:text-white flex items-center gap-2 transition" data-testid="share-btn">
          <Share2 className="w-4 h-4" /> Share
        </button>
        {isOwner && (
          <button onClick={onArchive} className="px-5 py-3 rounded-full border border-white/15 text-white/60 hover:text-white flex items-center gap-2 transition" data-testid="archive-btn">
            <ArchiveIcon className="w-4 h-4" /> {movie.archived ? "Restore" : "Archive"}
          </button>
        )}
      </div>

      {/* Meta grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mb-10">
        <div className="lg:col-span-8 glass rounded-2xl p-6">
          <h2 className="font-display text-2xl mb-4">About this forge</h2>
          <dl className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
            <div><dt className="text-white/40 text-[10px] uppercase tracking-[0.2em]">Creator</dt><dd>{movie.creator_name}</dd></div>
            <div><dt className="text-white/40 text-[10px] uppercase tracking-[0.2em]">Rating</dt><dd>{avgRating} ({movie.rating_count})</dd></div>
            <div><dt className="text-white/40 text-[10px] uppercase tracking-[0.2em]">Watches</dt><dd>{Intl.NumberFormat("en", {notation:"compact"}).format(movie.watches||0)}</dd></div>
            <div><dt className="text-white/40 text-[10px] uppercase tracking-[0.2em]">Origin</dt><dd>{movie.fork_of ? "Evolution" : "Original"}</dd></div>
          </dl>
          <div className="mt-6 pt-6 border-t border-white/5">
            <div className="text-[10px] uppercase tracking-[0.25em] text-white/40 mb-2">Original prompt</div>
            <p className="text-white/80 italic">"{movie.prompt}"</p>
          </div>
        </div>

        <div className="lg:col-span-4 glass rounded-2xl p-6">
          <h3 className="font-display text-xl mb-4">Rate this forge</h3>
          <div className="flex gap-1" data-testid="rate-stars">
            {[1,2,3,4,5].map((n) => (
              <button key={n} onClick={() => onRate(n)} data-testid={`rate-${n}`} className="p-1">
                <Star className={`w-7 h-7 transition ${n <= rating ? "fill-amber-400 text-amber-400" : "text-white/30 hover:text-amber-300"}`} />
              </button>
            ))}
          </div>
          <p className="text-xs text-white/45 mt-3">Your rating shapes the leaderboards.</p>
        </div>
      </div>

      {/* Evolutions */}
      {forks.length > 0 && (
        <section className="mb-10" data-testid="evolutions-section">
          <h2 className="font-display text-2xl mb-4">Evolutions of this forge</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {forks.map((f) => (
              <a key={f.id} href={`/m/${f.id}`} className="block rounded-xl overflow-hidden hover-lift">
                <img src={f.poster_url} alt="" className="w-full aspect-[2/3] object-cover" />
                <div className="p-3">
                  <div className="font-display text-base leading-tight">{f.title}</div>
                  <div className="text-[11px] text-white/45 mt-1">by {f.creator_name}</div>
                </div>
              </a>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
