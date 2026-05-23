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


async def generate_video(prompt: str, duration_seconds: int = 6) -> Optional[str]:
    """
    Generate a movie trailer/scene using Google's Veo model.
    
    Note: Veo video generation is currently in preview. This is a placeholder
    for when the API becomes fully available.
    
    Args:
        prompt: Text description of the video scene
        duration_seconds: Duration of the video (typically 6-60 seconds)
    
    Returns:
        URL to the generated video or None if generation fails
    """
    try:
        # Veo video generation is still in limited preview
        # This is a placeholder for future implementation
        log.warning("Veo video generation not yet fully available in this SDK version")
        return None
        
    except Exception as e:
        log.error(f"Video generation failed: {e}")
        return None


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
