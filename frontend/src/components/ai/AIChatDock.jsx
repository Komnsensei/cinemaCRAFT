import { useEffect, useRef, useState } from "react";
import { X, Send, Sparkles, Bot, User as UserIcon } from "lucide-react";
import api from "@/lib/api";

const SUGGESTIONS = [
  "Pitch me a noir trailer with 2 leads under 90 seconds.",
  "Fix my broken prompt: 'space ghosts in love but make it funny.'",
  "Suggest a Strange AI cold open in 3 beats.",
  "What actors should I cast for a Cyberpunk heist?",
];

export default function AIChatDock({ open, onClose }) {
  const [messages, setMessages] = useState([
    { role: "assistant", text: "I'm FORGE. Director-on-call. Drop a prompt and I'll cut it into a trailer beat-sheet, recommend cast, or repair a broken chain. What are we making?" },
  ]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const bottomRef = useRef(null);

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, open]);

  const send = async (text) => {
    const msg = (text ?? input).trim();
    if (!msg || sending) return;
    setInput("");
    setMessages((m) => [...m, { role: "user", text: msg }]);
    setSending(true);
    try {
      const r = await api.post("/ai/chat", { message: msg, session_id: sessionId });
      setSessionId(r.data.session_id);
      setMessages((m) => [...m, { role: "assistant", text: r.data.reply }]);
    } catch (e) {
      setMessages((m) => [...m, { role: "assistant", text: "FORGE is rebooting its synapses. Try again in a moment." }]);
    } finally {
      setSending(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-6" data-testid="ai-chat-dock">
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full sm:max-w-2xl h-[88vh] sm:h-[78vh] glass-strong rounded-t-3xl sm:rounded-3xl ring-shimmer flex flex-col overflow-hidden">
        <div className="flex items-center gap-3 px-5 py-4 border-b border-white/5">
          <div className="w-9 h-9 rounded-full flex items-center justify-center crimson-glow" style={{background:"linear-gradient(135deg,#dc143c,#5a0b8a)"}}>
            <Bot className="w-4 h-4 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="font-display text-xl leading-none">FORGE</div>
            <div className="text-[11px] uppercase tracking-[0.25em] text-white/45 mt-1">in-app AI director · claude sonnet 4.5</div>
          </div>
          <button data-testid="ai-chat-close" onClick={onClose} className="text-white/60 hover:text-white transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-5 space-y-4">
          {messages.map((m, i) => (
            <div key={i} className={`flex gap-3 ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              {m.role === "assistant" && (
                <div className="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center" style={{background:"#5a0b8a"}}>
                  <Sparkles className="w-3.5 h-3.5 text-white" />
                </div>
              )}
              <div className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm whitespace-pre-wrap leading-relaxed ${
                m.role === "user"
                  ? "text-white"
                  : "bg-white/[0.04] border border-white/5 text-white/90"
              }`} style={m.role === "user" ? {background:"linear-gradient(135deg,#dc143c,#7a1bbf)"} : {}}>
                {m.text}
              </div>
              {m.role === "user" && (
                <div className="w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center bg-white/10">
                  <UserIcon className="w-3.5 h-3.5 text-white/70" />
                </div>
              )}
            </div>
          ))}
          {sending && (
            <div className="flex items-center gap-2 text-white/40 text-xs pl-10">
              <span className="w-1.5 h-1.5 rounded-full bg-crimson pulse-dot" />
              FORGE is composing…
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {messages.length <= 1 && (
          <div className="px-5 pb-2 flex flex-wrap gap-2">
            {SUGGESTIONS.map((s) => (
              <button key={s} onClick={() => send(s)} data-testid={`ai-suggest-${s.slice(0,8)}`} className="text-xs px-3 py-1.5 rounded-full border border-white/10 text-white/70 hover:text-white hover:border-crimson transition">
                {s}
              </button>
            ))}
          </div>
        )}

        <form
          onSubmit={(e) => { e.preventDefault(); send(); }}
          className="border-t border-white/5 px-3 py-3 flex items-center gap-2"
        >
          <input
            data-testid="ai-chat-input"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Direct your next scene…"
            className="flex-1 bg-black/40 border border-white/10 rounded-full px-5 py-3 text-sm focus:outline-none focus:border-crimson placeholder:text-white/30"
          />
          <button
            data-testid="ai-chat-send"
            disabled={sending}
            className="w-11 h-11 rounded-full flex items-center justify-center text-white disabled:opacity-50"
            style={{background:"linear-gradient(135deg,#dc143c,#7a1bbf)"}}
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}
