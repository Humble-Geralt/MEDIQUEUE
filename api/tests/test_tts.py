import asyncio
import base64
import os
import sys

# Add project root to sys.path to allow imports
sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from adapters.tts_adapter import EdgeTtsAdapter, MockTtsAdapter
from services.tts_service import TtsService
from schemas.queue import QueueTicket
from schemas.patient import Patient
from core.enums import Gender, Language, QueuePriorityLevel, QueueTicketStatus

async def test_tts_service_logic():
    """测试 TtsService 的业务逻辑（生成双语文本）"""
    print("\n--- Starting TtsService Logic Test (Mock) ---")
    mock_adapter = MockTtsAdapter()
    service = TtsService(mock_adapter)
    
    # 模拟一个患者票据
    ticket = QueueTicket(
        ticket_no="A001",
        patient=Patient(
            patient_id="p_001",
            name="王建国",
            gender=Gender.MALE,
            language=Language.ZH_CN
        ),
        room_no="101",
        status=QueueTicketStatus.WAITING,
        priority_level=QueuePriorityLevel.NORMAL,
        check_in_time="2026-05-21T10:00:00Z"
    )
    
    # 生成播报数据
    announcements = await service.build_call_announcement(ticket)
    
    print(f"Generated {len(announcements)} announcements.")
    for idx, item in enumerate(announcements):
        print(f"[{idx}] Text: {item.text}")
        if item.audio_base64:
            print(f"[{idx}] Audio: Present (Length: {len(item.audio_base64)})")
        else:
            print(f"[{idx}] Audio: None (Mock Mode)")

async def test_edge_tts_generation():
    """测试 EdgeTtsAdapter 的真实语音生成能力（需联网）"""
    print("\n--- Starting EdgeTts Real Generation Test ---")
    adapter = EdgeTtsAdapter()
    
    test_text = "请 A001 号 王建国，到 101 诊室就诊。"
    print(f"Target Text: {test_text}")
    
    try:
        payload = await adapter.generate(test_text, lang="zh-CN")
        
        if payload.audio_base64:
            print("Successfully generated audio data!")
            audio_bytes = base64.b64decode(payload.audio_base64)
            output_file = "test_output.mp3"
            with open(output_file, "wb") as f:
                f.write(audio_bytes)
            print(f"Result: Audio saved to '{os.path.abspath(output_file)}'")
        else:
            print("Failed: No audio data returned.")
            
    except Exception as e:
        print(f"Error during Real TTS generation: {e}")
        print("(Note: This test requires internet access to Microsoft Edge TTS services)")

async def main():
    # 1. 先测试业务逻辑（不联网）
    await test_tts_service_logic()
    # 2. 再尝试真实生成（联网）
    await test_edge_tts_generation()

if __name__ == "__main__":
    asyncio.run(main())
