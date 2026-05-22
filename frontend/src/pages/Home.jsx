import { useEffect, useState } from "react";
import api from "@/lib/api";
import HeroBanner from "@/components/movie/HeroBanner";
import MovieRow from "@/components/movie/MovieRow";

const GENRES = ["Sci-Fi", "Thriller", "Drama", "Horror", "Strange AI", "Romance", "Action"];

export default function Home() {
  const [hero, setHero] = useState(null);
  const [feeds, setFeeds] = useState({});

  useEffect(() => {
    api.get("/movies", { params: { sort: "watches", limit: 30 } }).then((r) => {
      if (r.data.length) setHero(r.data[0]);
    });
    api.get("/movies", { params: { sort: "new", limit: 20 } }).then((r) => setFeeds((f) => ({ ...f, new: r.data })));
    api.get("/movies", { params: { sort: "rating", limit: 20 } }).then((r) => setFeeds((f) => ({ ...f, top: r.data })));
    GENRES.forEach((g) => {
      api.get("/movies", { params: { genre: g, sort: "watches", limit: 14 } }).then((r) => setFeeds((f) => ({ ...f, [g]: r.data })));
    });
  }, []);

  return (
    <div data-testid="home-page">
      <HeroBanner movie={hero} />
      <MovieRow testid="row-top-rated" title="Top Rated by Forgers" subtitle="The community's highest-rated AI creations" movies={feeds.top || []} size="md" />
      <MovieRow testid="row-new" title="Fresh from the Forge" subtitle="Newly minted in the last 7 days" movies={feeds.new || []} size="md" />
      {GENRES.map((g) => (
        <MovieRow key={g} testid={`row-${g}`} title={g} movies={feeds[g] || []} size="md" />
      ))}
    </div>
  );
}
