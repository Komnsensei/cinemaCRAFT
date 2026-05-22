import { useEffect, useState } from "react";
import api from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import MovieCard from "@/components/movie/MovieCard";

export default function Profile() {
  const { user } = useAuth();
  const [mine, setMine] = useState([]);
  useEffect(() => {
    if (user) api.get("/movies", { params: { creator_id: user.id, limit: 40 } }).then((r) => setMine(r.data));
  }, [user]);

  if (!user) return null;

  return (
    <div data-testid="profile-page">
      <div className="glass rounded-3xl p-8 mb-10 relative overflow-hidden">
        <div className="absolute -top-20 -right-20 w-80 h-80 rounded-full blur-3xl" style={{background:"radial-gradient(circle,#dc143c33,transparent 70%)"}} />
        <div className="flex flex-col sm:flex-row sm:items-end gap-6 relative">
          <img src={user.avatar} alt="" className="w-28 h-28 rounded-2xl ring-4 ring-crimson/40" />
          <div className="flex-1">
            <div className="text-[10px] uppercase tracking-[0.25em] text-white/40 mb-1">Forger</div>
            <h1 className="font-display text-4xl sm:text-5xl">{user.username}</h1>
            <p className="text-white/55 mt-2">{user.email}</p>
          </div>
          <div className="grid grid-cols-3 gap-6 text-center">
            <div><div className="font-display text-3xl">{mine.length}</div><div className="text-[10px] uppercase tracking-[0.2em] text-white/45">Forges</div></div>
            <div><div className="font-display text-3xl">{mine.reduce((s,m)=>s+(m.likes||0),0)}</div><div className="text-[10px] uppercase tracking-[0.2em] text-white/45">Likes</div></div>
            <div><div className="font-display text-3xl">{Intl.NumberFormat("en",{notation:"compact"}).format(mine.reduce((s,m)=>s+(m.watches||0),0))}</div><div className="text-[10px] uppercase tracking-[0.2em] text-white/45">Watches</div></div>
          </div>
        </div>
      </div>

      <h2 className="font-display text-2xl mb-4">Your latest forges</h2>
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 stagger-in">
        {mine.map((m) => <MovieCard key={m.id} movie={m} />)}
      </div>
    </div>
  );
}
