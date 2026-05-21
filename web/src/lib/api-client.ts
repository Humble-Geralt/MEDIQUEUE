import type {
  PriorityRequest,
  QueuePriorityLevel,
  QueueSnapshot,
  QueueTicket,
  QueueTicketStatus,
} from "../types";

type BackendEnvelope<T> = {
  success: boolean;
  data: T | null;
  error: {
    code: string;
    message: string;
  } | null;
  meta?: {
    snapshotVersion?: string | null;
  } | null;
};

type BackendPatient = {
  patientId: string;
  name: string;
  gender: "male" | "female" | "other";
  englishNameOrPinyin?: string | null;
  language: "zh-CN" | "en-US";
};

type BackendQueueTicket = {
  ticketNo: string;
  patient: BackendPatient;
  roomNo: string;
  status:
    | "WAITING"
    | "CALLED"
    | "SKIPPED"
    | "IN_CONSULTATION"
    | "COMPLETED"
    | "MISSED";
  priorityLevel:
    | "NORMAL"
    | "PRIORITY_REVIEWING"
    | "PRIORITY_APPROVED"
    | "RETURNING";
  checkInTime: string;
};

type BackendPriorityAiResult = {
  urgencyLevel: "high" | "medium" | "low" | "unknown";
  medicalReason: boolean;
  isAbuseSuspected: boolean;
  recommendedAction:
    | "approve_priority"
    | "reject_non_medical"
    | "manual_review";
  explanation: string;
};

type BackendPriorityRequest = {
  requestId: string;
  ticketNo: string;
  descriptionText: string;
  aiResult?: BackendPriorityAiResult | null;
  reviewStatus: "PENDING" | "APPROVED" | "REJECTED";
  createdAt: string;
  reviewedAt?: string | null;
};

type BackendQueueSnapshot = {
  snapshotVersion: string;
  roomNo: string;
  currentCall: BackendQueueTicket | null;
  waitingList: BackendQueueTicket[];
  isPaused: boolean;
  pendingPriorityRequests: BackendPriorityRequest[];
  updatedAt: string;
};

export type TtsClip = {
  text: string;
  audioBase64?: string | null;
  url?: string | null;
};

type BackendEventBase = {
  roomNo: string;
  snapshotVersion: string;
};

export type BackendRoomEvent =
  | { type: "snapshot.sync"; payload: BackendQueueSnapshot }
  | { type: "queue.updated"; payload: BackendQueueSnapshot }
  | {
      type: "call.started";
      payload: BackendEventBase & {
        currentCall: { ticketNo: string; displayName: string; roomNo: string };
      };
    }
  | {
      type: "call.recalled";
      payload: BackendEventBase & {
        currentCall: { ticketNo: string; displayName: string; roomNo: string };
      };
    }
  | {
      type: "call.skipped";
      payload: { roomNo: string; ticketNo: string; snapshotVersion: string };
    }
  | { type: "call.paused"; payload: { roomNo: string; snapshotVersion: string } }
  | { type: "call.resumed"; payload: { roomNo: string; snapshotVersion: string } }
  | {
      type: "priority.reviewed";
      payload: BackendEventBase & {
        requestId: string;
        ticketNo: string;
        delayedTicketNo?: string | null;
        decision: "APPROVE" | "REJECT";
      };
    };

type FrontendPatient = QueueTicket["patient"];

const API_BASE_URL =
  (import.meta.env.VITE_API_BASE_URL as string | undefined)?.replace(/\/$/, "") ??
  "http://127.0.0.1:8000";
const WS_BASE_URL =
  (import.meta.env.VITE_WS_BASE_URL as string | undefined)?.replace(/\/$/, "") ??
  "ws://127.0.0.1:8000";

export const ROOM_NO =
  (import.meta.env.VITE_ROOM_NO as string | undefined) ?? "101";

type BridgeState = {
  snapshot: QueueSnapshot | null;
  historyByTicket: Map<string, QueueTicket>;
  backendSnapshotVersion: string | null;
  revision: number;
};

function toFrontendGender(
  gender: BackendPatient["gender"]
): FrontendPatient["gender"] {
  return gender === "female" ? "F" : "M";
}

function toFrontendPatient(patient: BackendPatient): FrontendPatient {
  return {
    patientId: patient.patientId,
    name: patient.name,
    gender: toFrontendGender(patient.gender),
    englishNameOrPinyin: patient.englishNameOrPinyin ?? patient.name,
    age: 40,
    nationality: patient.language === "en-US" ? "US" : "CN",
  };
}

function toFrontendPriorityLevel(
  priorityLevel: BackendQueueTicket["priorityLevel"]
): QueuePriorityLevel {
  switch (priorityLevel) {
    case "PRIORITY_REVIEWING":
      return "REVIEWING";
    case "PRIORITY_APPROVED":
      return "APPROVED";
    default:
      return "NORMAL";
  }
}

