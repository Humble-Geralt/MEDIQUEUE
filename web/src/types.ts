export type QueueTicketStatus =
  | 'WAITING'
  | 'CALLED'
  | 'SKIPPED'
  | 'COMPLETED';

export type QueuePriorityLevel =
  | 'NORMAL'
  | 'REVIEWING' // 已提交等待审核
  | 'APPROVED'  // 审核通过插入队首
  | 'REJECTED';  // 审核拒绝返回原位

export interface Patient {
  patientId: string;
  name: string;
  gender: 'M' | 'F';
  englishNameOrPinyin: string;
  age: number;
  nationality?: string;
}

export interface QueueTicket {
  ticketNo: string;
  patient: Patient;
  roomNo: string; // 诊室号，如: "101"
  status: QueueTicketStatus;
  priorityLevel: QueuePriorityLevel;
  checkInTime: string; // ISO String
  calledAt?: string; // 叫号时间
  estimatedWaitMinutes?: number; // 预计排队时长
}

export interface PriorityRequest {
  requestId: string;
  ticketNo: string;
  descriptionText: string;
  aiResult?: {
    urgencyLevel: 'high' | 'medium' | 'low' | 'unknown';
    medicalReason: boolean;
    isAbuseSuspected: boolean;
    recommendedAction: 'approve_priority' | 'reject_non_medical' | 'manual_review';
    explanation: string;
    targetSeverityScore: number; // 0-10 严重系数
  };
  reviewStatus: 'PENDING' | 'APPROVED' | 'REJECTED';
  reviewedAt?: string;
}

export interface QueueSnapshot {
  snapshotVersion: number;
  currentCall: QueueTicket | null;
  waitingList: QueueTicket[];
  calledHistory: QueueTicket[];
  isPaused: boolean;
  activeRequests: PriorityRequest[];
}

// WebSocket 消息格式
export type WsMessageType =
  | 'SNAPSHOT_UPDATE'
  | 'CALL_COMMAND'
  | 'ALERT_TRIGGER'
  | 'OFFLINE_STATE';

export interface WsMessage {
  type: WsMessageType;
  payload: any;
  timestamp: string;
}
