# Google Cloud Setup - Browser Only (No gcloud CLI)

## Your Project
- **Name:** passioncraft
- **ID:** 69709585370

---

## Step 1: Enable APIs (Using Browser Only)

1. Open: https://console.cloud.google.com/
2. Make sure you see "passioncraft" in the top left
3. In the search bar at the top, search for: `Vertex AI API`
4. Click on the result
5. Click the blue **"ENABLE"** button
6. Wait 1-2 minutes for it to finish

**Repeat for these APIs:**
- Search: `Generative Language API` → Click → **ENABLE**
- Search: `Cloud Resource Manager API` → Click → **ENABLE**
- Search: `Service Usage API` → Click → **ENABLE**

✅ **Done with Step 1**

---

## Step 2: Create a Service Account (Using Browser Only)

1. Open: https://console.cloud.google.com/iam-admin/serviceaccounts
2. Make sure "passioncraft" is selected in top left
3. Click **"+ CREATE SERVICE ACCOUNT"** button at the top
4. Fill in:
   - **Service account name:** `cinemaforge-app`
   - Leave everything else as default
5. Click **"CREATE AND CONTINUE"**
6. On next page, click **"CONTINUE"** (skip the optional part)
7. On next page, click **"DONE"**

✅ **Done with Step 2**

---

## Step 3: Create and Download the Key (Using Browser Only)

1. Go back to: https://console.cloud.google.com/iam-admin/serviceaccounts
2. You should see `cinemaforge-app` in the list
3. Click on `cinemaforge-app`
4. Click the **"KEYS"** tab
5. Click **"ADD KEY"** → **"Create new key"**
6. Choose **"JSON"** (it's already selected)
7. Click **"CREATE"**
8. A file `cinemaforge-app-XXXXX.json` will download automatically

**Important:** Save this file in your `cinemaCRAFT/backend/` folder and rename it to: `gcloud-key.json`

✅ **Done with Step 3**

---

## Step 4: Grant Permissions (Using Browser Only)

1. Open: https://console.cloud.google.com/iam-admin/iam
2. Make sure "passioncraft" is selected
3. Click **"GRANT ACCESS"** button at the top
4. In the "New principals" field, paste:
   ```
   cinemaforge-app@passioncraft.iam.gserviceaccount.com
   ```
5. Click the "Role" dropdown
6. Search for: `Vertex AI User`
7. Click on it to select it
8. Click **"SAVE"**

**Now repeat steps 3-8 for the second role:**
1. Click **"GRANT ACCESS"** again
2. Paste the same email:
   ```
   cinemaforge-app@passioncraft.iam.gserviceaccount.com
   ```
3. Search for: `Generative AI User`
4. Click on it
5. Click **"SAVE"**

✅ **Done with Step 4**

---

## Step 5: Create Your .env File

1. Open your text editor
2. Create a new file called `.env`
3. Copy and paste this:

```
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

4. **Important:** Replace `/full/path/to/backend/gcloud-key.json` with the actual path
   - Example on Mac/Linux: `/Users/yourname/cinemaCRAFT/backend/gcloud-key.json`
   - Example on Windows: `C:\Users\yourname\cinemaCRAFT\backend\gcloud-key.json`

5. Save this file as `.env` in the `cinemaCRAFT/backend/` folder

✅ **Done with Step 5**

---

## Step 6: Install Dependencies

Open terminal/command prompt and run:

```bash
cd cinemaCRAFT/backend
pip install -r requirements.txt
```

Wait for it to finish (1-2 minutes)

✅ **Done with Step 6**

---

## Step 7: Test It Works

```bash
cd cinemaCRAFT/backend
python test_gcloud.py
```

You should see lots of ✓ checkmarks. If you see ✗, something went wrong.

✅ **Done with Step 7**

---

## Step 8: Start Your Backend

```bash
cd cinemaCRAFT/backend
python server.py
```

You should see:
```
INFO:     Uvicorn running on http://0.0.0.0:8000
```

✅ **Done! Your backend is running!**

---

## Quick Verification Checklist

Before moving on, make sure you have:

- [ ] All 4 APIs enabled (checked in Google Cloud Console)
- [ ] Service account `cinemaforge-app` created
- [ ] Downloaded `gcloud-key.json` file
- [ ] Placed `gcloud-key.json` in `cinemaCRAFT/backend/`
- [ ] Granted both roles to the service account
- [ ] Created `.env` file with correct path to `gcloud-key.json`
- [ ] Ran `pip install -r requirements.txt`
- [ ] Ran `python test_gcloud.py` and saw ✓ marks
- [ ] Backend starts with `python server.py`

---

## Common Issues & Fixes

### Issue: "File not found: gcloud-key.json"

**Fix:** Make sure the path in `.env` is correct. It should be the **full path**, not relative.

Example:
```
❌ Wrong:  GOOGLE_APPLICATION_CREDENTIALS=gcloud-key.json
✅ Right:  GOOGLE_APPLICATION_CREDENTIALS=/Users/john/cinemaCRAFT/backend/gcloud-key.json
```

To find the full path:
- **Mac/Linux:** Open terminal, go to the folder with `gcloud-key.json`, type `pwd`
- **Windows:** Open PowerShell, go to the folder, type `(Get-Location).Path`

### Issue: "Permission denied" or "403 Forbidden"

**Fix:** You didn't grant the roles. Go back to Step 4 and make sure both roles are added:
- Vertex AI User
- Generative AI User

### Issue: "API not enabled"

**Fix:** Go back to Step 1 and make sure all 4 APIs show "ENABLED" (not "ENABLE" button)

### Issue: "Cannot find module 'google'"

**Fix:** Run `pip install -r requirements.txt` again

---

## Next Steps

Once your backend is running:

1. **Test Poster Generation:**
   ```bash
   curl -X POST http://localhost:8000/api/generate/enhance-prompt \
     -H "Content-Type: application/json" \
     -d '{"raw_prompt": "A detective hunts thieves in Tokyo"}'
   ```

2. **Test Chat:**
   ```bash
   curl -X POST http://localhost:8000/api/ai/chat \
     -H "Content-Type: application/json" \
     -d '{"message": "Help me develop a sci-fi movie"}'
   ```

3. **Connect Frontend:**
   - Update your frontend to point to `http://localhost:8000`
   - Test the poster generation and chat features

4. **Deploy:**
   - When ready, deploy to production
   - Update `.env` with production values

---

## Support

If you're stuck:

1. Check the "Common Issues & Fixes" section above
2. Make sure all 4 APIs are enabled
3. Make sure the service account has both roles
4. Make sure the `.env` file path is correct
5. Run `python test_gcloud.py` to see detailed error messages

---

**You're all set! 🎉**

Your CinemaForge backend now has:
- ✅ AI poster generation
- ✅ AI chat (FORGE director)
- ✅ Prompt enhancement
- ✅ Scene descriptions
- ✅ Ready for video generation (when Veo API available)
