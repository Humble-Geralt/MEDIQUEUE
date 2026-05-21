from __future__ import annotations

import json
import logging
from typing import Any

import httpx

from adapters.llm_adapter import BaseLlmAdapter
from core.config import DEEPSEEK_API_KEY, DEEPSEEK_BASE_URL
from schemas.priority import PriorityAiResult
from schemas.queue import QueueTicket

logger = logging.getLogger(__name__)

class DeepSeekLlmAdapter(BaseLlmAdapter):
    def __init__(self) -> None:
        self.api_key = DEEPSEEK_API_KEY
        self.base_url = DEEPSEEK_BASE_URL

    def analyze(self, description_text: str, ticket: QueueTicket) -> PriorityAiResult:
        if not self.api_key:
            logger.warning("DEEPSEEK_API_KEY is not set. Falling back to default manual review.")
            return self._manual_review_fallback("API key not configured.")

        prompt = self._build_prompt(description_text, ticket)
        
        try:
            with httpx.Client(timeout=30.0) as client:
                response = client.post(
                    f"{self.base_url.rstrip('/')}/v1/chat/completions",
                    headers={
                        "Authorization": f"Bearer {self.api_key}",
                        "Content-Type": "application/json",
                    },
                    json={
                        "model": "deepseek-chat",
                        "messages": [
                            {"role": "system", "content": "You are a medical triage assistant. Analyze patient priority requests and return structured JSON."},
                            {"role": "user", "content": prompt},
                        ],
                        "response_format": {"type": "json_object"},
                    },
                )
                response.raise_for_status()
                data = response.json()
                content = data["choices"][0]["message"]["content"]
                result_dict = json.loads(content)
                return self._parse_result(result_dict)
        except Exception as e:
            logger.error(f"Error calling DeepSeek API: {e}")
            return self._manual_review_fallback(f"AI evaluation failed: {str(e)}")

    def _build_prompt(self, text: str, ticket: QueueTicket) -> str:
        return f"""
Analyze the following patient's priority request.
Patient Name: {ticket.patient.name}
Gender: {ticket.patient.gender}
Ticket No: {ticket.ticket_no}
Request Description: "{text}"

Guidelines:
1. Identify high-urgency medical conditions (e.g., chest pain, difficulty breathing, severe bleeding, abdominal pain in late pregnancy).
2. Identify suspected abuse or non-medical reasons (e.g., "I'm in a hurry", "I'm a VIP", "I have a train to catch").
3. Urgency levels: high, medium, low, unknown.
4. Recommended actions: approve_priority, reject_non_medical, manual_review.

Return a JSON object exactly matching this schema:
{{
    "urgencyLevel": "string",
    "medicalReason": boolean,
    "isAbuseSuspected": boolean,
    "recommendedAction": "string",
    "explanation": "string"
}}
"""

    def _parse_result(self, data: dict[str, Any]) -> PriorityAiResult:
        return PriorityAiResult(
            urgency_level=data.get("urgencyLevel", "unknown"),
            medical_reason=data.get("medicalReason", False),
            is_abuse_suspected=data.get("isAbuseSuspected", False),
            recommended_action=data.get("recommendedAction", "manual_review"),
            explanation=data.get("explanation", "Parsed from AI response."),
        )

    def _manual_review_fallback(self, error_msg: str) -> PriorityAiResult:
        return PriorityAiResult(
            urgency_level="unknown",
            medical_reason=False,
            is_abuse_suspected=False,
            recommended_action="manual_review",
            explanation=f"Fallback to manual review. {error_msg}",
        )
