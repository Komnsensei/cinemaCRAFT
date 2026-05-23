# Google Cloud Integration Guide for CinemaForge

## Overview

CinemaForge now integrates with **Google Cloud APIs** to power advanced AI features:

1. **Poster Generation** - Generate movie posters using Google's Imagen model
2. **Video Generation** - Generate movie scenes/trailers using Google's Veo model (preview)
3. **Enhanced Chat** - FORGE AI director assistant powered by Google Gemini
4. **Prompt Enhancement** - Refine raw movie ideas into cinematic loglines
5. **Scene Descriptions** - Generate detailed scene breakdowns for video production

## Setup Instructions

### Prerequisites

- Google Cloud Account with billing enabled
- Google Cloud Project created
- Python 3.11+

### Option 1: Using Gemini API (Recommended for Development)

1. **Get API Key**
   - Go to [Google AI Studio](https://aistudio.google.com/apikey)
   - Create a new API key
   - Copy the key

2. **Configure Environment**
   ```bash
   export GOOGLE_GENAI_API_KEY="your-api-key-here"
   export GOOGLE_GENAI_USE_VERTEXAI=false
   ```

3. **Update .env file**
   ```
   GOOGLE_GENAI_API_KEY=your-api-key-here
   GOOGLE_GENAI_USE_VERTEXAI=false
   ```

### Option 2: Using Vertex AI (Recommended for Production)

1. **Enable Vertex AI API**
   - Go to [Google Cloud Console](https://console.cloud.google.com)
   - Search for "Vertex AI API"
   - Click "Enable"

2. **Set up Application Default Credentials**
   ```bash
   gcloud auth application-default login
   ```

3. **Configure Environment**
   ```bash
   export GOOGLE_GENAI_USE_VERTEXAI=true
   export GOOGLE_CLOUD_PROJECT="your-project-id"
   export GOOGLE_CLOUD_LOCATION="us-central1"
   ```

4. **Update .env file**
   ```
   GOOGLE_GENAI_USE_VERTEXAI=true
   GOOGLE_CLOUD_PROJECT=your-project-id
   GOOGLE_CLOUD_LOCATION=us-central1
   ```

## API Endpoints

### Poster Generation

**Endpoint:** `POST /api/generate/poster`

**Authentication:** Required (user must be movie creator)

**Request Body:**
```json
{
  "movie_id": "uuid-of-movie",
  "prompt": "A neon-lit cyberpunk detective in rain-soaked Tokyo 2099, dramatic lighting",
  "aspect_ratio": "9:16"
}
```

**Supported Aspect Ratios:**
- `1:1` - Square
- `3:2` - Landscape
- `2:3` - Portrait
- `9:16` - Tall portrait
- `16:9` - Wide landscape

**Response:**
```json
{
  "ok": true,
  "poster_id": "uuid-of-poster",
  "message": "Poster generated successfully"
}
```

**Error Responses:**
- `503` - Google Cloud not configured
- `404` - Movie not found
- `403` - User is not the movie creator
- `500` - Generation failed

### Retrieve Poster

**Endpoint:** `GET /api/posters/{poster_id}`

**Response:**
```json
{
  "id": "poster-id",
  "movie_id": "movie-id",
  "creator_id": "user-id",
  "image_data": "base64-encoded-image-data",
  "aspect_ratio": "9:16",
  "created_at": "2026-05-22T10:30:00Z"
}
```

### Video Generation

**Endpoint:** `POST /api/generate/video`

**Authentication:** Required (user must be movie creator)

**Request Body:**
```json
{
  "movie_id": "uuid-of-movie",
  "prompt": "A detective walks through neon-lit streets, camera pans across holographic signs",
  "duration_seconds": 6
}
```

**Duration Limits:**
- Minimum: 6 seconds
- Maximum: 60 seconds

**Response:**
```json
{
  "ok": true,
  "video_url": "https://...",
  "message": "Video generated successfully"
}
```

**Note:** Veo video generation is currently in preview. This endpoint will return `503` until the feature is fully available.

### Prompt Enhancement

**Endpoint:** `POST /api/generate/enhance-prompt`

**Authentication:** Not required

**Request Body:**
```json
{
  "raw_prompt": "A detective hunts memory thieves in Tokyo"
}
```

**Response:**
```json
{
  "ok": true,
  "enhanced_prompt": "A jaded detective hunts memory-thieves in rain-soaked Tokyo 2099, neon signs reflecting off wet streets, cyberpunk noir atmosphere..."
}
```

### Scene Description

**Endpoint:** `POST /api/generate/scene-description`

**Authentication:** Not required

**Query Parameters:**
- `movie_id` (required) - UUID of the movie
- `scene_number` (optional, default: 1) - Which scene to describe

**Response:**
```json
{
  "ok": true,
  "scene_number": 1,
  "description": "INT. NEON DISTRICT - NIGHT. A rain-soaked street glistens with holographic advertisements. Our detective walks through the crowd, collar up, eyes scanning. Camera follows from behind, weaving through pedestrians. Ambient synth music plays softly..."
}
```

### FORGE Chat

**Endpoint:** `POST /ai/chat`

**Authentication:** Optional (for user context)

**Request Body:**
```json
{
  "message": "Help me refine this idea: A time-loop heist where one thief sabotages the others",
  "session_id": "optional-session-id"
}
```

**Response:**
```json
{
  "session_id": "session-uuid",
  "reply": "That's a killer concept! Here's how I'd develop it:\n\n**Core Conflict:**\n- Five thieves, 47-minute loop\n- One saboteur creates tension\n- Each loop reveals new betrayals\n\n**Genre:** Thriller/Sci-Fi\n**Suggested Tone:** Tense, paranoid, darkly comedic\n\n**Cast Suggestions:**\n- Elena Vasquez (sharp, brooding)\n- Marcus Holt (dangerous, charismatic)\n- Yuki Mori (precise, ethereal)\n\nWant me to outline the three-act structure?"
}
```

### AI Suggestions

**Endpoint:** `POST /api/ai/suggestions`

**Authentication:** Optional

**Query Parameters:**
- `suggestion_type` (required) - Type of suggestion
- `context` (required) - Context data as JSON

**Supported Suggestion Types:**

1. **prompt_refinement**
   ```json
   {
     "suggestion_type": "prompt_refinement",
     "context": {
       "raw_prompt": "A detective hunts memory thieves"
     }
   }
   ```

2. **actor_suggestion**
   ```json
   {
     "suggestion_type": "actor_suggestion",
     "context": {
       "genre": "Sci-Fi",
       "tone": "dark, atmospheric",
       "available_actors": ["Elena Vasquez", "Marcus Holt", "Yuki Mori"]
     }
   }
   ```

3. **genre_suggestion**
   ```json
   {
     "suggestion_type": "genre_suggestion",
     "context": {
       "concept": "A time-loop heist with betrayal"
     }
   }
   ```

4. **scene_breakdown**
   ```json
   {
     "suggestion_type": "scene_breakdown",
     "context": {
       "concept": "A detective hunts memory thieves in Tokyo",
       "length": "trailer"
     }
   }
   ```

5. **troubleshooting**
   ```json
   {
     "suggestion_type": "troubleshooting",
     "context": {
       "issue": "My video generation keeps timing out"
     }
   }
   ```

**Response:**
```json
{
  "ok": true,
  "suggestion_type": "prompt_refinement",
  "suggestion": "A jaded detective hunts memory-thieves in rain-soaked Tokyo 2099..."
}
```

## Models Used

### Image Generation
- **Model:** `gemini-2.5-flash-image`
- **Capabilities:** Text-to-image generation with aspect ratio control
- **Max Images:** 10 per request
- **Watermark:** Digital watermark automatically added

### Video Generation
- **Model:** `Veo` (Google's video generation model)
- **Status:** Preview/Limited availability
- **Duration:** 6-60 seconds
- **Note:** Integration ready, awaiting full API availability

### Chat & Text Generation
- **Model:** `gemini-2.5-flash`
- **Capabilities:** Multi-turn conversation, text generation, suggestions
- **Context Window:** 10 previous messages retained
- **Temperature:** 0.8 (balanced creativity)

## Implementation Details

### New Backend Modules

1. **gcloud_integration.py**
   - `get_gcloud_client()` - Initialize Google GenAI client
   - `generate_poster()` - Generate movie posters
   - `generate_video()` - Generate video scenes
   - `generate_scene_description()` - Create detailed scene descriptions
   - `enhance_movie_prompt()` - Refine raw prompts

2. **llm_brain.py**
   - `get_gemini_client()` - Initialize Gemini client
   - `chat_with_forge()` - Multi-turn conversation with FORGE
   - `get_forge_suggestion()` - Get specific suggestions
   - `FORGE_SYSTEM_PROMPT` - Enhanced system prompt for AI director

### Database Collections

New collections created automatically:
- `posters` - Stores generated poster metadata and base64 image data
- `chat_messages` - Stores conversation history (already existed, enhanced)

### Fallback Behavior

If Google Cloud is not configured:
- Chat falls back to Emergent LLM (Claude Sonnet)
- Poster/video generation returns 503 error
- Prompt enhancement returns 503 error

## Error Handling

All endpoints include comprehensive error handling:

| Status | Meaning | Solution |
|--------|---------|----------|
| 400 | Bad request | Check request body format |
| 403 | Forbidden | Verify you're the movie creator |
| 404 | Not found | Check movie/poster ID exists |
| 500 | Server error | Check logs, retry later |
| 503 | Service unavailable | Configure Google Cloud credentials |

## Performance Considerations

- **Poster Generation:** ~5-15 seconds per image
- **Video Generation:** ~30-120 seconds per video (when available)
- **Chat Response:** ~2-5 seconds per message
- **Scene Description:** ~3-8 seconds per scene

## Security Notes

1. **API Keys:** Never commit `.env` files with real keys
2. **Base64 Images:** Posters stored as base64 in database; consider S3 migration for production
3. **User Context:** Chat includes user movie count for personalization
4. **Rate Limiting:** Implement rate limiting in production
5. **Authentication:** All generation endpoints require user authentication

## Future Enhancements

1. **Veo Integration:** Full video generation when API becomes available
2. **S3 Storage:** Move poster images to Google Cloud Storage
3. **Batch Processing:** Queue system for large-scale generation
4. **Caching:** Cache generated posters and descriptions
5. **Advanced Prompting:** Few-shot examples for better results
6. **Multi-language:** Support for non-English prompts

## Troubleshooting

### "Google Cloud not configured" Error

**Solution:** Ensure environment variables are set:
```bash
# For Gemini API
export GOOGLE_GENAI_API_KEY="your-key"

# For Vertex AI
export GOOGLE_GENAI_USE_VERTEXAI=true
export GOOGLE_CLOUD_PROJECT="your-project"
export GOOGLE_CLOUD_LOCATION="us-central1"
```

### "Failed to generate poster" Error

**Possible Causes:**
- API quota exceeded
- Invalid prompt
- Network connectivity issue

**Solution:** Check Google Cloud Console for quota usage

### Chat Not Using Gemini

**Possible Causes:**
- Google Cloud not configured
- Emergent LLM key is set (takes precedence)

**Solution:** Set Google Cloud credentials or remove Emergent key

## Testing

Run the backend tests:
```bash
cd backend
pytest tests/
```

Test individual endpoints:
```bash
# Test poster generation
curl -X POST http://localhost:8000/api/generate/poster \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "movie_id": "test-movie-id",
    "prompt": "A cyberpunk detective",
    "aspect_ratio": "9:16"
  }'

# Test prompt enhancement
curl -X POST http://localhost:8000/api/generate/enhance-prompt \
  -H "Content-Type: application/json" \
  -d '{
    "raw_prompt": "A detective hunts thieves"
  }'

# Test FORGE chat
curl -X POST http://localhost:8000/api/ai/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Help me develop my movie idea"
  }'
```

## Support

For issues or questions:
1. Check the troubleshooting section above
2. Review Google Cloud documentation
3. Check CinemaForge GitHub issues
4. Contact the development team

---

**Last Updated:** May 22, 2026
**Integration Version:** 1.0
**Status:** Production Ready (Veo in Preview)
