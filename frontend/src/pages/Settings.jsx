import { useState } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";
import { Cog, Key, Users, FileText, Upload } from "lucide-react";

export default function Settings() {
  const { user } = useAuth();
  const [push, setPush] = useState(true);
  const [adult, setAdult] = useState(false);
  const [keys, setKeys] = useState({ sora: "", veo: "", runway: "", elevenlabs: "" });

  return (
    <div data-testid="settings-page" className="max-w-5xl">
      <div className="flex items-end gap-4 mb-8">
        <Cog className="w-9 h-9 text-violet" />
        <div>
          <h1 className="font-display text-4xl sm:text-5xl">Settings</h1>
          <p className="text-white/45 mt-1">Tune your hub. Plug in providers. Set the rules.</p>
        </div>
      </div>

      <Tabs defaultValue="profile">
        <TabsList className="h-auto bg-black/40 border border-white/10 p-1 mb-6 gap-1 overflow-x-auto" data-testid="settings-tabs">
          <TabsTrigger value="profile" data-testid="tab-profile" className="data-[state=active]:bg-crimson data-[state=active]:text-white px-4 py-2">Profile</TabsTrigger>
          <TabsTrigger value="connections" data-testid="tab-connections" className="data-[state=active]:bg-crimson data-[state=active]:text-white px-4 py-2">Connections</TabsTrigger>
          <TabsTrigger value="providers" data-testid="tab-providers" className="data-[state=active]:bg-crimson data-[state=active]:text-white px-4 py-2">Providers / Keys</TabsTrigger>
          <TabsTrigger value="updown" data-testid="tab-updown" className="data-[state=active]:bg-crimson data-[state=active]:text-white px-4 py-2">Upload / Download</TabsTrigger>
          <TabsTrigger value="terms" data-testid="tab-terms" className="data-[state=active]:bg-crimson data-[state=active]:text-white px-4 py-2">Terms</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="glass rounded-2xl p-6 space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-base">Notifications</Label>
              <p className="text-white/45 text-sm">Get pinged when your forges get likes or forks.</p>
            </div>
            <Switch checked={push} onCheckedChange={setPush} data-testid="switch-push" />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <Label className="text-base">Show mature content</Label>
              <p className="text-white/45 text-sm">Reveal genre tagged "Strange AI · 18+".</p>
            </div>
            <Switch checked={adult} onCheckedChange={setAdult} data-testid="switch-adult" />
          </div>
        </TabsContent>

        <TabsContent value="connections" className="glass rounded-2xl p-6">
          <Users className="w-6 h-6 text-violet mb-2" />
          <h2 className="font-display text-xl mb-3">Connections</h2>
          <p className="text-white/55 text-sm">Follow other forgers, see their evolutions, get notified when they ship.</p>
          {user ? (
            <div className="mt-6 text-white/60 text-sm">You don't follow anyone yet. Visit the Leaderboard and tap a creator.</div>
          ) : (
            <div className="mt-6 text-white/60 text-sm">Sign in to manage connections.</div>
          )}
        </TabsContent>

        <TabsContent value="providers" className="glass rounded-2xl p-6">
          <Key className="w-6 h-6 text-crimson mb-2" />
          <h2 className="font-display text-xl mb-1">AI Provider Keys</h2>
          <p className="text-white/55 text-sm mb-6">The chat agent (FORGE) runs on the Emergent Universal Key by default. To enable real video rendering, drop in your provider keys below.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {[
              ["sora", "OpenAI Sora 2", "sk-…"],
              ["veo", "Google Veo 3", "veo-…"],
              ["runway", "Runway Gen-3", "rwy_…"],
              ["elevenlabs", "ElevenLabs Voice", "el_…"],
            ].map(([k, label, ph]) => (
              <div key={k}>
                <Label className="text-xs uppercase tracking-[0.2em] text-white/50">{label}</Label>
                <input data-testid={`key-${k}`} value={keys[k]} onChange={(e)=>setKeys({...keys,[k]:e.target.value})} type="password" placeholder={ph} className="mt-1.5 w-full bg-black/40 border border-white/10 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-crimson" />
              </div>
            ))}
          </div>
          <button onClick={()=>toast.success("Keys saved locally. Wire backend env to activate.")} className="mt-6 px-5 py-2 rounded-full text-white text-sm" style={{background:"linear-gradient(90deg,#dc143c,#7a1bbf)"}} data-testid="save-keys">
            Save provider keys
          </button>
          <p className="text-xs text-white/40 mt-3">Keys are stored client-side until backend integration is enabled.</p>
        </TabsContent>

        <TabsContent value="updown" className="glass rounded-2xl p-6">
          <Upload className="w-6 h-6 text-violet mb-2" />
          <h2 className="font-display text-xl mb-3">Upload / Download Rules</h2>
          <ul className="space-y-2 text-sm text-white/70 list-disc pl-5">
            <li>Maximum file size: 2 GB per upload.</li>
            <li>Allowed: mp4, mov, webm, mp3, wav, png, jpg, srt, vtt.</li>
            <li>No copyrighted material you do not have rights to.</li>
            <li>No deepfakes of real, non-consenting individuals.</li>
            <li>Downloads are watermarked with creator's CinemaForge ID.</li>
            <li>Forks of your work inherit your free-to-play setting unless you opt out.</li>
          </ul>
        </TabsContent>

        <TabsContent value="terms" className="glass rounded-2xl p-6">
          <FileText className="w-6 h-6 text-violet mb-2" />
          <h2 className="font-display text-xl mb-3">Terms & Conditions</h2>
          <div className="text-sm text-white/70 space-y-3 leading-relaxed">
            <p>By using CinemaForge you agree that the content you generate may be reviewed by safety classifiers, and that derivative works ("Evolutions" / "Forks") of your published content can be created by other users unless you explicitly mark a piece as "no-fork."</p>
            <p>You retain authorship of the prompt and the cast you select. The platform retains rights to display, recommend, and showcase your published creations on leaderboards and discovery shelves.</p>
            <p>Strange AI content is opt-in and gated behind the mature toggle above.</p>
            <p>Refer to the Upload rules tab for media constraints.</p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
