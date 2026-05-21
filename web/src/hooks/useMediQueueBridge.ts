import { useCallback, useEffect, useRef, useState } from "react";
import type { PriorityRequest, QueueSnapshot, QueueTicket } from "../types";
import {
  adaptBackendSnapshot,
  callNext,
  createBridgeState,
  createPriorityRequest,
  createRealtimeSocket,
  fetchQueueSnapshot,
  isRoomEvent,
  isSnapshotEvent,
  markSkippedCurrentCall,
  pauseCalls,
  recallCurrent,
  requestTts,
  resetQueue,
  resumeCalls,
  reviewPriorityRequest,
  skipCurrent,
  toFrontendRequest,
  type BackendRoomEvent,
  type TtsClip,
} from "../lib/api-client";

type SpeechPlaybackRequest = {
  key: string;
  clips: TtsClip[];
};

type BackendSnapshot = Awaited<ReturnType<typeof fetchQueueSnapshot>>;

function findTicket(snapshot: QueueSnapshot | null, ticketNo: string): QueueTicket | null {
  if (!snapshot) {
    return null;
  }

  if (snapshot.currentCall?.ticketNo === ticketNo) {
    return snapshot.currentCall;
  }

  return (
    snapshot.waitingList.find((ticket) => ticket.ticketNo === ticketNo) ??
    snapshot.calledHistory.find((ticket) => ticket.ticketNo === ticketNo) ??
    null
  );
}

function findRequest(
  snapshot: QueueSnapshot | null,
  requestId: string
): PriorityRequest | null {
  if (!snapshot) {
    return null;
  }

  return (
    snapshot.activeRequests.find((request) => request.requestId === requestId) ?? null
  );
}

function normalizeReason(
  text: string | undefined,
  fallback: string,
  limit: number
): string {
  const condensed = (text ?? "").replace(/\s+/g, " ").trim().replace(/[ ,.;:!?]+$/g, "");
  if (!condensed) {
    return fallback;
  }
  if (condensed.length <= limit) {
    return condensed;
  }
  return `${condensed.slice(0, limit)}...`;
}

function normalizeEnglishReason(text: string | undefined): string {
  const condensed = normalizeReason(text, "an urgent medical condition", 56);
  const asciiChars = [...condensed].filter((char) => char.charCodeAt(0) < 128).length;
  const asciiRatio = condensed.length > 0 ? asciiChars / condensed.length : 0;
  if (asciiRatio >= 0.65) {
    return condensed;
  }
  return "an urgent medical condition";
}

function buildSpeechTexts(
  message: BackendRoomEvent,
  snapshot: QueueSnapshot | null
): string[] {
  if (message.type === "call.started" || message.type === "call.recalled") {
    const ticket = findTicket(snapshot, message.payload.currentCall.ticketNo);
    const zhName = ticket?.patient.name ?? message.payload.currentCall.displayName;
    const enName =
      ticket?.patient.englishNameOrPinyin ?? ticket?.patient.name ?? message.payload.currentCall.displayName;
    const roomNo = message.payload.currentCall.roomNo;

    if (message.type === "call.recalled") {
      return [
        `请${message.payload.currentCall.ticketNo}号${zhName}再次前往${roomNo}诊室就诊。`,
        `Number ${message.payload.currentCall.ticketNo}, ${enName}, please proceed again to room ${roomNo}.`,
      ];
    }

    return [
      `请${message.payload.currentCall.ticketNo}号${zhName}到${roomNo}诊室就诊。`,
      `Number ${message.payload.currentCall.ticketNo}, ${enName}, please proceed to room ${roomNo}.`,
    ];
  }

  if (
    message.type === "priority.reviewed" &&
    message.payload.decision === "APPROVE" &&
    message.payload.delayedTicketNo
  ) {
    const request = findRequest(snapshot, message.payload.requestId);
    const priorityTicket = findTicket(snapshot, message.payload.ticketNo);
    const delayedTicket = findTicket(snapshot, message.payload.delayedTicketNo);
    const zhName = priorityTicket?.patient.name ?? `${message.payload.ticketNo}号患者`;
    const enName =
      priorityTicket?.patient.englishNameOrPinyin ??
      priorityTicket?.patient.name ??
      `ticket ${message.payload.ticketNo}`;
    const zhReason = normalizeReason(request?.descriptionText, "紧急情况", 22);
    const enReason = normalizeEnglishReason(request?.descriptionText);

    return [
      `候诊患者请留意，${message.payload.ticketNo}号${zhName}因${zhReason}将优先就诊，原先在前面的${message.payload.delayedTicketNo}号将顺延。请其他患者理解，如有特殊情况也可通过手机提交优先申请。`,
      `Attention please. Ticket ${message.payload.ticketNo}, ${enName}, has been approved for priority consultation due to ${enReason}. Ticket ${message.payload.delayedTicketNo} will be seen slightly later. If you have special circumstances, please submit a priority request on your phone. Thank you for your understanding.`,
    ];
  }

  return [];
}

