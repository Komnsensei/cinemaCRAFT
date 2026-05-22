import { useState } from "react";
import { Upload, File as FileIcon, FileText, Image as ImageIcon, FileVideo, FileAudio, Hash } from "lucide-react";

const KIND_MAP = [
  { test: /^image\//, kind: "image", icon: ImageIcon },
  { test: /^video\//, kind: "video", icon: FileVideo },
  { test: /^audio\//, kind: "audio", icon: FileAudio },
  { test: /^text\//, kind: "text", icon: FileText },
  { test: /^application\/(json|xml|pdf)/, kind: "doc", icon: FileText },
];

function classify(file) {
  for (const m of KIND_MAP) if (m.test.test(file.type)) return m;
  return { kind: "binary", icon: FileIcon };
}

export default function FileViewer() {
  const [file, setFile] = useState(null);
  const [url, setUrl] = useState(null);
  const [text, setText] = useState("");
  const [hex, setHex] = useState("");

  const onPick = async (f) => {
    setFile(f);
    setText(""); setHex("");
    const cls = classify(f);
    if (url) URL.revokeObjectURL(url);
    setUrl(URL.createObjectURL(f));
    if (cls.kind === "text" || /json|xml/.test(f.type)) {
      setText(await f.text());
    } else {
      const buf = await f.slice(0, 512).arrayBuffer();
      const arr = new Uint8Array(buf);
      const lines = [];
      for (let i = 0; i < arr.length; i += 16) {
        const slice = arr.slice(i, i+16);
        const h = [...slice].map(b => b.toString(16).padStart(2,"0")).join(" ");
        const a = [...slice].map(b => (b >= 32 && b < 127) ? String.fromCharCode(b) : ".").join("");
        lines.push(`${i.toString(16).padStart(6,"0")}  ${h.padEnd(48," ")}  ${a}`);
      }
      setHex(lines.join("\n"));
    }
  };

  const cls = file ? classify(file) : null;
  const KindIcon = cls?.icon || FileIcon;

  return (
    <div data-testid="file-viewer-page">
      <div className="flex items-end gap-4 mb-8">
        <Hash className="w-9 h-9 text-violet" />
        <div>
          <h1 className="font-display text-4xl sm:text-5xl">Multi-File Decoder</h1>
          <p className="text-white/45 mt-1">Drop any media file — image, video, audio, text, json, raw binary. We'll preview & decode the first 512 bytes.</p>
        </div>
      </div>

      <label className="block glass rounded-2xl p-10 text-center cursor-pointer hover:border-crimson border border-dashed border-white/15 transition" data-testid="file-drop">
        <Upload className="w-9 h-9 text-white/40 mx-auto mb-3" />
        <div className="text-white/80">Click to upload — or drag a file here</div>
        <div className="text-xs text-white/40 mt-1">No file leaves your browser.</div>
        <input data-testid="file-input" type="file" className="hidden" onChange={(e) => e.target.files?.[0] && onPick(e.target.files[0])} />
      </label>

      {file && (
        <div className="mt-8 grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-7 glass rounded-2xl p-6 min-h-[300px] flex items-center justify-center">
            {cls.kind === "image" && <img src={url} alt="" className="max-h-[60vh] max-w-full rounded-xl" />}
            {cls.kind === "video" && <video src={url} controls className="max-h-[60vh] max-w-full rounded-xl" />}
            {cls.kind === "audio" && <audio src={url} controls className="w-full" />}
            {(cls.kind === "text" || cls.kind === "doc") && (
              <pre className="w-full max-h-[60vh] overflow-auto text-xs font-mono-d text-white/80 whitespace-pre-wrap" data-testid="text-preview">{text || "Loading…"}</pre>
            )}
            {cls.kind === "binary" && <div className="text-white/55">Binary file — see hex panel →</div>}
          </div>

          <div className="lg:col-span-5 space-y-4">
            <div className="glass rounded-2xl p-5">
              <div className="flex items-center gap-3 mb-3">
                <KindIcon className="w-5 h-5 text-crimson" />
                <div>
                  <div className="font-display text-lg leading-none">{file.name}</div>
                  <div className="text-[11px] text-white/45 uppercase tracking-[0.2em] mt-1">{cls.kind} · {file.type || "unknown"}</div>
                </div>
              </div>
              <dl className="text-sm grid grid-cols-2 gap-2 mt-3">
                <div><dt className="text-white/40 text-[10px] uppercase tracking-[0.2em]">Size</dt><dd>{(file.size/1024).toFixed(1)} KB</dd></div>
                <div><dt className="text-white/40 text-[10px] uppercase tracking-[0.2em]">Last Modified</dt><dd>{new Date(file.lastModified).toLocaleString()}</dd></div>
              </dl>
            </div>
            <div className="glass rounded-2xl p-5">
              <div className="text-[10px] uppercase tracking-[0.25em] text-white/45 mb-2">Hex / ASCII (first 512 bytes)</div>
              <pre className="text-[10px] font-mono-d text-white/75 max-h-[40vh] overflow-auto whitespace-pre" data-testid="hex-preview">{hex || "—"}</pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
