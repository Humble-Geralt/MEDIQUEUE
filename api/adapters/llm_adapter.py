from __future__ import annotations

from abc import ABC, abstractmethod

from schemas.priority import PriorityAiResult
from schemas.queue import QueueTicket


class BaseLlmAdapter(ABC):
    @abstractmethod
    def analyze(self, description_text: str, ticket: QueueTicket) -> PriorityAiResult:
        raise NotImplementedError