async function synthesizeSpeechPayload(
  key: string,
  texts: string[]
): Promise<SpeechPlaybackRequest | null> {
  if (texts.length === 0) {
    return null;
  }

  const clips = await Promise.all(texts.map((text) => requestTts(text)));
  return {
    key,
    clips,
  };
}

export function useMediQueueBridge(simulateOffline: boolean, enableTts: boolean = false) {
  const [snapshot, setSnapshot] = useState<QueueSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [isBackendOffline, setIsBackendOffline] = useState(false);
  const [lastSpeech, setLastSpeech] = useState<SpeechPlaybackRequest | null>(null);

  const enableTtsRef = useRef(enableTts);
  enableTtsRef.current = enableTts;

  const bridgeRef = useRef(createBridgeState());
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const attemptsRef = useRef(0);

  const applyBackendSnapshot = useCallback((backendSnapshot: BackendSnapshot) => {
    const nextState = adaptBackendSnapshot(backendSnapshot, bridgeRef.current);
    bridgeRef.current = nextState;
    setSnapshot(nextState.snapshot);
    setIsBackendOffline(false);
    return nextState.snapshot;
  }, []);

  const refreshSnapshot = useCallback(async () => {
    const backendSnapshot = await fetchQueueSnapshot();
    return applyBackendSnapshot(backendSnapshot);
  }, [applyBackendSnapshot]);

  const requestSpeech = useCallback(
    async (message: BackendRoomEvent, currentSnapshot: QueueSnapshot | null) => {
      if (!enableTtsRef.current) {
        return;
      }

      const texts = buildSpeechTexts(message, currentSnapshot);
      if (texts.length === 0) {
        return;
      }

      try {
        const payload = await synthesizeSpeechPayload(
          `${message.type}-${message.payload.snapshotVersion}-${Date.now()}`,
          texts
        );
        if (payload) {
          setLastSpeech(payload);
        }
      } catch (error) {
        console.error("Failed to fetch TTS clips:", error);
      }
    },
    []
  );

  useEffect(() => {
    let disposed = false;
    let socket: WebSocket | null = null;

    async function loadInitialSnapshot() {
      try {
        await refreshSnapshot();
      } catch (error) {
        console.error("Failed to fetch snapshot:", error);
        if (!disposed) {
          setIsBackendOffline(true);
        }
      } finally {
        if (!disposed) {
          setLoading(false);
        }
      }
    }

    function connectSocket() {
      if (simulateOffline || disposed) {
        return;
      }

      socket = createRealtimeSocket();

      socket.onopen = () => {
        attemptsRef.current = 0;
        setIsBackendOffline(false);
      };

      socket.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          if (!isRoomEvent(message)) {
            return;
          }

          void requestSpeech(message, bridgeRef.current.snapshot);

          if (isSnapshotEvent(message)) {
            applyBackendSnapshot(message.payload);
            return;
          }

          if (message.type === "call.skipped") {
            bridgeRef.current = markSkippedCurrentCall(
              message.payload.ticketNo,
              bridgeRef.current
            );
          }
        } catch (error) {
          console.error("Failed to parse room event:", error);
        }
      };

      socket.onerror = () => {
        setIsBackendOffline(true);
      };

      socket.onclose = () => {
        if (simulateOffline || disposed) {
          return;
        }
        setIsBackendOffline(true);
        attemptsRef.current += 1;
        const delay = Math.min(1000 * 2 ** (attemptsRef.current - 1), 10000);
        reconnectTimerRef.current = setTimeout(connectSocket, delay);
      };
    }

    void loadInitialSnapshot();

    if (!simulateOffline) {
      connectSocket();
    } else {
      setIsBackendOffline(true);
    }

    return () => {
      disposed = true;
      if (reconnectTimerRef.current) {
        clearTimeout(reconnectTimerRef.current);
      }
      if (socket) {
        socket.close();
      }
    };
  }, [applyBackendSnapshot, refreshSnapshot, requestSpeech, simulateOffline]);

  const applySnapshotResponse = useCallback(
    (backendSnapshot: BackendSnapshot) => {
      return applyBackendSnapshot(backendSnapshot);
    },
    [applyBackendSnapshot]
  );

  const handleCallNext = useCallback(async () => {
    const backendSnapshot = await callNext(bridgeRef.current.backendSnapshotVersion);
    applySnapshotResponse(backendSnapshot);
  }, [applySnapshotResponse]);

  const handleRecall = useCallback(async () => {
    await recallCurrent(bridgeRef.current.backendSnapshotVersion);
  }, []);

  const handleSkipCurrent = useCallback(async () => {
    const ticketNo = bridgeRef.current.snapshot?.currentCall?.ticketNo;
    if (!ticketNo) {
      throw new Error("There is no currently called patient to skip.");
    }
    const backendSnapshot = await skipCurrent(
      ticketNo,
      bridgeRef.current.backendSnapshotVersion
    );
    applySnapshotResponse(backendSnapshot);
  }, [applySnapshotResponse]);

  const handlePauseCalls = useCallback(async () => {
    const backendSnapshot = await pauseCalls(
      bridgeRef.current.backendSnapshotVersion
    );
    applySnapshotResponse(backendSnapshot);
  }, [applySnapshotResponse]);

  const handleResumeCalls = useCallback(async () => {
    const backendSnapshot = await resumeCalls(
      bridgeRef.current.backendSnapshotVersion
    );
    applySnapshotResponse(backendSnapshot);
  }, [applySnapshotResponse]);

  const handleApplyPriority = useCallback(
    async (ticketNo: string, descriptionText: string) => {
      const request = await createPriorityRequest(ticketNo, descriptionText);
      await refreshSnapshot();
      return {
        success: true,
        request: toFrontendRequest(request),
      };
    },
    [refreshSnapshot]
  );

  const handleReviewRequest = useCallback(
    async (requestId: string, decision: "APPROVE" | "REJECT") => {
      await reviewPriorityRequest(
        requestId,
        decision,
        bridgeRef.current.backendSnapshotVersion
      );
      await refreshSnapshot();
    },
    [refreshSnapshot]
  );

  const handleResetQueue = useCallback(async () => {
    const backendSnapshot = await resetQueue();
    bridgeRef.current = createBridgeState();
    applySnapshotResponse(backendSnapshot);
  }, [applySnapshotResponse]);

  return {
    snapshot,
    loading,
    isBackendOffline,
    lastSpeech,
    refreshSnapshot,
    callNext: handleCallNext,
    recallCurrent: handleRecall,
    skipCurrent: handleSkipCurrent,
    pauseCalls: handlePauseCalls,
    resumeCalls: handleResumeCalls,
    applyPriority: handleApplyPriority,
    reviewRequest: handleReviewRequest,
    resetQueue: handleResetQueue,
  };
}
