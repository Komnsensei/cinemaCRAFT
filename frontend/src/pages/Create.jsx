import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import api from "@/lib/api";
import { Flame, Wand2, Clapperboard } from "lucide-react";

const LENGTHS = [
  { id: "trailer", label: "Trailer", sub: "~2 min" },
  { id: "short25", label: "Short", sub: "25 min" },
  { id: "episode45", label: "Episode", sub: "45 min" },
  { id: "feature90", label: "Feature", sub: "1.5 hr" },
];

const GENRES = ["Sci-Fi", "Thriller", "Drama", "Horror", "Strange AI", "Romance", "Action", "Documentary"];

export default function Create() {
  const nav = useNavigate();
  const [prompts, setPrompts] = useState([]);
  const [actors, setActors] = useState([]);
  const [title, setTitle] = useState("");
  const [prompt, setPrompt] = useState("");
  const [genre, setGenre] = useState("Sci-Fi");
  const [length, setLength] = useState("trailer");
  const [format, setFormat] = useState("movie");
  const [picked, setPicked] = useState([]);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    api.get("/prompts").then((r) => setPrompts(r.data));
    api.get("/actors").then((r) => setActors(r.data));
  }, []);

  const toggleActor = (id) => {
    setPicked((p) => p.includes(id) ? p.filter(x => x !== id) : (p.length >= 4 ? p : [...p, id]));
  };

  const onForge = async () => {
    if (!prompt.trim()) return toast.error("Pick a prompt or write your own.");
    setBusy(true);
    try {
      const r = await api.post("/movies", {
        title: title || null, prompt, genre, length, format,
        actors: picked,
      });
      toast.success("Forged!");
      nav(`/m/${r.data.id}`);
    } catch (e) {
      toast.error(e.response?.data?.detail || "Forge failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div data-testid="create-page" className="max-w-7xl mx-auto">
      <div className="flex items-end gap-4 mb-10">
        <Clapperboard className="w-10 h-10 text-crimson" />
        <div>
          <h1 className="font-display text-4xl sm:text-5xl">Create Studio</h1>
          <p className="text-white/45 mt-1">Pick a spark. Cast your cast. Choose your runtime. Forge.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Trending prompts */}
        <section className="lg:col-span-7 glass rounded-2xl p-6">
          <h2 className="font-display text-2xl mb-1 flex items-center gap-2"><Flame className="w-5 h-5 text-crimson" /> Trending Prompts</h2>
          <p className="text-white/45 text-sm mb-5">Tap one to load, then tweak. Or skip and write your own.</p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3" data-testid="prompts-grid">
            {prompts.map((p) => (
              <button
                key={p.id}
                data-testid={`prompt-${p.id}`}
                onClick={() => { setPrompt(p.blurb); setTitle(p.title); setGenre(p.genre); }}
                className={`text-left p-4 rounded-xl border transition ${prompt === p.blurb ? "border-crimson bg-crimson/10" : "border-white/10 hover:border-white/30 bg-white/[0.02]"}`}
              >
                <div className="text-[10px] uppercase tracking-[0.25em] text-white/40 mb-1">{p.genre} · {p.tag}</div>
                <div className="font-display text-lg leading-tight">{p.title}</div>
                <div className="text-white/55 text-sm mt-1">{p.blurb}</div>
              </button>
            ))}
          </div>
        </section>

        {/* Builder */}
        <aside className="lg:col-span-5 glass rounded-2xl p-6 self-start sticky top-24">
          <h2 className="font-display text-2xl mb-4 flex items-center gap-2"><Wand2 className="w-5 h-5 text-violet" /> Forge Setup</h2>

          <label className="block text-xs uppercase tracking-[0.25em] text-white/50 mb-2">Title</label>
          <input data-testid="forge-title" value={title} onChange={(e)=>setTitle(e.target.value)} placeholder="Untitled Project" className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2.5 mb-4 text-sm focus:outline-none focus:border-crimson" />

          <label className="block text-xs uppercase tracking-[0.25em] text-white/50 mb-2">Prompt / Synopsis</label>
          <textarea data-testid="forge-prompt" value={prompt} onChange={(e)=>setPrompt(e.target.value)} rows={3} placeholder="A noir detective in 2099 chases a memory thief…" className="w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2.5 mb-4 text-sm focus:outline-none focus:border-crimson" />

          <label className="block text-xs uppercase tracking-[0.25em] text-white/50 mb-2">Genre</label>
          <div className="flex flex-wrap gap-1.5 mb-4" data-testid="genre-picker">
            {GENRES.map((g) => (
              <button key={g} data-testid={`pick-genre-${g}`} onClick={()=>setGenre(g)} className={`px-3 py-1.5 rounded-full text-xs transition ${g===genre ? "text-white" : "text-white/55 hover:text-white border border-white/10"}`} style={g===genre ? {background:"linear-gradient(90deg,#dc143c,#7a1bbf)"} : {}}>
                {g}
              </button>
            ))}
          </div>

          <label className="block text-xs uppercase tracking-[0.25em] text-white/50 mb-2">Length</label>
          <div className="grid grid-cols-4 gap-2 mb-4" data-testid="length-picker">
            {LENGTHS.map((l) => (
              <button key={l.id} data-testid={`length-${l.id}`} onClick={()=>setLength(l.id)} className={`p-2 rounded-lg border text-center transition ${length===l.id ? "border-crimson bg-crimson/10" : "border-white/10 hover:border-white/25"}`}>
                <div className="text-xs font-medium">{l.label}</div>
                <div className="text-[10px] text-white/45">{l.sub}</div>
              </button>
            ))}
          </div>

          <label className="block text-xs uppercase tracking-[0.25em] text-white/50 mb-2">Format</label>
          <div className="flex gap-2 mb-6" data-testid="format-picker">
            {["movie","series"].map((f) => (
              <button key={f} data-testid={`format-${f}`} onClick={()=>setFormat(f)} className={`flex-1 py-2 rounded-lg border text-sm capitalize transition ${format===f ? "border-crimson bg-crimson/10" : "border-white/10 hover:border-white/25"}`}>
                {f}
              </button>
            ))}
          </div>

          <button
            data-testid="forge-submit"
            onClick={onForge}
            disabled={busy}
            className="w-full py-3 rounded-xl text-white font-semibold disabled:opacity-50"
            style={{background:"linear-gradient(90deg,#dc143c,#7a1bbf)"}}
          >
            {busy ? "Forging…" : "Forge this creation"}
          </button>
        </aside>

        {/* Cast */}
        <section className="lg:col-span-12 glass rounded-2xl p-6">
          <h2 className="font-display text-2xl mb-1">Cast Selection</h2>
          <p className="text-white/45 text-sm mb-5">Pick up to 4 performers. Their attributes flavor every scene.</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3" data-testid="actors-grid">
            {actors.map((a) => {
              const on = picked.includes(a.id);
              return (
                <button key={a.id} data-testid={`actor-${a.id}`} onClick={()=>toggleActor(a.id)} className={`text-left p-3 rounded-xl border transition relative overflow-hidden ${on ? "border-crimson" : "border-white/10 hover:border-white/30"}`}>
                  {on && <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-crimson pulse-dot" />}
                  <img src={a.img} alt={a.name} className="w-full aspect-[3/4] object-cover rounded-lg mb-2" />
                  <div className="font-display text-base leading-tight">{a.name}</div>
                  <div className="text-[11px] text-white/50 mt-1 space-y-0.5">
                    <div>{a.vibe}</div>
                    <div>{a.hair}</div>
                    <div>{a.voice}</div>
                  </div>
                </button>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}
