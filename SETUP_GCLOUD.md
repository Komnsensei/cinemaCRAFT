# Google Cloud Setup for CinemaForge

## Your Project Details
- **Project Name:** passioncraft
- **Project ID:** 69709585370
- **Free Credits:** $1700

## What We're Setting Up

1. ✅ Vertex AI API (for Imagen poster generation)
2. ✅ Generative AI API (for Gemini chat)
3. ✅ Service Account with credentials
4. ✅ Environment configuration for your app

---

## STEP 1: Enable APIs in Google Cloud Console

Go to: https://console.cloud.google.com/

1. Make sure you're in project **passioncraft**
2. Click the search bar at the top
3. Search for and **ENABLE** these APIs (click each link):

### Required APIs to Enable:

**A. Vertex AI API**
- Search: "Vertex AI API"
- Click "Enable"
- Wait for it to finish (1-2 minutes)

**B. Generative Language API**
- Search: "Generative Language API" 
- Click "Enable"
- Wait for it to finish

**C. Cloud Resource Manager API**
- Search: "Cloud Resource Manager API"
- Click "Enable"

**D. Service Usage API**
- Search: "Service Usage API"
- Click "Enable"

---

## STEP 2: Create a Service Account

This gives your app permission to use Google Cloud APIs.

1. Go to: https://console.cloud.google.com/iam-admin/serviceaccounts
2. Make sure you're in project **passioncraft**
3. Click **"Create Service Account"** at the top
4. Fill in:
   - **Service account name:** `cinemaforge-app`
   - **Service account ID:** (auto-fills)
   - **Description:** "CinemaForge backend service"
5. Click **"Create and Continue"**
6. On the next page, click **"Continue"** (skip the optional steps)
7. Click **"Done"**

---

## STEP 3: Create and Download Service Account Key

1. Go back to: https://console.cloud.google.com/iam-admin/serviceaccounts
2. Click on the service account you just created: **cinemaforge-app**
3. Click the **"Keys"** tab
4. Click **"Add Key"** → **"Create new key"**
5. Choose **"JSON"** format
6. Click **"Create"**
7. A JSON file will download automatically
   - **Save this file somewhere safe** - you'll need it!
   - Rename it to: `gcloud-key.json`

---

## STEP 4: Grant Permissions to Service Account

1. Go to: https://console.cloud.google.com/iam-admin/iam
2. Make sure you're in project **passioncraft**
3. Click **"Grant Access"** button
4. In the "New principals" field, paste: `cinemaforge-app@passioncraft.iam.gserviceaccount.com`
5. Click the "Role" dropdown and select:
   - **"Vertex AI User"**
6. Click **"Save"**
7. Repeat steps 3-6 and add another role:
   - **"Generative AI User"**

---

## STEP 5: Configure Your App

### Option A: Using Service Account (Recommended for Production)

1. **Place the JSON key file in your backend directory:**
   ```bash
   cp gcloud-key.json /path/to/cinemaCRAFT/backend/
   ```

2. **Update your `.env` file:**
   ```
   GOOGLE_GENAI_USE_VERTEXAI=true
   GOOGLE_CLOUD_PROJECT=passioncraft
   GOOGLE_CLOUD_LOCATION=us-central1
   GOOGLE_APPLICATION_CREDENTIALS=/path/to/backend/gcloud-key.json
   ```

3. **In your backend, the code will automatically use the service account**

### Option B: Using gcloud CLI (For Development)

If you have `gcloud` CLI installed:

```bash
# Authenticate with your Google account
gcloud auth application-default login

# Set the project
gcloud config set project passioncraft

# Your app will automatically use these credentials
```

Then update `.env`:
```
GOOGLE_GENAI_USE_VERTEXAI=true
GOOGLE_CLOUD_PROJECT=passioncraft
GOOGLE_CLOUD_LOCATION=us-central1
```

---

## STEP 6: Test the Setup

### Test 1: Check if APIs are enabled
```bash
gcloud services list --enabled --project=passioncraft
```

You should see:
- `aiplatform.googleapis.com`
- `generativelanguage.googleapis.com`

### Test 2: Test Poster Generation

Run this Python script:

```python
import os
os.environ['GOOGLE_CLOUD_PROJECT'] = 'passioncraft'
os.environ['GOOGLE_CLOUD_LOCATION'] = 'us-central1'
os.environ['GOOGLE_APPLICATION_CREDENTIALS'] = '/path/to/gcloud-key.json'

from google import genai
from google.genai import types

client = genai.Client(
    vertexai=True,
    project='passioncraft',
    location='us-central1'
)

response = client.models.generate_content(
    model="gemini-2.5-flash-image",
    contents="A neon cyberpunk detective in Tokyo",
    config=types.GenerateContentConfig(
        response_modalities=["IMAGE"],
        image_config=types.ImageConfig(aspect_ratio="9:16"),
    ),
)

print("✓ Image generation works!")
for part in response.parts:
    if part.inline_data:
        print(f"✓ Generated image: {len(part.inline_data.data)} bytes")
```

### Test 3: Test Chat

