"""Local-first cinemaCRAFT prompt and video mastering engine."""
from __future__ import annotations
import argparse, json, shutil, subprocess, urllib.request, urllib.error, time, uuid
from dataclasses import dataclass, field
from pathlib import Path

class EngineError(RuntimeError): pass

@dataclass
class Character:
    name: str
    age: str = "adult"
    face: str = ""
    hair: str = ""
    eyes: str = ""
    skin: str = ""
    wardrobe: str = ""
    features: list[str] = field(default_factory=list)
    identity_lock: str = "Preserve the same identity and facial proportions in every shot."
    avoid: list[str] = field(default_factory=lambda: ["identity drift", "waxy skin", "extra fingers", "duplicate limbs", "watermark", "unintended text"])
    def anchor(self):
        return ", ".join(x for x in [self.name, self.age, self.face, self.hair, self.eyes, self.skin, self.wardrobe, ", ".join(self.features), self.identity_lock] if x)

@dataclass
class Shot:
    id: str
    prompt: str
    duration_seconds: float = 5
    character: str | None = None
    negative_prompt: str = ""
    camera: str = "cinematic medium shot"
    lighting: str = "physically plausible natural lighting"
    aspect_ratio: str = "16:9"

@dataclass
class Project:
    title: str
    output_dir: str = "output"
    target_width: int = 1920
    target_height: int = 1080
    fps: int = 24
    shots: list[Shot] = field(default_factory=list)
    characters: dict[str, Character] = field(default_factory=dict)
    @classmethod
    def load(cls, path):
        d = json.loads(Path(path).read_text(encoding="utf-8"))
        p = cls(d["title"], d.get("output_dir", "output"), int(d.get("target_width", 1920)), int(d.get("target_height", 1080)), int(d.get("fps", 24)), [Shot(**x) for x in d.get("shots", [])], {k: Character(**v) for k,v in d.get("characters", {}).items()})
        p.validate()
        return p
    def validate(self):
        if not self.title.strip(): raise EngineError("Project title is required.")
        if self.target_width < 16 or self.target_height < 16: raise EngineError("Dimensions must be at least 16x16.")
        if not 1 <= self.fps <= 120: raise EngineError("FPS must be 1 through 120.")
        ids = [s.id for s in self.shots]
        if len(ids) != len(set(ids)): raise EngineError("Shot IDs must be unique.")
        for s in self.shots:
            if not s.id.strip() or not s.prompt.strip(): raise EngineError("Every shot needs an ID and prompt.")
            if s.duration_seconds <= 0: raise EngineError("Shot duration must be positive.")
            if s.character and s.character not in self.characters: raise EngineError("Unknown character: " + s.character)
    def positive(self, shot):
        c = self.characters.get(shot.character or "")
        return ", ".join(x for x in [c.anchor() if c else "", shot.prompt, shot.camera, shot.lighting, "photorealistic, high detail, coherent composition, " + shot.aspect_ratio] if x)
    def negative(self, shot):
        c = self.characters.get(shot.character or "")
        extra = [x.strip() for x in shot.negative_prompt.split(",") if x.strip()]
        return ", ".join(dict.fromkeys((c.avoid if c else []) + extra))

class ComfyUI:
    """Minimal client for a local ComfyUI API-format workflow."""
    def __init__(self, base_url="http://127.0.0.1:8188", timeout=20):
        self.base_url, self.timeout = base_url.rstrip("/"), timeout
    def request(self, path, data=None):
        payload = None if data is None else json.dumps(data).encode()
        req = urllib.request.Request(self.base_url + path, data=payload, headers={"Content-Type":"application/json"} if payload is not None else {})
        try:
            with urllib.request.urlopen(req, timeout=self.timeout) as r:
                body = r.read()
                return json.loads(body) if body else {}
        except (urllib.error.URLError, TimeoutError, json.JSONDecodeError) as e:
            raise EngineError("ComfyUI request failed: " + str(e)) from e
    def health(self):
        self.request("/system_stats")
        return True
    def queue(self, workflow, client_id=None):
        r = self.request("/prompt", {"prompt":workflow, "client_id":client_id or str(uuid.uuid4())})
        if not r.get("prompt_id"): raise EngineError("ComfyUI returned no prompt_id: " + str(r))
        return r["prompt_id"]
    def wait(self, prompt_id, poll_seconds=2, timeout_seconds=1800):
        deadline = time.monotonic() + timeout_seconds
        while time.monotonic() < deadline:
            history = self.request("/history/" + prompt_id)
            item = history.get(prompt_id)
            if item and item.get("outputs"): return item
            time.sleep(max(0.2, poll_seconds))
        raise EngineError("ComfyUI job timed out: " + prompt_id)

