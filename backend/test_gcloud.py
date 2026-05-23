#!/usr/bin/env python3
"""
Test script to verify Google Cloud setup for CinemaForge
Run this after completing SETUP_GCLOUD.md
"""

import os
import sys
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent))

def test_environment():
    """Test if environment variables are set correctly"""
    print("\n" + "="*50)
    print("Testing Environment Variables")
    print("="*50)
    
    required_vars = [
        'GOOGLE_CLOUD_PROJECT',
        'GOOGLE_CLOUD_LOCATION',
    ]
    
    optional_vars = [
        'GOOGLE_APPLICATION_CREDENTIALS',
    ]
    
    all_good = True
    
    for var in required_vars:
        value = os.environ.get(var)
        if value:
            print(f"✓ {var}: {value}")
        else:
            print(f"✗ {var}: NOT SET")
            all_good = False
    
    for var in optional_vars:
        value = os.environ.get(var)
        if value:
            print(f"✓ {var}: {value}")
        else:
            print(f"⚠ {var}: not set (using default credentials)")
    
    return all_good


def test_imports():
    """Test if required packages are installed"""
    print("\n" + "="*50)
    print("Testing Package Imports")
    print("="*50)
    
    packages = [
        ('google', 'google-genai'),
        ('google.genai', 'google-genai'),
        ('google.cloud', 'google-cloud-aiplatform'),
    ]
    
    all_good = True
    
    for module, package_name in packages:
        try:
            __import__(module)
            print(f"✓ {package_name} installed")
        except ImportError as e:
            print(f"✗ {package_name} NOT installed")
            print(f"  Install with: pip install {package_name}")
            all_good = False
    
    return all_good


def test_gcloud_client():
    """Test if we can create a Google Cloud client"""
    print("\n" + "="*50)
    print("Testing Google Cloud Client")
    print("="*50)
    
    try:
        from google import genai
        from google.genai import types
        
        project = os.environ.get('GOOGLE_CLOUD_PROJECT')
        location = os.environ.get('GOOGLE_CLOUD_LOCATION', 'us-central1')
        use_vertexai = os.environ.get('GOOGLE_GENAI_USE_VERTEXAI', 'false').lower() == 'true'
        
        if use_vertexai:
            print(f"Creating Vertex AI client for project: {project}")
            client = genai.Client(
                vertexai=True,
                project=project,
                location=location,
            )
            print("✓ Vertex AI client created successfully")
        else:
            api_key = os.environ.get('GOOGLE_GENAI_API_KEY')
            if api_key:
                print("Creating Gemini API client")
                client = genai.Client(api_key=api_key)
                print("✓ Gemini API client created successfully")
            else:
                print("✗ No API key or Vertex AI configured")
                return False
        
        return True
    except Exception as e:
        print(f"✗ Failed to create client: {e}")
        return False


def test_gemini_chat():
    """Test if we can generate content with Gemini"""
    print("\n" + "="*50)
    print("Testing Gemini Chat")
    print("="*50)
    
    try:
        from google import genai
        
        project = os.environ.get('GOOGLE_CLOUD_PROJECT')
        location = os.environ.get('GOOGLE_CLOUD_LOCATION', 'us-central1')
        use_vertexai = os.environ.get('GOOGLE_GENAI_USE_VERTEXAI', 'false').lower() == 'true'
        
        if use_vertexai:
            client = genai.Client(
                vertexai=True,
                project=project,
                location=location,
            )
        else:
            api_key = os.environ.get('GOOGLE_GENAI_API_KEY')
            client = genai.Client(api_key=api_key)
        
        print("Sending test message to Gemini...")
        response = client.models.generate_content(
            model="gemini-2.5-flash",
            contents="What is a good movie idea for a sci-fi thriller? Answer in one sentence.",
        )
        
        if response.text:
            print(f"✓ Chat works!")
            print(f"Response: {response.text[:100]}...")
            return True
        else:
            print("✗ No response from Gemini")
            return False
            
    except Exception as e:
        print(f"✗ Chat failed: {e}")
        import traceback
        traceback.print_exc()
        return False


