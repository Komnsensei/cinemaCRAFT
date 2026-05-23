# Quick Start: Google Cloud Setup for CinemaForge

## TL;DR - 5 Minute Setup

Your project: **passioncraft** (69709585370)

### Step 1: Enable APIs (2 minutes)

Go to: https://console.cloud.google.com/

Search for and **ENABLE** these APIs:
1. "Vertex AI API" → Enable
2. "Generative Language API" → Enable  
3. "Cloud Resource Manager API" → Enable
4. "Service Usage API" → Enable

### Step 2: Create Service Account (2 minutes)

1. Go to: https://console.cloud.google.com/iam-admin/serviceaccounts
2. Click **"Create Service Account"**
3. Name: `cinemaforge-app`
4. Click **"Create and Continue"** → **"Continue"** → **"Done"**

### Step 3: Create & Download Key (1 minute)

1. Click on `cinemaforge-app` service account
2. Click **"Keys"** tab
3. Click **"Add Key"** → **"Create new key"**
4. Choose **"JSON"**
5. Click **"Create"** (file downloads automatically)
6. Save it as `gcloud-key.json` in `cinemaCRAFT/backend/`

### Step 4: Grant Permissions (1 minute)

1. Go to: https://console.cloud.google.com/iam-admin/iam
2. Click **"Grant Access"**
3. Paste: `cinemaforge-app@passioncraft.iam.gserviceaccount.com`
4. Select role: **"Vertex AI User"** → **"Save"**
5. Repeat and add: **"Generative AI User"** → **"Save"**

### Step 5: Configure Backend (1 minute)

Create `cinemaCRAFT/backend/.env`:

```env
MONGO_URL=mongodb://localhost:27017
DB_NAME=cinemaforge
JWT_SECRET=your-secret-key-here

GOOGLE_GENAI_USE_VERTEXAI=true
GOOGLE_CLOUD_PROJECT=passioncraft
GOOGLE_CLOUD_LOCATION=us-central1
GOOGLE_APPLICATION_CREDENTIALS=/full/path/to/backend/gcloud-key.json

CORS_ORIGINS=http://localhost:3000,http://localhost:3001
HOST=0.0.0.0
PORT=8000
```

### Step 6: Install & Test

```bash
cd cinemaCRAFT/backend

# Install dependencies
pip install -r requirements.txt

# Test setup
python test_gcloud.py

# Start backend
python server.py
```

---

## What You Get

✅ **Poster Generation** - Generate movie posters with AI
✅ **Chat with FORGE** - AI director assistant  
✅ **Prompt Enhancement** - Refine movie ideas
✅ **Scene Descriptions** - Generate detailed scenes
✅ **Video Generation** - Ready when Veo API available

---

## Test It

### Generate a Poster

```bash
# First create a movie
curl -X POST http://localhost:8000/api/movies \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test",
    "prompt": "A cyberpunk detective",
    "genre": "Sci-Fi",
    "length": "trailer",
    "format": "movie"
  }'

# Copy the movie ID, then generate poster
curl -X POST http://localhost:8000/api/generate/poster \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "movie_id": "PASTE_ID_HERE",
    "prompt": "Neon Tokyo detective",
    "aspect_ratio": "9:16"
  }'
```

### Chat with FORGE

```bash
curl -X POST http://localhost:8000/api/ai/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Help me develop a sci-fi movie about time travelers"
  }'
```

---

## Troubleshooting

| Error | Solution |
|-------|----------|
| "Google Cloud not configured" | Check `.env` file, make sure `GOOGLE_APPLICATION_CREDENTIALS` path is correct |
| "Permission denied" | Re-download service account key, make sure roles are granted |
| "API not enabled" | Go to console.cloud.google.com and enable the APIs |
| "No image generated" | Check quota at console.cloud.google.com/iam-admin/quotas |

---

## Cost

With your **$1700 free credit**:
- Poster generation: ~$0.04 per image
- Chat: ~$0.00001 per message
- Video generation: ~$0.04 per second

**Estimated monthly cost: ~$44** (you'll have credit for 38+ months!)

---

## Next Steps

1. ✅ Complete the 5-minute setup above
2. ✅ Run `python test_gcloud.py` to verify
3. ✅ Start backend: `python server.py`
4. ✅ Test endpoints
5. ✅ Integrate with frontend
6. ✅ Deploy to production

---

## Full Documentation

For detailed setup, troubleshooting, and advanced configuration, see:
- `SETUP_GCLOUD.md` - Complete step-by-step guide
- `GCLOUD_INTEGRATION.md` - API reference and features
- `backend/test_gcloud.py` - Automated test script

---

**Need help?** Check the troubleshooting section or review the full guides above.
