import { Outlet, NavLink, useNavigate } from "react-router-dom";
import { useState } from "react";
import {
  Home, Compass, Trophy, Sparkles, Search, Archive, Clock,
  Film, FolderOpen, User, Settings, FileCode, LogOut, MessageCircle, Menu, Store
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import AIChatDock from "@/components/ai/AIChatDock";

const navItems = [
  { to: "/", label: "For You", icon: Home, tid: "nav-home" },
  { to: "/browse", label: "Browse", icon: Compass, tid: "nav-browse" },
  { to: "/marketplace", label: "Marketplace", icon: Store, tid: "nav-marketplace" },
  { to: "/leaderboard", label: "Leaderboard", icon: Trophy, tid: "nav-leaderboard" },
  { to: "/whats-new", label: "What's New", icon: Sparkles, tid: "nav-new" },
  { to: "/coming-soon", label: "Coming Soon", icon: Clock, tid: "nav-coming-soon" },
  { to: "/search", label: "Search", icon: Search, tid: "nav-search" },
  { to: "/archive", label: "Archive", icon: Archive, tid: "nav-archive" },
];

const studioItems = [
  { to: "/create", label: "Create Studio", icon: Film, tid: "nav-create" },
  { to: "/creations", label: "Creations & Forks", icon: FolderOpen, tid: "nav-creations" },
  { to: "/decoder", label: "File Decoder", icon: FileCode, tid: "nav-decoder" },
];

const accountItems = [
  { to: "/profile", label: "Profile", icon: User, tid: "nav-profile" },
  { to: "/settings", label: "Settings", icon: Settings, tid: "nav-settings" },
];

export default function AppShell() {
  const { user, logout } = useAuth();
  const nav = useNavigate();
  const [chatOpen, setChatOpen] = useState(false);
  const [sideOpen, setSideOpen] = useState(false);

  const Side = (
    <aside
      data-testid="sidebar"
      className={`fixed lg:sticky top-0 left-0 h-screen w-72 glass-strong border-r border-white/5 z-40 transform transition-transform ${sideOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}`}
    >
      <div className="px-6 pt-7 pb-4 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl crimson-glow flex items-center justify-center" style={{background:"linear-gradient(135deg,#dc143c,#5a0b8a)"}}>
          <Film className="w-5 h-5 text-white" />
        </div>
        <div>
          <div className="font-display text-2xl leading-none">CinemaForge</div>
          <div className="text-[10px] uppercase tracking-[0.25em] text-white/40 mt-1">create · stream · evolve</div>
        </div>
      </div>

      <nav className="px-3 py-3 overflow-y-auto h-[calc(100vh-160px)] hide-scrollbar">
        <Group title="Discover" items={navItems} />
        <Group title="Studio" items={studioItems} />
        <Group title="Account" items={accountItems} />

        <button
          data-testid="ai-chat-toggle"
          onClick={() => setChatOpen(true)}
          className="mt-3 w-full text-left flex items-center gap-3 px-4 py-3 rounded-xl ring-shimmer bg-black/40 hover:bg-black/60 transition"
        >
          <MessageCircle className="w-4 h-4 text-crimson" />
          <div>
            <div className="text-sm font-medium">FORGE Assistant</div>
            <div className="text-[11px] text-white/50">AI director · always on</div>
          </div>
          <span className="ml-auto w-2 h-2 rounded-full bg-emerald-400 pulse-dot" />
        </button>
      </nav>

      <div className="absolute bottom-0 left-0 right-0 p-4 border-t border-white/5">
        {user ? (
          <div className="flex items-center gap-3">
            <img src={user.avatar} alt="" className="w-9 h-9 rounded-full ring-2 ring-crimson/60" />
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium truncate">{user.username}</div>
              <div className="text-[11px] text-white/40 truncate">{user.email}</div>
            </div>
            <button data-testid="logout-btn" onClick={() => { logout(); nav("/auth"); }} className="text-white/50 hover:text-crimson transition">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <button data-testid="sign-in-cta" onClick={() => nav("/auth")} className="w-full px-4 py-2 rounded-xl bg-crimson text-white text-sm font-medium hover:brightness-110 transition" style={{background:"#dc143c"}}>
            Sign in to create
          </button>
        )}
      </div>
    </aside>
  );

  return (
    <div className="min-h-screen flex">
      {Side}

      <main className="flex-1 min-w-0">
        <header className="sticky top-0 z-30 glass border-b border-white/5 px-5 py-3 flex items-center gap-3">
          <button onClick={() => setSideOpen(v => !v)} className="lg:hidden text-white/70" data-testid="mobile-menu">
            <Menu className="w-5 h-5" />
          </button>
          <NavLink to="/" className="font-display text-lg lg:hidden">CinemaForge</NavLink>
          <div className="hidden md:flex items-center gap-2 ml-auto text-white/50 text-xs uppercase tracking-[0.25em]">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 pulse-dot" />
            <span>AI Agents online</span>
          </div>
          <NavLink to="/create" className="ml-auto md:ml-4 px-4 py-2 rounded-full text-sm font-medium text-white" style={{background:"linear-gradient(90deg,#dc143c,#7a1bbf)"}} data-testid="header-create-btn">
            + Forge
          </NavLink>
        </header>
        <div className="px-4 sm:px-8 lg:px-12 py-6">
          <Outlet />
        </div>
      </main>

      <AIChatDock open={chatOpen} onClose={() => setChatOpen(false)} />
    </div>
  );
}

function Group({ title, items }) {
  return (
    <div className="mb-6">
      <div className="px-3 mb-2 text-[10px] uppercase tracking-[0.28em] text-white/30">{title}</div>
      <ul className="space-y-1">
        {items.map((it) => (
          <li key={it.to}>
            <NavLink
              to={it.to}
              data-testid={it.tid}
              end={it.to === "/"}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm transition-all duration-200 group ${
                  isActive
                    ? "bg-white/5 text-white border-l-2 border-crimson"
                    : "text-white/65 hover:text-white hover:bg-white/5"
                }`
              }
            >
              <it.icon className="w-4 h-4 group-hover:text-crimson transition" />
              <span>{it.label}</span>
            </NavLink>
          </li>
        ))}
      </ul>
    </div>
  );
}
