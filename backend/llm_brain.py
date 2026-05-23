"""Enhanced LLM brain for CinemaForge support chat using Google Gemini."""

import os
import logging
from typing import Optional, List
from google import genai
from google.genai import types

log = logging.getLogger("cinemaforge")

# System prompt for FORGE - the AI director assistant
FORGE_SYSTEM_PROMPT = """You are FORGE, the in-app AI director assistant for CinemaForge — a Netflix-style platform where users create their own AI movies.

Your role is to help creators at every step:
1. **Prompt Refinement**: Transform raw ideas into cinematic loglines with specific visual language
2. **Cast Selection**: Suggest actors from the pool based on genre, tone, and character needs
3. **Story Structure**: Outline trailers (2min), shorts (25min), episodes (45min), or features (90min)
4. **Genre & Tone**: Recommend genres and suggest atmospheric/thematic elements
5. **Troubleshooting**: Debug broken chains in the creation flow and suggest fixes
6. **Technical Help**: Explain features, guide through the UI, answer questions about the platform

**Tone & Style**:
- Be concise, cinematic, and concrete
- Use bullet points and short scene beats when useful
- Lean into the dark crimson-violet aesthetic of the app
- Be encouraging and creative, not robotic
- Reference the platform's unique features (Evolutions, Forks, Marketplace)

**Key Features to Know**:
- Users can fork other creators' work and evolve it
- Marketplace for trading character and world licenses
- Leaderboards track most-watched, highest-rated, most-clicked creations
- Multi-file viewer supports video, audio, images, text, hex
- Tip system lets viewers support creators

**When Users Ask About**:
- **Video/Poster Generation**: Explain that they can generate posters via Google Imagen and videos via Veo (when available)
- **Prompt Enhancement**: Offer to help refine their raw idea into a production-ready prompt
- **Scene Descriptions**: Suggest detailed scene breakdowns for better video generation
- **Licensing**: Explain character/world licenses and how to monetize their creations
- **Evolutions**: Encourage remixing and forking existing work with credit

Always be helpful, creative, and stay in character as FORGE."""


def get_gemini_client():
    """Get or create a Google Gemini client."""
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
        log.error(f"Failed to initialize Gemini client: {e}")
        raise


async def chat_with_forge(
    message: str,
    session_history: Optional[List[dict]] = None,
    user_context: Optional[dict] = None,
) -> str:
    """
    Chat with FORGE using Google Gemini as the brain.
    
    Args:
        message: User's message
        session_history: Previous messages in the conversation (list of {"role": "user|assistant", "text": "..."})
        user_context: Optional user context (e.g., {"username": "...", "created_movies": 5})
    
    Returns:
        FORGE's response
    """
    try:
        client = get_gemini_client()
        
        # Build conversation history for context
        contents = []
        
        if session_history:
            for msg in session_history:
                role = "user" if msg.get("role") == "user" else "model"
                contents.append(
                    types.Content(
                        role=role,
                        parts=[types.Part.from_text(text=msg.get("text", ""))]
                    )
                )
        
        # Add current message
        contents.append(
            types.Content(
                role="user",
                parts=[types.Part.from_text(text=message)]
            )
        )
        
        # Build context string if user info provided
        context_str = ""
        if user_context:
            context_str = f"\n[User Context: {user_context.get('username', 'Creator')} has created {user_context.get('created_movies', 0)} movies]"
        
        # Generate response using Gemini
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=contents,
            config=types.GenerateContentConfig(
                system_instruction=FORGE_SYSTEM_PROMPT + context_str,
                temperature=0.8,  # Slightly creative but grounded
                top_p=0.95,
                top_k=40,
                max_output_tokens=1024,
            ),
        )
        
        return response.text if response.text else "I'm having trouble forming a response. Try again?"
        
    except Exception as e:
        log.error(f"Gemini chat failed: {e}")
        raise


async def get_forge_suggestion(
    context_type: str,
    context_data: dict,
) -> Optional[str]:
    """
    Get a specific suggestion from FORGE based on context.
    
    Args:
        context_type: Type of suggestion ("prompt_refinement", "actor_suggestion", "genre_suggestion", etc.)
        context_data: Data relevant to the suggestion
    
    Returns:
        Suggestion text or None if generation fails
    """
    try:
        client = get_gemini_client()
        
        prompts = {
            "prompt_refinement": (
                f"Refine this raw movie idea into a cinematic logline (under 100 words) "
                f"suitable for AI video generation:\n\n{context_data.get('raw_prompt', '')}"
            ),
            "actor_suggestion": (
                f"Suggest 2-3 actors from this pool that would work well for this genre and tone:\n"
                f"Genre: {context_data.get('genre', 'Sci-Fi')}\n"
                f"Tone: {context_data.get('tone', 'dark, atmospheric')}\n"
                f"Actor Pool: {', '.join(context_data.get('available_actors', []))}"
            ),
            "genre_suggestion": (
                f"Suggest 2-3 genres that would work well for this concept:\n\n{context_data.get('concept', '')}"
            ),
            "scene_breakdown": (
                f"Break down this movie concept into 3-4 key scenes for a {context_data.get('length', 'trailer')}:\n\n"
                f"{context_data.get('concept', '')}"
            ),
            "troubleshooting": (
                f"Help troubleshoot this issue in CinemaForge:\n\n{context_data.get('issue', '')}"
            ),
        }
        
        prompt = prompts.get(context_type, "")
        if not prompt:
            return None
        
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents=prompt,
            config=types.GenerateContentConfig(
                system_instruction=FORGE_SYSTEM_PROMPT,
                temperature=0.7,
                max_output_tokens=512,
            ),
        )
        
        return response.text if response.text else None
        
    except Exception as e:
        log.error(f"Forge suggestion failed: {e}")
        return None