def prepare_workflow(workflow, positive, negative, mapping):
    """Map explicit node IDs to positive/negative text inputs; never guess node IDs."""
    result = json.loads(json.dumps(workflow))
    for node_id, kind in mapping.items():
        if kind not in ("positive", "negative"): raise EngineError("Prompt mapping must be positive or negative.")
        node = result.get(str(node_id))
        if not isinstance(node, dict) or not isinstance(node.get("inputs"), dict) or "text" not in node["inputs"]:
            raise EngineError("Mapped node has no text input: " + str(node_id))
        node["inputs"]["text"] = positive if kind == "positive" else negative
    return result

def run(command, timeout=3600):
    try: subprocess.run(command, check=True, timeout=timeout)
    except FileNotFoundError as e: raise EngineError("Executable not found: " + command[0] + "; install FFmpeg and add it to PATH.") from e
    except subprocess.CalledProcessError as e: raise EngineError("Command failed with exit code " + str(e.returncode)) from e
    except subprocess.TimeoutExpired as e: raise EngineError("Command timed out: " + command[0]) from e

def join_clips(clips, output, width=1920, height=1080, fps=24, music=None):
    """Normalize clips, concatenate with FFmpeg, optionally mix looping background music."""
    if not clips: raise EngineError("At least one source clip is required.")
    if width < 16 or height < 16 or not 1 <= fps <= 120: raise EngineError("Invalid output dimensions or FPS.")
    sources = [Path(x).expanduser().resolve() for x in clips]
    missing = [str(x) for x in sources if not x.is_file()]
    if missing: raise EngineError("Missing clips: " + ", ".join(missing))
    target = Path(output).expanduser().resolve()
    target.parent.mkdir(parents=True, exist_ok=True)
    work = target.parent / (".cinema_work_" + uuid.uuid4().hex[:10])
    work.mkdir()
    try:
        normalized = []
        for i, src in enumerate(sources):
            dst = work / ("clip_%05d.mp4" % i)
            run(["ffmpeg","-hide_banner","-loglevel","error","-y","-i",str(src),
                "-vf","scale=%d:%d:force_original_aspect_ratio=decrease,pad=%d:%d:(ow-iw)/2:(oh-ih)/2,fps=%d,setsar=1,format=yuv420p" % (width,height,width,height,fps),
                "-af","aresample=48000:async=1:first_pts=0","-c:v","libx264","-preset","medium","-crf","18",
                "-c:a","aac","-b:a","192k","-ar","48000","-ac","2","-movflags","+faststart",str(dst)])
            normalized.append(dst)
        listing = work / "concat.txt"
        listing.write_text("".join("file '" + str(p).replace("'", "'\\''") + "'\n" for p in normalized), encoding="utf-8")
        joined = work / "joined.mp4"
        run(["ffmpeg","-hide_banner","-loglevel","error","-y","-f","concat","-safe","0","-i",str(listing),"-c","copy","-movflags","+faststart",str(joined)])
        if music:
            track = Path(music).expanduser().resolve()
            if not track.is_file(): raise EngineError("Music file not found: " + str(track))
            run(["ffmpeg","-hide_banner","-loglevel","error","-y","-i",str(joined),"-stream_loop","-1","-i",str(track),"-filter_complex","[0:a]volume=1.0[orig];[1:a]volume=0.18[music];[orig][music]amix=inputs=2:duration=first:dropout_transition=2[a]","-map","0:v:0","-map","[a]","-c:v","copy","-c:a","aac","-b:a","192k","-shortest","-movflags","+faststart",str(target)])
        else: shutil.copy2(joined, target)
        if not target.is_file() or not target.stat().st_size: raise EngineError("Output missing or empty.")
        return target
    finally: shutil.rmtree(work, ignore_errors=True)

def main():
    p = argparse.ArgumentParser(description="Local-first cinemaCRAFT engine")
    sub = p.add_subparsers(dest="cmd", required=True)
    for name in ("validate", "plan"):
        q = sub.add_parser(name); q.add_argument("manifest")
    q = sub.add_parser("join"); q.add_argument("--clips", nargs="+", required=True); q.add_argument("--output", required=True); q.add_argument("--width", type=int, default=1920); q.add_argument("--height", type=int, default=1080); q.add_argument("--fps", type=int, default=24); q.add_argument("--music")
    a = p.parse_args()
    try:
        if a.cmd in ("validate","plan"):
            project = Project.load(a.manifest)
            if a.cmd == "validate": print("VALID: %s (%d shots)" % (project.title, len(project.shots)))
            else:
                for s in project.shots: print(json.dumps({"shot_id":s.id,"positive_prompt":project.positive(s),"negative_prompt":project.negative(s),"duration_seconds":s.duration_seconds}, ensure_ascii=False))
        else: print(join_clips(a.clips,a.output,a.width,a.height,a.fps,a.music))
        return 0
    except (EngineError, KeyError, TypeError, ValueError, json.JSONDecodeError) as e: p.exit(2, "ERROR: " + str(e) + "\n")

if __name__ == "__main__": raise SystemExit(main())
