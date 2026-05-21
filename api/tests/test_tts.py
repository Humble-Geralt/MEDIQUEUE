import asyncio
import base64
import os
import sys

sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from adapters.tts_adapter import EdgeTtsAdapter, MockTtsAdapter
from services.tts_service import TtsService


async def test_tts_service_logic() -> None:
    print("\n--- Starting TTS service test (mock) ---")
    service = TtsService(MockTtsAdapter())

    payload = await service.synthesize_text("请A001号王建国到101诊室就诊。")
    print(f"Text: {payload.text}")
    print(f"Audio present: {bool(payload.audio_base64)}")


async def test_edge_tts_generation() -> None:
    print("\n--- Starting direct Edge TTS generation test ---")
    payload = await EdgeTtsAdapter().generate("Number A001, Wang Jianguo, please proceed to room 101.", lang="en-US")

    if not payload.audio_base64:
        print("No audio returned. The provider may be unavailable in this environment.")
        return

    audio_bytes = base64.b64decode(payload.audio_base64)
    output_file = "test_output.mp3"
    with open(output_file, "wb") as handle:
        handle.write(audio_bytes)
    print(f"Result: Audio saved to '{os.path.abspath(output_file)}'")


async def main() -> None:
    await test_tts_service_logic()
    await test_edge_tts_generation()


if __name__ == "__main__":
    asyncio.run(main())
