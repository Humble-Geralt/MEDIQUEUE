from __future__ import annotations

from adapters.llm_adapter import BaseLlmAdapter
from schemas.priority import PriorityAiResult
from schemas.queue import QueueTicket


class MockLlmAdapter(BaseLlmAdapter):
    HIGH_URGENCY_KEYWORDS = ("胸闷", "气短", "大量出血", "腹痛", "孕36周", "昏厥", "呼吸困难")
    ABUSE_KEYWORDS = ("vip", "赶时间", "上班", "高铁", "飞机", "插队", "着急")

    def analyze(self, description_text: str, ticket: QueueTicket) -> PriorityAiResult:
        text = description_text.strip().lower()

        if any(keyword in text for keyword in self.ABUSE_KEYWORDS):
            return PriorityAiResult(
                urgency_level="low",
                medical_reason=False,
                is_abuse_suspected=True,
                recommended_action="reject_non_medical",
                explanation="描述中主要是非医疗优先理由，不建议优先处理。",
            )

        if any(keyword in text for keyword in self.HIGH_URGENCY_KEYWORDS):
            return PriorityAiResult(
                urgency_level="high",
                medical_reason=True,
                is_abuse_suspected=False,
                recommended_action="approve_priority",
                explanation="描述中包含潜在紧急医疗症状，建议医生尽快人工复核。",
            )

        return PriorityAiResult(
            urgency_level="unknown",
            medical_reason=False,
            is_abuse_suspected=False,
            recommended_action="manual_review",
            explanation="无法仅凭一句话稳定判断紧急程度，建议医生结合现场情况判断。",
        )
