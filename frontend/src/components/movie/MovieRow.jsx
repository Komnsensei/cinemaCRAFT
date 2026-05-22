import MovieCard from "@/components/movie/MovieCard";
import { ChevronRight } from "lucide-react";

export default function MovieRow({ title, subtitle, movies = [], to, size = "md", testid }) {
  if (!movies.length) return null;
  return (
    <section className="mb-12" data-testid={testid}>
      <div className="flex items-end justify-between mb-4">
        <div>
          <h2 className="font-display text-2xl sm:text-3xl">{title}</h2>
          {subtitle && <p className="text-white/45 text-sm mt-1">{subtitle}</p>}
        </div>
        {to && (
          <a href={to} className="text-xs uppercase tracking-[0.25em] text-white/50 hover:text-crimson transition flex items-center gap-1">
            See all <ChevronRight className="w-3 h-3" />
          </a>
        )}
      </div>
      <div className="flex gap-4 overflow-x-auto pb-4 hide-scrollbar stagger-in">
        {movies.map((m) => <MovieCard key={m.id} movie={m} size={size} />)}
      </div>
    </section>
  );
}
