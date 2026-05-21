from __future__ import annotations

from adapters.deepseek_adapter import DeepSeekLlmAdapter
from adapters.mock_llm_adapter import MockLlmAdapter
from adapters.tts_adapter import EdgeTtsAdapter, MockTtsAdapter
from core.config import DEEPSEEK_API_KEY, TTS_PROVIDER
from services.connection_manager import ConnectionManager
from services.priority_service import PriorityService
from services.queue_service import QueueService
from services.tts_service import TtsService
from store.in_memory_store import InMemoryStore

_store = InMemoryStore()
_connection_manager = ConnectionManager()
_queue_service = QueueService(_store)

# LLM Adapter selection
_llm_adapter = DeepSeekLlmAdapter() if DEEPSEEK_API_KEY else MockLlmAdapter()
_priority_service = PriorityService(_queue_service, _llm_adapter)

# TTS Service
_tts_adapter = EdgeTtsAdapter() if TTS_PROVIDER == "edge-tts" else MockTtsAdapter()
_tts_service = TtsService(_tts_adapter)


def get_store() -> InMemoryStore:
    return _store


def get_connection_manager() -> ConnectionManager:
    return _connection_manager


def get_queue_service() -> QueueService:
    return _queue_service


def get_priority_service() -> PriorityService:
    return _priority_service


def get_tts_service() -> TtsService:
    return _tts_service
