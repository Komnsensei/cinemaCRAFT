# Freebuff MCP execution brief: finish the cinemaCRAFT engine

You are the implementation agent operating through Freebuff MCP. Work in this repository, inspect the existing application before editing, and continue on branch feat/local-cinema-engine. Preserve existing cinemaCRAFT features. Do not replace the application with a new scaffold.

## Objective
Finish a local-first, zero-required-spend pipeline that takes a project manifest and character references, generates high-quality stills, turns approved stills into short video clips through a compatible local workflow, and assembles those clips into a long-form master.

## Non-negotiable constraints
- No paid API as a required dependency. Optional paid providers may exist only behind explicit opt-in adapters.
- Freebuff MCP is the coding-agent bridge, not the image/video inference engine.
- Use local ComfyUI API workflows as the initial inference backend; never assume workflow node IDs or model types.
- Use FFmpeg/ffprobe for media operations.
- Respect the actual host profile: Ryzen 5 3400G, integrated Radeon Vega, 12 GB RAM / about 9.9 GB usable. Queue one heavy job at a time, provide low-memory settings, fail early when prerequisites are absent, and never claim this hardware can efficiently run every modern model.
- Do not download model weights automatically without explicit user action. Check model licenses and record the selected model/workflow in provenance.
- Do not commit generated media, model weights, secrets, API keys, or user reference images.
- Never claim that text prompts alone guarantee exact identity. Build explicit reference-image conditioning hooks and expose identity consistency as a reviewable quality check.

## Required implementation stages

### Stage A — inspect and preserve
1. Read the entire current cinemaCRAFT backend/frontend structure, requirements, existing image/video paths, and tests.
2. Review CINEMA_ENGINE.md and backend/cinema_engine.py. Reuse existing services where appropriate; avoid duplicate abstractions.
3. Run existing tests before editing and record the baseline. Create a concise plan with files, interfaces, risks, and test commands.

### Stage B — complete image generation
1. Add a backend adapter that accepts a ComfyUI API-format workflow, positive/negative prompt node mapping, dimensions, seed, output count, optional reference image, and timeout.
2. Validate the workflow before queueing. Node IDs and input names must be explicit configuration, never guessed.
3. Poll job history, enumerate output image metadata, download image outputs through ComfyUI's view endpoint, and store them under a deterministic project/shot path.
4. Write a provenance JSON beside every output: project ID, shot ID, seed, model/checkpoint identifier if discoverable, workflow hash, prompt, negative prompt, dimensions, generation timestamp, and source reference hashes.
5. Add cancellation/timeout handling, bounded retries, queue serialization for low-memory machines, and clear errors for disconnected ComfyUI or missing models.
6. Add image inspection and upscaling as optional stages, not hidden mandatory costs. Keep source and upscaled images distinct.

### Stage C — character continuity and visual QA
1. Add reference assets and a character bible with stable descriptions, clothing, age range, facial traits, and scene-specific permitted changes.
2. Support reference conditioning only when the selected workflow actually contains the required nodes.
3. Add a review report for each shot with prompt/profile provenance and dimensions. Do not invent a numeric identity score unless it is computed by a documented, tested method.
4. Build a contact sheet for review using local tools if available; make no remote upload by default.

### Stage D — short-video production
1. Implement a video-generation adapter for a user-selected local ComfyUI video workflow. Keep it separate from still-image generation because model input contracts differ.
2. Pass approved still/reference assets, shot duration, FPS, aspect ratio and motion prompt through explicit workflow mappings.
3. Harvest generated video outputs and provenance. Provide a no-video-model fallback that turns approved stills into simple Ken Burns/pan/zoom clips with FFmpeg, so the whole pipeline can be exercised without a video diffusion model.
4. Respect available RAM/VRAM and process shots sequentially by default.

### Stage E — long-form editing/mastering
1. Read ordered clips from the manifest; normalize resolution, FPS, sample aspect ratio, pixel format, codec and audio layout.
2. Implement safe straight-cut concatenation first. Add crossfades only with explicit duration math and tests; do not silently ignore transition settings.
3. Support optional narration/music, volume controls, subtitle files, intro/outro and output presets for 16:9 landscape and 9:16 vertical.
4. Handle silent clips correctly, avoid assuming every clip has audio, and avoid audio stream mapping failures.
5. Produce final MP4, ffprobe validation report, duration and stream summary, and a render manifest. Keep temporary files cleaned on both success and failure.

### Stage F — usable workflow
Expose a simple user journey in the existing cinemaCRAFT UI or CLI:
1. Create project.
2. Define/import character profile and references.
3. Draft shot list.
4. Preview/edit prompts and workflow selection.
5. Generate stills.
6. Review/approve stills.
7. Generate short clips or create FFmpeg motion clips.
8. Arrange clips, audio and transitions.
9. Render and validate final master.

Keep the UI responsive with progress, cancellation, retry, and actionable errors. Do not build an elaborate UI before the backend path works end-to-end.

## Verification gate
- Run the full existing test suite and the new engine tests.
- Add tests for ComfyUI API success/failure, timeouts, workflow validation, output downloads, provenance, path safety, silent clips, mismatched input formats, audio mixing, cleanup after failures, and both landscape/vertical presets.
- Include an end-to-end offline test using generated synthetic clips or fixtures; it must not require model downloads, API keys, or internet access.
- Run static syntax/type/lint checks already used by the repo.
- Report exact commands and outcomes. Clearly separate tests actually run from tests merely added.
- Inspect git diff for unrelated changes, secrets, generated files and license problems.
- Do not merge the PR or push to main. Finish with a summary, changed-file list, test evidence, limitations, and any required user action.

## Definition of done
A new user can run the documented local setup, validate a manifest, produce still images through their configured local ComfyUI workflow, turn selected stills into clips, assemble a long-form video, and validate the output without a paid API or a model-specific assumption hidden in code. If the local machine cannot run the chosen model, the system must fail clearly or use the FFmpeg still-to-motion fallback rather than pretending generation succeeded.
