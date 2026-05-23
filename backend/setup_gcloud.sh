#!/bin/bash

# CinemaForge Google Cloud Setup Script
# This script helps you configure Google Cloud for CinemaForge

set -e

echo "=========================================="
echo "CinemaForge Google Cloud Setup"
echo "=========================================="
echo ""

PROJECT_ID="passioncraft"
SERVICE_ACCOUNT="cinemaforge-app"
REGION="us-central1"

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if gcloud is installed
if ! command -v gcloud &> /dev/null; then
    echo -e "${YELLOW}⚠️  gcloud CLI not found${NC}"
    echo "Install it from: https://cloud.google.com/sdk/docs/install"
    exit 1
fi

echo -e "${BLUE}Step 1: Setting up gcloud configuration${NC}"
gcloud config set project $PROJECT_ID
echo -e "${GREEN}✓ Project set to: $PROJECT_ID${NC}"
echo ""

echo -e "${BLUE}Step 2: Checking if APIs are enabled${NC}"
echo "Enabling required APIs..."

gcloud services enable aiplatform.googleapis.com --project=$PROJECT_ID
echo -e "${GREEN}✓ Vertex AI API enabled${NC}"

gcloud services enable generativelanguage.googleapis.com --project=$PROJECT_ID
echo -e "${GREEN}✓ Generative Language API enabled${NC}"

gcloud services enable cloudresourcemanager.googleapis.com --project=$PROJECT_ID
echo -e "${GREEN}✓ Cloud Resource Manager API enabled${NC}"

gcloud services enable serviceusage.googleapis.com --project=$PROJECT_ID
echo -e "${GREEN}✓ Service Usage API enabled${NC}"

echo ""
echo -e "${BLUE}Step 3: Checking for existing service account${NC}"

# Check if service account exists
if gcloud iam service-accounts describe ${SERVICE_ACCOUNT}@${PROJECT_ID}.iam.gserviceaccount.com --project=$PROJECT_ID &> /dev/null; then
    echo -e "${YELLOW}⚠️  Service account already exists${NC}"
else
    echo "Creating service account: $SERVICE_ACCOUNT"
    gcloud iam service-accounts create $SERVICE_ACCOUNT \
        --display-name="CinemaForge Backend Service" \
        --project=$PROJECT_ID
    echo -e "${GREEN}✓ Service account created${NC}"
fi

echo ""
echo -e "${BLUE}Step 4: Granting permissions${NC}"

SERVICE_ACCOUNT_EMAIL="${SERVICE_ACCOUNT}@${PROJECT_ID}.iam.gserviceaccount.com"

# Grant Vertex AI User role
gcloud projects add-iam-policy-binding $PROJECT_ID \
    --member=serviceAccount:$SERVICE_ACCOUNT_EMAIL \
    --role=roles/aiplatform.user \
    --quiet &> /dev/null || true
echo -e "${GREEN}✓ Vertex AI User role granted${NC}"

# Grant Generative AI User role
gcloud projects add-iam-policy-binding $PROJECT_ID \
    --member=serviceAccount:$SERVICE_ACCOUNT_EMAIL \
    --role=roles/generativeai.user \
    --quiet &> /dev/null || true
echo -e "${GREEN}✓ Generative AI User role granted${NC}"

echo ""
echo -e "${BLUE}Step 5: Creating service account key${NC}"

KEY_FILE="gcloud-key.json"

if [ -f "$KEY_FILE" ]; then
    echo -e "${YELLOW}⚠️  Key file already exists: $KEY_FILE${NC}"
    read -p "Overwrite? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Skipping key creation"
    else
        gcloud iam service-accounts keys create $KEY_FILE \
            --iam-account=$SERVICE_ACCOUNT_EMAIL \
            --project=$PROJECT_ID
        echo -e "${GREEN}✓ Service account key created: $KEY_FILE${NC}"
    fi
else
    gcloud iam service-accounts keys create $KEY_FILE \
        --iam-account=$SERVICE_ACCOUNT_EMAIL \
        --project=$PROJECT_ID
    echo -e "${GREEN}✓ Service account key created: $KEY_FILE${NC}"
fi

echo ""
echo -e "${BLUE}Step 6: Creating .env file${NC}"

ENV_FILE=".env"

if [ -f "$ENV_FILE" ]; then
    echo -e "${YELLOW}⚠️  .env file already exists${NC}"
else
    cat > $ENV_FILE << EOF
# MongoDB Configuration
MONGO_URL=mongodb://localhost:27017
DB_NAME=cinemaforge

# JWT Secret
JWT_SECRET=your-secret-key-here

# Emergent Integrations (optional fallback)
EMERGENT_LLM_KEY=
STRIPE_API_KEY=

# Google Cloud Configuration
GOOGLE_GENAI_USE_VERTEXAI=true
GOOGLE_CLOUD_PROJECT=$PROJECT_ID
GOOGLE_CLOUD_LOCATION=$REGION
GOOGLE_APPLICATION_CREDENTIALS=$(pwd)/$KEY_FILE

# CORS Configuration
CORS_ORIGINS=http://localhost:3000,http://localhost:3001

# Server Configuration
HOST=0.0.0.0
PORT=8000
EOF
    echo -e "${GREEN}✓ .env file created${NC}"
fi

echo ""
echo "=========================================="
echo -e "${GREEN}✓ Setup Complete!${NC}"
echo "=========================================="
echo ""
echo "Next steps:"
echo "1. Update .env file with your configuration"
echo "2. Install Python dependencies: pip install -r requirements.txt"
echo "3. Start the backend: python server.py"
echo ""
echo "To test the setup, run:"
echo "  python test_gcloud.py"
echo ""
echo "For more information, see: SETUP_GCLOUD.md"
echo ""