def test_image_generation():
    """Test if we can generate images with Gemini"""
    print("\n" + "="*50)
    print("Testing Image Generation")
    print("="*50)
    
    try:
        from google import genai
        from google.genai import types
        
        project = os.environ.get('GOOGLE_CLOUD_PROJECT')
        location = os.environ.get('GOOGLE_CLOUD_LOCATION', 'us-central1')
        use_vertexai = os.environ.get('GOOGLE_GENAI_USE_VERTEXAI', 'false').lower() == 'true'
        
        if use_vertexai:
            client = genai.Client(
                vertexai=True,
                project=project,
                location=location,
            )
        else:
            api_key = os.environ.get('GOOGLE_GENAI_API_KEY')
            client = genai.Client(api_key=api_key)
        
        print("Generating test image...")
        response = client.models.generate_content(
            model="gemini-2.5-flash-image",
            contents="A cyberpunk detective in neon-lit Tokyo",
            config=types.GenerateContentConfig(
                response_modalities=["IMAGE"],
                image_config=types.ImageConfig(aspect_ratio="9:16"),
            ),
        )
        
        image_found = False
        for part in response.parts:
            if part.inline_data:
                image_bytes = len(part.inline_data.data)
                print(f"✓ Image generated! ({image_bytes} bytes)")
                image_found = True
                break
        
        if not image_found:
            print("✗ No image in response")
            return False
        
        return True
        
    except Exception as e:
        print(f"✗ Image generation failed: {e}")
        import traceback
        traceback.print_exc()
        return False


def test_gcloud_integration():
    """Test the gcloud_integration module"""
    print("\n" + "="*50)
    print("Testing gcloud_integration Module")
    print("="*50)
    
    try:
        from gcloud_integration import (
            get_gcloud_client,
            enhance_movie_prompt,
        )
        
        print("✓ gcloud_integration module imported")
        
        # Test get_gcloud_client
        client = get_gcloud_client()
        print("✓ gcloud_integration.get_gcloud_client() works")
        
        return True
    except Exception as e:
        print(f"✗ gcloud_integration test failed: {e}")
        import traceback
        traceback.print_exc()
        return False


def test_llm_brain():
    """Test the llm_brain module"""
    print("\n" + "="*50)
    print("Testing llm_brain Module")
    print("="*50)
    
    try:
        from llm_brain import (
            get_gemini_client,
            FORGE_SYSTEM_PROMPT,
        )
        
        print("✓ llm_brain module imported")
        print(f"✓ FORGE_SYSTEM_PROMPT loaded ({len(FORGE_SYSTEM_PROMPT)} chars)")
        
        # Test get_gemini_client
        client = get_gemini_client()
        print("✓ llm_brain.get_gemini_client() works")
        
        return True
    except Exception as e:
        print(f"✗ llm_brain test failed: {e}")
        import traceback
        traceback.print_exc()
        return False


def main():
    """Run all tests"""
    print("\n")
    print("╔════════════════════════════════════════════╗")
    print("║   CinemaForge Google Cloud Setup Test      ║")
    print("╚════════════════════════════════════════════╝")
    
    results = {
        "Environment Variables": test_environment(),
        "Package Imports": test_imports(),
        "Google Cloud Client": test_gcloud_client(),
        "Gemini Chat": test_gemini_chat(),
        "Image Generation": test_image_generation(),
        "gcloud_integration Module": test_gcloud_integration(),
        "llm_brain Module": test_llm_brain(),
    }
    
    print("\n" + "="*50)
    print("Test Summary")
    print("="*50)
    
    for test_name, result in results.items():
        status = "✓ PASS" if result else "✗ FAIL"
        print(f"{status}: {test_name}")
    
    all_passed = all(results.values())
    
    print("\n" + "="*50)
    if all_passed:
        print("✓ All tests passed! Your setup is ready.")
        print("\nYou can now:")
        print("1. Start the backend: python server.py")
        print("2. Test endpoints with curl or Postman")
        print("3. Deploy to production")
    else:
        print("✗ Some tests failed. Please fix the issues above.")
        print("\nCommon solutions:")
        print("1. Check your .env file")
        print("2. Verify Google Cloud credentials")
        print("3. Make sure all APIs are enabled")
        print("4. Run: pip install -r requirements.txt")
    print("="*50 + "\n")
    
    return 0 if all_passed else 1


if __name__ == "__main__":
    sys.exit(main())