function toFrontendStatus(
  status: BackendQueueTicket["status"]
): QueueTicketStatus {
  switch (status) {
    case "CALLED":
    case "IN_CONSULTATION":
      return "CALLED";
    case "SKIPPED":
    case "MISSED":
      return "SKIPPED";
    case "COMPLETED":
      return "COMPLETED";
    default:
      return "WAITING";
  }
}

function severityScore(
  urgencyLevel: BackendPriorityAiResult["urgencyLevel"]
): number {
  switch (urgencyLevel) {
    case "high":
      return 8;
    case "medium":
      return 5;
    case "low":
      return 2;
    default:
      return 0;
  }
}

function toFrontendTicket(
  ticket: BackendQueueTicket,
  estimatedWaitMinutes = 0
): QueueTicket {
  return {
    ticketNo: ticket.ticketNo,
    patient: toFrontendPatient(ticket.patient),
    roomNo: ticket.roomNo,
    status: toFrontendStatus(ticket.status),
    priorityLevel: toFrontendPriorityLevel(ticket.priorityLevel),
    checkInTime: ticket.checkInTime,
    estimatedWaitMinutes,
  };
}

function toFrontendRequest(request: BackendPriorityRequest): PriorityRequest {
  return {
    requestId: request.requestId,
    ticketNo: request.ticketNo,
    descriptionText: request.descriptionText,
    aiResult: request.aiResult
      ? {
          urgencyLevel: request.aiResult.urgencyLevel,
          medicalReason: request.aiResult.medicalReason,
          isAbuseSuspected: request.aiResult.isAbuseSuspected,
          recommendedAction: request.aiResult.recommendedAction,
          explanation: request.aiResult.explanation,
          targetSeverityScore: severityScore(request.aiResult.urgencyLevel),
        }
      : undefined,
    reviewStatus: request.reviewStatus,
    reviewedAt: request.reviewedAt ?? undefined,
  };
}

function setHistoryTicket(
  historyByTicket: Map<string, QueueTicket>,
  ticket: QueueTicket
): Map<string, QueueTicket> {
  const next = new Map(historyByTicket);
  next.delete(ticket.ticketNo);
  next.set(ticket.ticketNo, ticket);
  return next;
}

function isInitialResetSnapshot(snapshot: BackendQueueSnapshot): boolean {
  return (
    snapshot.waitingList.length >= 10 &&
    snapshot.currentCall === null &&
    snapshot.pendingPriorityRequests.length === 0 &&
    snapshot.isPaused === false
  );
}

export function createBridgeState(): BridgeState {
  return {
    snapshot: null,
    historyByTicket: new Map<string, QueueTicket>(),
    backendSnapshotVersion: null,
    revision: 0,
  };
}

export function adaptBackendSnapshot(
  backendSnapshot: BackendQueueSnapshot,
  state: BridgeState
): BridgeState {
  let historyByTicket = new Map(state.historyByTicket);

  if (isInitialResetSnapshot(backendSnapshot)) {
    historyByTicket.clear();
  }

  const previousCurrentCall = state.snapshot?.currentCall ?? null;
  const nextCurrentCall = backendSnapshot.currentCall
    ? toFrontendTicket(backendSnapshot.currentCall, 0)
    : null;

  if (
    previousCurrentCall &&
    (!nextCurrentCall || previousCurrentCall.ticketNo !== nextCurrentCall.ticketNo) &&
    !historyByTicket.has(previousCurrentCall.ticketNo)
  ) {
    historyByTicket = setHistoryTicket(historyByTicket, {
      ...previousCurrentCall,
      status: "COMPLETED",
    });
  }

  const waitingList = backendSnapshot.waitingList.map((ticket, index) =>
    toFrontendTicket(ticket, index * 10)
  );

  const activeTicketNos = new Set(
    [nextCurrentCall, ...waitingList]
      .filter((ticket): ticket is QueueTicket => ticket !== null)
      .map((ticket) => ticket.ticketNo)
  );

  for (const ticketNo of activeTicketNos) {
    historyByTicket.delete(ticketNo);
  }

  const snapshot: QueueSnapshot = {
    snapshotVersion: state.revision + 1,
    currentCall: nextCurrentCall,
    waitingList,
    calledHistory: [...historyByTicket.values()].reverse(),
    isPaused: backendSnapshot.isPaused,
    activeRequests: backendSnapshot.pendingPriorityRequests.map(toFrontendRequest),
  };

  return {
    snapshot,
    historyByTicket,
    backendSnapshotVersion: backendSnapshot.snapshotVersion,
    revision: state.revision + 1,
  };
}

