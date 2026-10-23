# cinemaCRAFT Local Cinema Engine

Local-first orchestration for reusable character descriptions, shot prompt generation, local ComfyUI workflows, and FFmpeg long-form video mastering.

## Free-cost boundary
The engine, ComfyUI, and FFmpeg are free software. Local generation avoids per-image API charges but uses disk space, electricity, and time. Freebuff MCP coordinates coding work; it is not itself an image/video inference service. Model weights have separate licenses; check them for your intended use.

## Hardware target
Known host: Ryzen 5 3400G, Radeon Vega integrated graphics, 12 GB RAM (about 9.9 GB usable). This is constrained for modern diffusion and video models. Start with low-resolution drafts, run one generation at a time, and upscale only approved images. Very large image/video models can exceed available memory or run impractically slowly. Do not make paid cloud APIs the default.

## Install and test
Install Python 3.11+ and FFmpeg including ffprobe, and add FFmpeg to PATH. Install ComfyUI separately and start it locally at http://127.0.0.1:8188. Select a model whose license fits the intended use. Run tests with: python -m unittest backend.tests.test_cinema_engine -v

## Manifest
Use examples/cinema-project.json as the starter manifest. Character profiles hold reusable identity descriptions and negative prompts. Shots hold prompt, duration, camera, lighting, aspect ratio and character key.

## CLI
Validate: python -m backend.cinema_engine validate examples/cinema-project.json
Print shot prompts: python -m backend.cinema_engine plan examples/cinema-project.json
Join clips: python -m backend.cinema_engine join --clips output/shot01.mp4 output/shot02.mp4 --output output/master.mp4 --width 1920 --height 1080 --fps 24
Join with background music: add --music assets/music.wav

## ComfyUI workflow integration
Export a workflow in API format. Replace node IDs 6 and 7 below with actual positive and negative text-node IDs from that workflow. Node IDs are workflow-specific and must never be guessed.

    from backend.cinema_engine import ComfyUI, Project, prepare_workflow
    import json
    project = Project.load("examples/cinema-project.json")
    shot = project.shots[0]
    workflow = json.load(open("workflow_api.json", encoding="utf-8"))
    workflow = prepare_workflow(workflow, project.positive(shot), project.negative(shot), {"6":"positive","7":"negative"})
    client = ComfyUI()
    prompt_id = client.queue(workflow)
    history = client.wait(prompt_id)
    print(history["outputs"])

## Pipeline
1. Define recurring characters and shot list in the manifest.
2. Validate the manifest before generation.
3. Compile shot-specific positive and negative prompts.
4. Submit a model-compatible API workflow to local ComfyUI.
5. Save each rendered shot and review identity/visual continuity.
6. Render short clips from approved shots using a compatible local video workflow or editor.
7. Normalize clips to common resolution, FPS, pixel format and audio profile.
8. Concatenate and optionally mix background music.
9. Inspect the final master before publishing.

## Known limitations
Text descriptions alone cannot guarantee identical faces between shots. Stronger identity continuity may require reference-image conditioning, identity adapters, or a properly licensed character LoRA. This initial mastering implementation uses straight cuts, not crossfades. Music mixing expects source clips to contain audio. It does not yet automate image-to-video generation or collect ComfyUI output files into the project directory; those are explicit next-stage integrations, not claimed completed features.
