from enum import Enum


class Gender(str, Enum):
    MALE = "male"
    FEMALE = "female"
    OTHER = "other"


class Language(str, Enum):
    ZH_CN = "zh-CN"
    EN_US = "en-US"


class QueueTicketStatus(str, Enum):
    WAITING = "WAITING"
    CALLED = "CALLED"
    SKIPPED = "SKIPPED"
    IN_CONSULTATION = "IN_CONSULTATION"
    COMPLETED = "COMPLETED"
    MISSED = "MISSED"


class QueuePriorityLevel(str, Enum):
    NORMAL = "NORMAL"
    PRIORITY_REVIEWING = "PRIORITY_REVIEWING"
    PRIORITY_APPROVED = "PRIORITY_APPROVED"
    RETURNING = "RETURNING"


class PriorityRequestStatus(str, Enum):
    PENDING = "PENDING"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"


class ReviewDecision(str, Enum):
    APPROVE = "APPROVE"
    REJECT = "REJECT"


class ConnectionRole(str, Enum):
    DOCTOR = "doctor"
    DISPLAY = "display"
    PATIENT = "patient"