export function markSkippedCurrentCall(
  ticketNo: string,
  state: BridgeState
): BridgeState {
  if (!state.snapshot?.currentCall || state.snapshot.currentCall.ticketNo !== ticketNo) {
    return state;
  }

  return {
    ...state,
    historyByTicket: setHistoryTicket(state.historyByTicket, {
      ...state.snapshot.currentCall,
      status: "SKIPPED",
    }),
  };
}

function buildBackendUrl(path: string): string {
  return `${API_BASE_URL}${path}`;
}

function buildWsUrl(): string {
  return `${WS_BASE_URL}/ws/rooms/${ROOM_NO}?role=display`;
}

async function parseEnvelope<T>(response: Response): Promise<BackendEnvelope<T>> {
  const payload = (await response.json()) as BackendEnvelope<T>;
  if (!response.ok || !payload.success || payload.data === null) {
    throw new Error(payload.error?.message ?? `Request failed with status ${response.status}`);
  }
  return payload;
}

async function requestJson<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(buildBackendUrl(path), init);
  const envelope = await parseEnvelope<T>(response);
  return envelope.data as T;
}

export async function fetchQueueSnapshot(): Promise<BackendQueueSnapshot> {
  return requestJson<BackendQueueSnapshot>(`/api/v1/queue?roomNo=${ROOM_NO}`);
}

export async function callNext(
  expectedSnapshotVersion?: string | null
): Promise<BackendQueueSnapshot> {
  return requestJson<BackendQueueSnapshot>("/api/v1/calls/next", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      roomNo: ROOM_NO,
      expectedSnapshotVersion: expectedSnapshotVersion ?? undefined,
    }),
  });
}

export async function recallCurrent(
  expectedSnapshotVersion?: string | null
): Promise<BackendQueueSnapshot> {
  return requestJson<BackendQueueSnapshot>("/api/v1/calls/recall", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      roomNo: ROOM_NO,
      expectedSnapshotVersion: expectedSnapshotVersion ?? undefined,
    }),
  });
}

export async function skipCurrent(
  ticketNo: string,
  expectedSnapshotVersion?: string | null
): Promise<BackendQueueSnapshot> {
  return requestJson<BackendQueueSnapshot>("/api/v1/calls/skip", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      roomNo: ROOM_NO,
      ticketNo,
      expectedSnapshotVersion: expectedSnapshotVersion ?? undefined,
    }),
  });
}

export async function pauseCalls(
  expectedSnapshotVersion?: string | null
): Promise<BackendQueueSnapshot> {
  return requestJson<BackendQueueSnapshot>("/api/v1/calls/pause", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      roomNo: ROOM_NO,
      expectedSnapshotVersion: expectedSnapshotVersion ?? undefined,
    }),
  });
}

export async function resumeCalls(
  expectedSnapshotVersion?: string | null
): Promise<BackendQueueSnapshot> {
  return requestJson<BackendQueueSnapshot>("/api/v1/calls/resume", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      roomNo: ROOM_NO,
      expectedSnapshotVersion: expectedSnapshotVersion ?? undefined,
    }),
  });
}

export async function createPriorityRequest(
  ticketNo: string,
  descriptionText: string
): Promise<BackendPriorityRequest> {
  return requestJson<BackendPriorityRequest>("/api/v1/priority-requests", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      ticketNo,
      descriptionText,
    }),
  });
}

export async function reviewPriorityRequest(
  requestId: string,
  decision: "APPROVE" | "REJECT",
  expectedSnapshotVersion?: string | null
): Promise<BackendPriorityRequest> {
  return requestJson<BackendPriorityRequest>(
    `/api/v1/priority-requests/${requestId}/review`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        roomNo: ROOM_NO,
        decision,
        expectedSnapshotVersion: expectedSnapshotVersion ?? undefined,
      }),
    }
  );
}

export async function resetQueue(): Promise<BackendQueueSnapshot> {
  return requestJson<BackendQueueSnapshot>("/api/v1/dev/reset", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      roomNo: ROOM_NO,
    }),
  });
}

export async function requestTts(text: string): Promise<TtsClip> {
  return requestJson<TtsClip>("/api/v1/tts", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text }),
  });
}

export function createRealtimeSocket(): WebSocket {
  return new WebSocket(buildWsUrl());
}

export function isSnapshotEvent(
  message: BackendRoomEvent
): message is Extract<
  BackendRoomEvent,
  { type: "snapshot.sync" | "queue.updated" }
> {
  return message.type === "snapshot.sync" || message.type === "queue.updated";
}

export function isRoomEvent(value: unknown): value is BackendRoomEvent {
  if (!value || typeof value !== "object") {
    return false;
  }
  return "type" in value;
}

export { toFrontendRequest };