```python
import os
os.environ['GOOGLE_CLOUD_PROJECT'] = 'passioncraft'
os.environ['GOOGLE_CLOUD_LOCATION'] = 'us-central1'
os.environ['GOOGLE_APPLICATION_CREDENTIALS'] = '/path/to/gcloud-key.json'

from google import genai

client = genai.Client(
    vertexai=True,
    project='passioncraft',
    location='us-central1'
)

response = client.models.generate_content(
    model="gemini-2.5-flash",
    contents="Help me develop a sci-fi movie about time travelers",
)

print("✓ Chat works!")
print(response.text)
```

---

## STEP 7: Update Backend Environment

Create/update `.env` in `cinemaCRAFT/backend/`:

```bash
# MongoDB Configuration
MONGO_URL=mongodb://localhost:27017
DB_NAME=cinemaforge

# JWT Secret
JWT_SECRET=your-secret-key-here

# Emergent Integrations (optional fallback)
EMERGENT_LLM_KEY=your-emergent-key-here
STRIPE_API_KEY=sk_test_your_stripe_key_here

# Google Cloud Configuration (YOUR SETUP)
GOOGLE_GENAI_USE_VERTEXAI=true
GOOGLE_CLOUD_PROJECT=passioncraft
GOOGLE_CLOUD_LOCATION=us-central1
GOOGLE_APPLICATION_CREDENTIALS=/path/to/backend/gcloud-key.json

# CORS Configuration
CORS_ORIGINS=http://localhost:3000,http://localhost:3001

# Server Configuration
HOST=0.0.0.0
PORT=8000
```

---

## STEP 8: Install Dependencies

```bash
cd cinemaCRAFT/backend
pip install -r requirements.txt
```

This will install:
- `google-genai>=2.6.0`
- `google-cloud-aiplatform>=1.150.0`

---

## STEP 9: Start Your Backend

```bash
cd cinemaCRAFT/backend
python server.py
```

You should see:
```
INFO:     Uvicorn running on http://0.0.0.0:8000
```

---

## STEP 10: Test the Endpoints

### Test Poster Generation

```bash
# First, create a movie (or use an existing one)
curl -X POST http://localhost:8000/api/movies \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Movie",
    "prompt": "A cyberpunk detective",
    "genre": "Sci-Fi",
    "length": "trailer",
    "format": "movie"
  }'

# Copy the movie ID from response

# Generate poster
curl -X POST http://localhost:8000/api/generate/poster \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "movie_id": "PASTE_MOVIE_ID_HERE",
    "prompt": "A neon-lit cyberpunk detective in rain-soaked Tokyo 2099",
    "aspect_ratio": "9:16"
  }'
```

### Test Chat

```bash
curl -X POST http://localhost:8000/api/ai/chat \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Help me develop a sci-fi movie about time travelers"
  }'
```

Expected response:
```json
{
  "session_id": "uuid",
  "reply": "That's a fascinating concept! Here's how I'd develop it..."
}
```

---

## Troubleshooting

### Error: "Google Cloud not configured"
**Solution:** Check that all environment variables are set correctly:
```bash
echo $GOOGLE_CLOUD_PROJECT
echo $GOOGLE_CLOUD_LOCATION
echo $GOOGLE_APPLICATION_CREDENTIALS
```

### Error: "Permission denied" or "403 Forbidden"
**Solution:** Make sure the service account has the right roles:
1. Go to https://console.cloud.google.com/iam-admin/iam
2. Find `cinemaforge-app@passioncraft.iam.gserviceaccount.com`
3. Make sure it has these roles:
   - Vertex AI User
   - Generative AI User
   - Editor (for development only)

### Error: "The caller does not have permission"
**Solution:** The service account key file might be wrong. Re-download it:
1. Go to https://console.cloud.google.com/iam-admin/serviceaccounts
2. Click `cinemaforge-app`
3. Click "Keys" tab
4. Delete old keys
5. Create a new JSON key
6. Update `GOOGLE_APPLICATION_CREDENTIALS` path

### Image generation returns empty
**Solution:** Check your quota:
1. Go to https://console.cloud.google.com/iam-admin/quotas
2. Search for "Generative AI"
3. Make sure you have quota available

---

## Cost Estimation

With your $1700 free credit:

| Feature | Cost | Monthly Usage | Est. Cost |
|---------|------|---------------|-----------|
| Imagen (poster generation) | $0.04 per image | 100 images | $4 |
| Gemini (chat) | $0.075 per 1M input tokens | 100K tokens | $0.01 |
| Veo (video generation) | $0.04 per second | 1000 seconds | $40 |
| **Total** | | | **~$44/month** |

**Your $1700 credit will last ~38 months!**

---

## Next Steps

1. ✅ Enable APIs
2. ✅ Create service account
3. ✅ Download JSON key
4. ✅ Grant permissions
5. ✅ Configure `.env`
6. ✅ Test endpoints
7. ✅ Deploy to production

---

## Support

If you get stuck:
1. Check the error message carefully
2. Review the troubleshooting section
3. Check Google Cloud Console for any warnings
4. Look at the backend logs: `tail -f backend.log`

---

**Last Updated:** May 22, 2026
**Status:** Ready to Deploy
