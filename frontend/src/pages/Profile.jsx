import { useEffect, useState } from "react";
import api from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { Link } from "react-router-dom";
import MovieCard from "@/components/movie/MovieCard";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Flame, KeyRound, Coins, TrendingUp } from "lucide-react";

export default function Profile() {
  const { user } = useAuth();
  const [mine, setMine] = useState([]);
  const [earnings, setEarnings] = useState(null);
  const [licenses, setLicenses] = useState([]);

  useEffect(() => {
    if (!user) return;
    api.get("/movies", { params: { creator_id: user.id, limit: 40 } }).then((r) => setMine(r.data));
    api.get("/creator/earnings").then((r) => setEarnings(r.data));
    api.get("/licenses/my").then((r) => setLicenses(r.data));
  }, [user]);

  if (!user) return null;

  const totalEarnings = earnings?.grand_total ?? 0;

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
          <div className="grid grid-cols-4 gap-6 text-center">
            <Stat label="Forges" value={mine.length} />
            <Stat label="Likes" value={mine.reduce((s,m)=>s+(m.likes||0),0)} />
            <Stat label="Watches" value={Intl.NumberFormat("en",{notation:"compact"}).format(mine.reduce((s,m)=>s+(m.watches||0),0))} />
            <Stat label="Earnings" value={`$${totalEarnings.toFixed(2)}`} accent />
          </div>
        </div>
      </div>

      <Tabs defaultValue="forges">
        <TabsList className="h-auto bg-black/40 border border-white/10 p-1 mb-6 gap-1" data-testid="profile-tabs">
          <TabsTrigger value="forges" data-testid="tab-forges" className="data-[state=active]:bg-crimson data-[state=active]:text-white px-4 py-2">My Forges</TabsTrigger>
          <TabsTrigger value="earnings" data-testid="tab-earnings" className="data-[state=active]:bg-crimson data-[state=active]:text-white px-4 py-2">Earnings</TabsTrigger>
          <TabsTrigger value="licenses" data-testid="tab-licenses" className="data-[state=active]:bg-crimson data-[state=active]:text-white px-4 py-2">My Licenses</TabsTrigger>
        </TabsList>

        <TabsContent value="forges">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 stagger-in">
            {mine.map((m) => <MovieCard key={m.id} movie={m} />)}
          </div>
        </TabsContent>

        <TabsContent value="earnings">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6" data-testid="earnings-grid">
            <EarnCard
              testid="earn-tips"
              icon={Flame}
              accent="#dc143c"
              label="Tips received"
              count={earnings?.tips?.count ?? 0}
              total={earnings?.tips?.total ?? 0}
            />
            <EarnCard
              testid="earn-licenses"
              icon={KeyRound}
              accent="#b06bff"
              label="License sales"
              count={earnings?.licenses?.count ?? 0}
              total={earnings?.licenses?.total ?? 0}
            />
            <EarnCard
              testid="earn-total"
              icon={TrendingUp}
              accent="#fbbf24"
              label="Lifetime total"
              count={(earnings?.tips?.count ?? 0) + (earnings?.licenses?.count ?? 0)}
              total={earnings?.grand_total ?? 0}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="glass rounded-2xl p-5">
              <h3 className="font-display text-xl mb-4 flex items-center gap-2"><Flame className="w-4 h-4 text-crimson" /> Recent tips</h3>
              {(earnings?.tips?.recent ?? []).length === 0 && <p className="text-white/45 text-sm">No tips yet. Share your forges to start earning.</p>}
              <ul className="space-y-2">
                {(earnings?.tips?.recent ?? []).map((t) => (
                  <li key={t.id} className="flex items-center justify-between text-sm border-b border-white/5 pb-2 last:border-0">
                    <span className="text-white/70">Tip on movie · {new Date(t.created_at).toLocaleDateString()}</span>
                    <span className="font-mono-d text-crimson">+${t.amount.toFixed(2)}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="glass rounded-2xl p-5">
              <h3 className="font-display text-xl mb-4 flex items-center gap-2"><KeyRound className="w-4 h-4 text-violet" /> Recent license sales</h3>
              {(earnings?.licenses?.recent ?? []).length === 0 && <p className="text-white/45 text-sm">No license sales yet. Publish a character or world to start.</p>}
              <ul className="space-y-2">
                {(earnings?.licenses?.recent ?? []).map((l) => (
                  <li key={l.id} className="flex items-center justify-between text-sm border-b border-white/5 pb-2 last:border-0">
                    <span className="text-white/70">{l.asset?.name || l.asset_type} · {l.tier}</span>
                    <span className="font-mono-d text-violet">+${l.amount.toFixed(2)}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <button
            disabled={totalEarnings <= 0}
            className="mt-6 px-6 py-3 rounded-full font-semibold text-white disabled:opacity-40 flex items-center gap-2"
            style={{ background: "linear-gradient(90deg,#dc143c,#7a1bbf)" }}
            data-testid="withdraw-btn"
          >
            <Coins className="w-4 h-4" /> Withdraw ${totalEarnings.toFixed(2)} (coming soon)
          </button>
        </TabsContent>

        <TabsContent value="licenses">
          {licenses.length === 0 ? (
            <div className="glass rounded-2xl p-10 text-center">
              <p className="text-white/55 mb-4">You don't own any character/world licenses yet.</p>
              <Link to="/marketplace" className="inline-block px-6 py-2.5 rounded-full text-white font-medium" style={{ background: "linear-gradient(90deg,#dc143c,#7a1bbf)" }}>Browse Marketplace</Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 stagger-in" data-testid="owned-licenses">
              {licenses.map((l) => (
                <Link key={l.id} to={`/marketplace/${l.asset_type}/${l.asset_id}`} className="glass rounded-2xl overflow-hidden hover-lift">
                  {l.asset?.image_url && <img src={l.asset.image_url} alt="" className="w-full aspect-[16/9] object-cover" />}
                  <div className="p-4">
                    <div className="text-[10px] uppercase tracking-[0.25em] text-violet mb-1">{l.asset_type} · {l.tier}</div>
                    <div className="font-display text-xl leading-tight">{l.asset?.name || "Asset"}</div>
                    <div className="text-xs text-white/45 mt-1">Acquired {new Date(l.created_at).toLocaleDateString()}</div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}

function Stat({ label, value, accent }) {
  return (
    <div>
      <div className={`font-display text-3xl ${accent ? "text-crimson" : ""}`}>{value}</div>
      <div className="text-[10px] uppercase tracking-[0.2em] text-white/45">{label}</div>
    </div>
  );
}

function EarnCard({ icon: Icon, accent, label, count, total, testid }) {
  return (
    <div className="glass rounded-2xl p-5" data-testid={testid}>
      <Icon className="w-5 h-5 mb-2" style={{ color: accent }} />
      <div className="text-[10px] uppercase tracking-[0.25em] text-white/45">{label}</div>
      <div className="font-display text-3xl mt-1">${total.toFixed(2)}</div>
      <div className="text-xs text-white/55 mt-1">{count} transactions</div>
    </div>
  );
}
