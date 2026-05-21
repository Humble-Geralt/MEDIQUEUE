import React, { useEffect, useMemo, useState } from 'react';
import { QueueSnapshot } from '../types';
import { StatusChip } from '../components/StatusChip';
import {
  Smartphone,
  CheckCircle,
  Wifi,
  WifiOff,
  Clock,
  Sparkles,
  Send,
  Volume2,
} from 'lucide-react';

interface PatientMobileProps {
  snapshot: QueueSnapshot;
  isOffline: boolean;
  language: 'zh' | 'en';
  standalone?: boolean;
  onApplyPriority: (ticketNo: string, text: string) => Promise<any>;
}

export function PatientMobile({
  snapshot,
  isOffline,
  language,
  standalone = false,
  onApplyPriority,
}: PatientMobileProps) {
  const [selectedPatientId, setSelectedPatientId] = useState<string>('');
  const [inputText, setInputText] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [submissionFeedback, setSubmissionFeedback] = useState<any>(null);
  const [showCallOverlay, setShowCallOverlay] = useState<boolean>(false);

  const patientOptions = useMemo(() => {
    const orderedTickets = [
      snapshot.currentCall,
      ...snapshot.waitingList,
      ...snapshot.calledHistory,
    ].filter(Boolean);
    const uniquePatients = new Map<string, { id: string; name: string; role: string }>();

    for (const ticket of orderedTickets) {
      if (uniquePatients.has(ticket.patient.patientId)) {
        continue;
      }

      uniquePatients.set(ticket.patient.patientId, {
        id: ticket.patient.patientId,
        name: ticket.patient.name,
        role: `${ticket.ticketNo} / ${ticket.patient.englishNameOrPinyin}`,
      });
    }

    return [...uniquePatients.values()];
  }, [snapshot.calledHistory, snapshot.currentCall, snapshot.waitingList]);

  useEffect(() => {
    if (patientOptions.length === 0) {
      return;
    }

    const preferredPatientId =
      patientOptions.find((user) => user.id === 'p_004')?.id ??
      patientOptions[0]?.id ??
      '';

    if (
      !selectedPatientId ||
      !patientOptions.some((user) => user.id === selectedPatientId)
    ) {
      setSelectedPatientId(preferredPatientId);
    }
  }, [patientOptions, selectedPatientId]);

  const myTicket =
    snapshot.waitingList.find((t) => t.patient.patientId === selectedPatientId) ||
    snapshot.calledHistory.find((t) => t.patient.patientId === selectedPatientId) ||
    (snapshot.currentCall?.patient.patientId === selectedPatientId
      ? snapshot.currentCall
      : null);

  const isForeignGuest =
    myTicket?.patient.nationality && myTicket.patient.nationality !== 'CN';
  const mobileLanguage = isForeignGuest ? 'en' : language;
  const isCurrentlyMeCalled =
    snapshot.currentCall?.patient.patientId === selectedPatientId;

  useEffect(() => {
    if (isCurrentlyMeCalled) {
      setShowCallOverlay(true);
      if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
        navigator.vibrate([300, 100, 300, 100, 300]);
      }
      return;
    }

    setShowCallOverlay(false);
    if (typeof navigator !== 'undefined' && typeof navigator.vibrate === 'function') {
      navigator.vibrate(0);
    }
  }, [isCurrentlyMeCalled, selectedPatientId]);

  let peopleAhead = 0;
  if (myTicket && myTicket.status === 'WAITING') {
    peopleAhead = snapshot.waitingList.findIndex((t) => t.ticketNo === myTicket.ticketNo);
    if (peopleAhead < 0) {
      peopleAhead = 0;
    }
  }

  const handleSubmitApply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!myTicket || isOffline || !inputText.trim() || isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    setSubmissionFeedback(null);
    try {
      const res = await onApplyPriority(myTicket.ticketNo, inputText);
      if (res?.success) {
        setSubmissionFeedback({
          success: true,
          msg:
            mobileLanguage === 'zh'
              ? '申请已提交，医生正在审核，请留意叫号与提示。'
              : 'Your request has been sent for doctor review.',
          payload: res.request,
        });
        setInputText('');
      } else {
        setSubmissionFeedback({
          success: false,
          msg:
            res?.error ||
            (mobileLanguage === 'zh' ? '提交失败，请稍后重试。' : 'Failed to submit.'),
        });
      }
    } catch (error: any) {
      setSubmissionFeedback({
        success: false,
        msg:
          error?.message ||
          (mobileLanguage === 'zh' ? '网络异常，请稍后再试。' : 'Network error.'),
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const loadPreset = (text: string) => {
    setInputText(text);
  };

  const simUsers = [
    { id: 'p4', name: '李美丽（孕 36 周 / 腹痛）', role: 'A004 / 高风险孕妇急症' },
    { id: 'p2', name: 'David Smith', role: 'A002 / English speaking patient' },
    { id: 'p3', name: '王大华（72 岁）', role: 'A003 / Elder patient' },
    { id: 'p1', name: '张自强', role: 'A001 / Standard queue' },
    { id: 'p5', name: '刘小军（儿童）', role: 'A005 / Standard queue' },
  ];

  return (
    <div className={standalone ? 'select-none w-full min-h-screen' : 'flex flex-col items-center select-none w-full max-w-[360px]'}>
      <div className={standalone ? 'hidden' : 'mb-4 bg-[#FAF8F5] p-3 rounded-2xl border border-stone-200 w-full text-xs shadow-sm'}>
        <label className="block text-stone-550 font-black mb-1.5 uppercase tracking-wider text-[10px]">
          {language === 'zh'
            ? 'Sandbox：切换不同患者身份'
            : 'Sandbox: switch patient persona'}
        </label>
        <select
          value={selectedPatientId}
          onChange={(e) => {
            setSelectedPatientId(e.target.value);
            setSubmissionFeedback(null);
            setInputText('');
          }}
          className="w-full bg-white border border-stone-200 rounded-xl p-2.5 text-stone-700 font-bold focus:outline-none focus:ring-1 focus:ring-emerald-500 cursor-pointer"
        >
          {patientOptions.map((user) => (
            <option key={user.id} value={user.id}>
              {user.role} - {user.name}
            </option>
          ))}
        </select>
      </div>

      <div className={`relative bg-stone-900 flex flex-col overflow-hidden transition-all duration-300 ${
        standalone
          ? 'w-full min-h-screen rounded-none border-0 shadow-none'
          : 'w-[360px] h-[670px] rounded-[44px] border-[10px] border-stone-800 shadow-xl'
      }`}>
        <div className={standalone ? 'hidden' : 'absolute top-0 left-1/2 transform -translate-x-1/2 w-32 h-5 bg-stone-800 rounded-b-2xl z-40 flex items-center justify-center'}>
          <div className="w-10 h-0.5 bg-stone-950 rounded-full" />
        </div>

        <div className="px-5 pt-6 pb-2 bg-[#FAF8F5] flex items-center justify-between z-30 text-[10px] font-bold text-stone-500 font-mono">
          <span>03:24 PM</span>
          <div className="flex items-center space-x-1.5">
            {isOffline ? (
              <span className="flex items-center text-rose-500 animate-pulse">
                <WifiOff className="h-3 w-3 mr-0.5" /> Offline
              </span>
            ) : (
              <span className="flex items-center text-emerald-600">
                <Wifi className="h-3 w-3 mr-0.5" /> 5G
              </span>
            )}
            <Smartphone className="h-3 w-3" />
          </div>
        </div>

        <div className="flex-1 overflow-y-auto bg-[#F5F7FA] flex flex-col p-4 relative text-[#433F3B]">
          <div className="flex items-center justify-between pb-3 border-b border-[#E9EEF4] mb-4">
            <div className="flex items-center space-x-1.5">
              <span className="h-2 w-2 rounded-full bg-[#22B8A7]" />
              <span className="text-[10px] font-black tracking-widest text-[#465468] uppercase">
                MEDIQUEUE H5 MOBILE
              </span>
            </div>
            {myTicket && (
              <span className="text-[10px] bg-[#22B8A7]/10 text-[#22B8A7] px-2.5 py-0.5 rounded-full font-bold border border-[#22B8A7]/20">
                {myTicket.ticketNo}
              </span>
            )}
          </div>

          {isOffline && (
            <div className="bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl p-3 mb-4 text-[10px] leading-relaxed font-bold flex items-start space-x-2 animate-pulse">
              <WifiOff className="h-4 w-4 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-extrabold text-[#991B1B]">
                  {mobileLanguage === 'zh'
                    ? '网络连接已断开'
                    : 'Network disconnected'}
                </p>
                <p className="text-[9px] text-stone-550 font-medium">
                  {mobileLanguage === 'zh'
                    ? '当前显示可能不是最新排队状态，请以现场工作人员通知为准。'
                    : 'The current view may be stale. Please follow the clinic staff announcements.'}
                </p>
              </div>
            </div>
          )}

          {!myTicket ? (
            <div className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-3">
              <Clock className="h-10 w-10 text-stone-300 animate-spin" />
              <p className="text-sm text-stone-400">
                {mobileLanguage === 'zh'
                  ? '暂未找到该患者的候诊状态。'
                  : 'Patient queue status is not available.'}
              </p>
            </div>
          ) : (
            <div className="space-y-4 flex-1 flex flex-col">
              <div className="bg-white p-5 rounded-[24px] border border-[#E9EEF4] shadow-xs flex flex-col items-center justify-center relative overflow-hidden">
                <div className="absolute top-0 right-0 bg-[#F5F7FA] px-3 py-1 text-[8px] font-bold rounded-bl-[16px] text-slate-500 border-l border-b border-[#E1E7EE]">
                  {mobileLanguage === 'zh' ? '本诊区排队凭证' : 'Clinical Ticket'}
                </div>

                <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-2">
                  {mobileLanguage === 'zh' ? '您的候诊票号' : 'My Ticket Number'}
                </span>

                <div className="text-[52px] font-black text-[#F4B740] tracking-tight leading-none my-2 font-sans select-none animate-pulse">
                  {myTicket.ticketNo}
                </div>

                <div className="text-sm font-extrabold text-[#111111] mt-1">
                  {myTicket.patient.name}
                </div>
                <div className="text-[10px] text-slate-400 font-bold mt-0.5">
                  {myTicket.patient.englishNameOrPinyin} - {myTicket.patient.age}
                </div>

                <div className="w-full border-t border-[#E1E7EE] pt-3 flex items-center justify-between text-xs mt-3 text-slate-600">
                  <span className="font-bold">
                    {mobileLanguage === 'zh' ? '当前状态' : 'Status'}
                  </span>
                  <StatusChip
                    status={
                      myTicket.priorityLevel === 'APPROVED'
                        ? 'APPROVED'
                        : myTicket.status
                    }
                  />
                </div>
              </div>

              {myTicket.status === 'WAITING' ? (
                <div className="bg-[#22B8A7] text-white rounded-[20px] p-4.5 shadow-sm grid grid-cols-2 gap-2 text-center relative overflow-hidden">
                  <div className="border-[#E9EEF4]/20 border-r flex flex-col justify-center py-0.5">
                    <span className="text-[9px] text-emerald-100 font-bold tracking-wider uppercase">
                      {mobileLanguage === 'zh' ? '前方等待人数' : 'PEOPLE AHEAD'}
                    </span>
                    <span id="txt-people-ahead" className="text-2xl font-black mt-1">
                      {mobileLanguage === 'zh' ? `${peopleAhead} 人` : `${peopleAhead} Pat.`}
                    </span>
                    <span className="text-[8px] text-emerald-200 font-medium">
                      {mobileLanguage === 'zh' ? '请耐心等候' : 'please wait'}
                    </span>
                  </div>
                  <div className="flex flex-col justify-center py-0.5">
                    <span className="text-[9px] text-emerald-100 font-bold tracking-wider uppercase">
                      {mobileLanguage === 'zh' ? '预计等待时长' : 'EST. WAIT'}
                    </span>
                    <span id="txt-est-wait" className="text-2xl font-black mt-1">
                      {mobileLanguage === 'zh'
                        ? `~${peopleAhead * 10} 分钟`
                        : `~${peopleAhead * 10} Mins`}
                    </span>
                    <span className="text-[8px] text-emerald-200 font-medium">
                      {mobileLanguage === 'zh' ? '约 10 分钟 / 人' : 'approx 10m / patient'}
                    </span>
                  </div>
                </div>
              ) : myTicket.status === 'CALLED' ? (
                <div className="bg-[#F4B740] text-white rounded-[20px] p-4.5 shadow-sm text-center border border-[#F4B740]/20 flex flex-col items-center justify-center animate-pulse gap-1">
                  <Volume2 className="h-6 w-6 text-white animate-bounce" />
                  <h4 className="font-black text-sm">
                    {mobileLanguage === 'zh'
                      ? '请立即前往 101 诊室'
                      : 'Please proceed to clinic 101 now'}
                  </h4>
                  <p className="text-[10px] text-amber-50 leading-relaxed font-semibold">
                    {mobileLanguage === 'zh'
                      ? '系统正在呼叫您的号码，请尽快前往诊室。'
                      : 'Your ticket is currently being called.'}
                  </p>
                </div>
              ) : (
                <div className="bg-[#E9EEF4]/60 text-slate-500 rounded-[20px] p-4 text-center border border-[#E9EEF4]">
                  <CheckCircle className="h-5 w-5 text-emerald-600 mx-auto mb-1.5" />
                  <p className="text-xs font-bold text-slate-700">
                    {myTicket.status === 'SKIPPED'
                      ? mobileLanguage === 'zh'
                        ? '您已过号，请联系分诊台处理。'
                        : 'Your ticket was skipped. Please contact the desk.'
                      : mobileLanguage === 'zh'
                        ? '本次就诊已完成，祝您早日康复。'
                        : 'Your consultation is complete. Wish you well soon.'}
                  </p>
                </div>
              )}

              {myTicket.status === 'WAITING' && (
                <div className="bg-white p-4.5 rounded-[24px] border border-[#E9EEF4] shadow-xs flex flex-col flex-1 min-h-[190px]">
                  <h4 className="text-xs font-black tracking-widest text-[#E25555] flex items-center mb-2.5">
                    <Sparkles className="h-4 w-4 mr-1 text-[#E25555] animate-pulse" />
                    {mobileLanguage === 'zh'
                      ? '急症优先申请'
                      : 'Emergency Priority Request'}
                  </h4>

                  {submissionFeedback ? (
                    <div className="p-3.5 rounded-[20px] text-center space-y-2.5 bg-[#E9EEF4]/30 border border-[#E9EEF4]">
                      <CheckCircle className="h-8 w-8 text-emerald-600 mx-auto" />
                      <p className="text-xs font-bold text-[#433F3B]">
                        {submissionFeedback.msg}
                      </p>
                      {submissionFeedback.payload?.aiResult && (
                        <div className="text-[10px] text-slate-600 leading-normal text-left bg-white p-2.5 border border-[#E9EEF4] rounded-[16px] leading-relaxed space-y-1">
                          <div>
                            <strong>
                              {mobileLanguage === 'zh'
                                ? 'AI 评估等级:'
                                : 'AI Triage Severity:'}
                            </strong>{' '}
                            <span className="font-extrabold text-[#E25555]">
                              {submissionFeedback.payload.aiResult.urgencyLevel.toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <strong>
                              {mobileLanguage === 'zh'
                                ? '初筛说明:'
                                : 'Initial Recommendation:'}
                            </strong>{' '}
                            {submissionFeedback.payload.aiResult.explanation}
                          </div>
                        </div>
                      )}
                      <button
                        onClick={() => {
                          setSubmissionFeedback(null);
                          setInputText('');
                        }}
                        className="text-[10px] font-bold text-[#14907F] border border-[#22B8A7]/30 rounded-xl px-3 py-1.5 bg-white hover:bg-stone-50 cursor-pointer w-full transition-all"
                      >
                        {mobileLanguage === 'zh' ? '返回' : 'Back'}
                      </button>
                    </div>
                  ) : (
                    <form
                      onSubmit={handleSubmitApply}
                      className="space-y-2.5 flex-1 flex flex-col justify-between"
                    >
                      <p className="text-[10px] text-slate-400 leading-relaxed font-semibold">
                        {mobileLanguage === 'zh'
                          ? '仅限胸痛、剧烈腹痛、大出血、晕厥等紧急症状使用，非医疗原因不会被优先处理。'
                          : 'Use only for urgent symptoms such as chest pain, fainting, severe bleeding, or acute pain.'}
                      </p>

                      <textarea
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        placeholder={
                          mobileLanguage === 'zh'
                            ? '请简要描述需要优先处理的紧急症状...'
                            : 'Please describe your urgent symptoms...'
                        }
                        className="w-full flex-1 p-2.5 bg-[#F5F7FA] border border-[#E9EEF4] rounded-[16px] text-xs focus:ring-1 focus:ring-[#22B8A7] focus:outline-none placeholder-stone-400 font-bold resize-none min-h-[50px] leading-relaxed"
                        maxLength={150}
                        required
                      />

                      <div className="space-y-1">
                        <span className="text-[9px] text-[#465468] block font-extrabold uppercase tracking-widest">
                          {mobileLanguage === 'zh'
                            ? 'Priority demo presets'
                            : 'Priority demo presets'}
                        </span>
                        <div className="flex flex-wrap gap-1">
                          <button
                            type="button"
                            onClick={() =>
                              loadPreset(
                                mobileLanguage === 'zh'
                                  ? '怀孕 36 周，腹痛明显并伴有出血。'
                                  : 'I am 36 weeks pregnant with heavy abdominal pain and bleeding.'
                              )
                            }
                            className="px-2.5 py-1 bg-red-50 border border-red-200 text-[9px] text-red-700 rounded-lg hover:bg-red-100 cursor-pointer font-bold"
                          >
                            {mobileLanguage === 'zh'
                              ? '孕妇出血'
                              : 'Pregnancy bleeding'}
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              loadPreset(
                                mobileLanguage === 'zh'
                                  ? '我是 VIP，想要马上看诊。'
                                  : 'I am a VIP patient and want to be seen immediately.'
                              )
                            }
                            className="px-2.5 py-1 bg-slate-100 border border-slate-200 text-[9px] text-slate-600 rounded-lg hover:bg-slate-200 cursor-pointer font-bold"
                          >
                            {mobileLanguage === 'zh'
                              ? '非医疗插队'
                              : 'Non-medical queue jump'}
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              loadPreset(
                                mobileLanguage === 'zh'
                                  ? '突然胸口发闷、出冷汗、压榨样疼痛。'
                                  : 'Suddenly feeling crushing chest pain, tightness, and cold sweating.'
                              )
                            }
                            className="px-2.5 py-1 bg-amber-50 border border-amber-200 text-[9px] text-[#D99214] rounded-lg hover:bg-amber-100 cursor-pointer font-bold"
                          >
                            {mobileLanguage === 'zh' ? '胸痛急症' : 'Chest pain'}
                          </button>
                        </div>
                      </div>

                      <button
                        type="submit"
                        disabled={isSubmitting || isOffline || !inputText.trim()}
                        className={`w-full py-2.5 rounded-xl text-xs font-black text-white flex items-center justify-center transition-colors cursor-pointer ${
                          isSubmitting || isOffline || !inputText.trim()
                            ? 'bg-stone-200 cursor-not-allowed text-stone-400'
                            : 'bg-[#22B8A7] hover:bg-[#14907F] hover:shadow'
                        }`}
                      >
                        {isSubmitting ? (
                          <span>
                            {mobileLanguage === 'zh'
                              ? '提交中...'
                              : 'Submitting...'}
                          </span>
                        ) : (
                          <>
                            <Send className="h-3.5 w-3.5 mr-1.5" />
                            {mobileLanguage === 'zh'
                              ? '提交给医生审核'
                              : 'Submit for review'}
                          </>
                        )}
                      </button>
                    </form>
                  )}
                </div>
              )}
            </div>
          )}

          <div className="mt-auto border-t border-[#E9EEF4] pt-2.5 flex items-center justify-between text-[9px] font-bold text-slate-400">
            <span>© 2026 MediQueue Calm Companion</span>
            <div className="flex items-center space-x-1">
              <span className="h-1.5 w-1.5 rounded-full bg-[#22B8A7] animate-ping" />
              <span>{isOffline ? 'OFFLINE CACHED' : 'WS SOCKET CONNECTED'}</span>
            </div>
          </div>
        </div>

        <div className={standalone ? 'hidden' : 'absolute bottom-1.5 left-1/2 transform -translate-x-1/2 w-28 h-1 bg-stone-800 rounded-full z-45'} />

        {isCurrentlyMeCalled && showCallOverlay && (
          <div
            className="absolute inset-0 bg-[#22B8A7]/98 z-55 flex flex-col items-center justify-center p-6 text-center text-white cursor-pointer"
            onClick={() => setShowCallOverlay(false)}
          >
            <div className="h-16 w-16 bg-white/20 rounded-full flex items-center justify-center animate-bounce mb-6">
              <Volume2 className="h-10 w-10 text-white animate-pulse" />
            </div>
            <div className="text-[9px] tracking-widest uppercase font-bold text-teal-100 mb-1">
              {mobileLanguage === 'zh' ? 'CALL ALERT / 叫号提醒' : 'CALL ALERT / NOW CALLING'}
            </div>
            <h2 className="text-4xl font-black mb-3">
              {mobileLanguage === 'zh' ? '到您的号了！' : "It's your turn!"}
            </h2>
            <p className="text-sm font-bold bg-white/10 px-4 py-2.5 rounded-xl border border-white/20 backdrop-blur-sm shadow mb-4">
              {mobileLanguage === 'zh'
                ? `票号：${myTicket.ticketNo}`
                : `Ticket No: ${myTicket.ticketNo}`}
            </p>
            <p className="text-xs max-w-xs leading-relaxed text-teal-100">
              {mobileLanguage === 'zh' ? (
                <>
                  请立即前往 <strong className="text-white">101 诊室</strong> 就诊。
                </>
              ) : (
                <>
                  Please proceed to <strong className="text-white">Specialist Room 101</strong>{' '}
                  immediately.
                </>
              )}
            </p>
            <span className="text-[10px] text-teal-200 mt-12 animate-pulse">
              {mobileLanguage === 'zh'
                ? '[ 点击屏幕关闭提醒 ]'
                : '[ Tap anywhere to dismiss ]'}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
