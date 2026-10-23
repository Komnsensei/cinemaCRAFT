"""Google Cloud integration for CinemaForge - Imagen poster generation and Veo video generation."""

import os
import logging
from typing import Optional
from google import genai
from google.genai import types
import io
import base64

log = logging.getLogger("cinemaforge")

# Initialize Google GenAI client for Vertex AI
def get_gcloud_client():
    """Get or create a Google GenAI client for Vertex AI."""
    try:
        # Check if using Vertex AI (GCP project-based)
        if os.environ.get("GOOGLE_GENAI_USE_VERTEXAI") == "true":
            client = genai.Client(
                vertexai=True,
                project=os.environ.get("GOOGLE_CLOUD_PROJECT"),
                location=os.environ.get("GOOGLE_CLOUD_LOCATION", "us-central1"),
            )
        else:
            # Fall back to Gemini API with API key
            api_key = os.environ.get("GOOGLE_GENAI_API_KEY")
            if not api_key:
                raise ValueError("GOOGLE_GENAI_API_KEY not configured")
            client = genai.Client(api_key=api_key)
        return client
    except Exception as e:
        log.error(f"Failed to initialize Google Cloud client: {e}")
        raise


async def generate_poster(prompt: str, aspect_ratio: str = "9:16") -> Optional[str]:
    """
    Generate a movie poster using Google's Imagen model.
    
    Args:
        prompt: Text description of the poster
        aspect_ratio: Aspect ratio for the image (e.g., "9:16", "16:9", "1:1")
    
    Returns:
        Base64-encoded image data or None if generation fails
    """
    try:
        client = get_gcloud_client()
        
        # Use gemini-2.5-flash-image for poster generation
        response = client.models.generate_content(
            model="gemini-2.5-flash-image",
            contents=prompt,
            config=types.GenerateContentConfig(
                response_modalities=["IMAGE"],
                image_config=types.ImageConfig(
                    aspect_ratio=aspect_ratio,
                ),
            ),
        )
        
        # Extract the generated image
        for part in response.parts:
            if part.inline_data:
                image_data = part.inline_data.data
                # Return as base64-encoded string
                if isinstance(image_data, bytes):
                    return base64.b64encode(image_data).decode("utf-8")
                return image_data
        
        log.warning("No image data in response")
        return None
        
    except Exception as e:
        log.error(f"Poster generation failed: {e}")
        return None


def _generate_video_sync(prompt: str, duration_seconds: int) -> str:
    """Run Veo generation and download the result to backend/generated_videos."""
    import time
    import uuid
    from pathlib import Path

    output_dir = Path(__file__).resolve().parent / "generated_videos"
    output_dir.mkdir(parents=True, exist_ok=True)
    output_path = output_dir / f"{uuid.uuid4().hex}.mp4"
    client = get_gcloud_client()

    model = os.environ.get("VEO_MODEL", "veo-3.1-generate-preview")
    operation = client.models.generate_videos(
        model=model,
        prompt=prompt,
        config=types.GenerateVideosConfig(
            number_of_videos=1,
            duration_seconds=duration_seconds,
            aspect_ratio="16:9",
            enhance_prompt=True,
        ),
    )

    # Veo generation is an asynchronous provider operation. Bound polling so a
    # hung provider request cannot occupy a worker forever.
    deadline = time.monotonic() + int(os.environ.get("VEO_TIMEOUT_SECONDS", "600"))
    while not operation.done:
        if time.monotonic() >= deadline:
            raise TimeoutError("Veo generation timed out before the video was ready")
        time.sleep(10)
        operation = client.operations.get(operation)

    response = getattr(operation, "response", None)
    generated_videos = getattr(response, "generated_videos", None) if response else None
    if not generated_videos:
        raise RuntimeError("Veo completed without returning a generated video")

    try:
        client.files.download(file=generated_videos[0].video, destination=str(output_path))
        if not output_path.is_file() or output_path.stat().st_size == 0:
            raise RuntimeError("Veo returned an empty video file")
        return str(output_path)
    except Exception:
        output_path.unlink(missing_ok=True)
        raise


async def generate_video(prompt: str, duration_seconds: int = 6) -> Optional[str]:
    """
    Generate a Veo scene and return its local MP4 path.

    This function uses a worker thread for the blocking Google SDK calls so
    FastAPI's event loop remains responsive while Veo is generating.
    Supported single-clip durations are 6 or 8 seconds.
    """
    import asyncio

    clean_prompt = prompt.strip() if isinstance(prompt, str) else ""
    if not clean_prompt:
        raise ValueError("Video prompt must not be empty")
    if duration_seconds not in (6, 8):
        raise ValueError("Veo single-clip duration must be 6 or 8 seconds")

    try:
        return await asyncio.to_thread(_generate_video_sync, clean_prompt, duration_seconds)
    except Exception:
        log.exception("Video generation failed")
        raise


async def generate_scene_description(movie_prompt: str, scene_number: int) -> Optional[str]:
    """
    Use Gemini to generate detailed scene descriptions from a movie prompt.
    
    Args:
        movie_prompt: The original movie prompt/synopsis
        scene_number: Which scene to describe (1-indexed)
    
    Returns:
        Detailed scene description or None if generation fails
    """
    try:
        client = get_gcloud_client()
        
        scene_prompt = (
            f"You are a screenwriter for CinemaForge, an AI movie creation platform. "
            f"Given this movie concept: '{movie_prompt}'\n\n"
            f"Generate a detailed, cinematic description for Scene {scene_number} that would be used "
            f"to generate AI video. Include: setting, lighting, camera movement, character actions, "
            f"dialogue hints, and mood. Keep it under 150 words and make it vivid and specific."
        )
        
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=scene_prompt,
        )
        
        return response.text if response.text else None
        
    except Exception as e:
        log.error(f"Scene description generation failed: {e}")
        return None


async def enhance_movie_prompt(raw_prompt: str) -> Optional[str]:
    """
    Use Gemini to enhance and refine a raw movie prompt into a cinematic logline.
    
    Args:
        raw_prompt: User's raw movie idea
    
    Returns:
        Enhanced, cinematic prompt or None if generation fails
    """
    try:
        client = get_gcloud_client()
        
        enhance_prompt = (
            f"You are a creative director for CinemaForge, an AI movie creation platform. "
            f"Take this raw movie idea and transform it into a compelling, cinematic logline "
            f"suitable for AI video generation. Make it vivid, specific, and production-ready. "
            f"Keep it under 100 words.\n\n"
            f"Raw idea: {raw_prompt}"
        )
        
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=enhance_prompt,
        )
        
        return response.text if response.text else None
        
    except Exception as e:
        log.error(f"Prompt enhancement failed: {e}")
        return None
