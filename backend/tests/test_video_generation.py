"""Tests for the Veo video-generation adapter; provider calls are mocked."""
import asyncio
from pathlib import Path
from types import SimpleNamespace

import pytest

try:
    from backend import gcloud_integration as integration
except ImportError:
    import gcloud_integration as integration


def test_generate_video_downloads_nonempty_mp4(monkeypatch):
    generated = SimpleNamespace(video=object())

    class FakeModels:
        def generate_videos(self, **kwargs):
            assert kwargs["model"]
            assert kwargs["config"].duration_seconds == 6
            return SimpleNamespace(
                done=True,
                response=SimpleNamespace(generated_videos=[generated]),
            )

    class FakeFiles:
        def download(self, *, file, destination):
            assert file is generated.video
            Path(destination).write_bytes(b"mock-mp4-content")

    fake_client = SimpleNamespace(
        models=FakeModels(),
        files=FakeFiles(),
        operations=SimpleNamespace(),
    )
    monkeypatch.setattr(integration, "get_gcloud_client", lambda: fake_client)

    output = Path(integration._generate_video_sync("A cinematic test scene", 6))
    try:
        assert output.is_file()
        assert output.read_bytes() == b"mock-mp4-content"
        assert output.suffix == ".mp4"
    finally:
        output.unlink(missing_ok=True)


def test_generate_video_rejects_unsupported_duration():
    with pytest.raises(ValueError, match="6 or 8 seconds"):
        asyncio.run(integration.generate_video("A scene", 60))


def test_generate_video_rejects_empty_prompt():
    with pytest.raises(ValueError, match="must not be empty"):
        asyncio.run(integration.generate_video("   ", 6))
