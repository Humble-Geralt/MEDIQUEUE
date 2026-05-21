import React, { useState } from 'react';
import { QueueSnapshot, QueueTicket, PriorityRequest } from '../types';
import { StatusChip } from '../components/StatusChip';
import { 
  Users, AlertTriangle, Play, Pause, FastForward, CheckCircle, XCircle, Brain, RefreshCw, Volume2, ShieldAlert
} from 'lucide-react';

interface DoctorRoomProps {
  snapshot: QueueSnapshot;
  isOffline: boolean;
  language: 'zh' | 'en';
  standalone?: boolean;
  onCallNext: () => void;
  onRecall: () => void;
  onSkipCurrent: () => void;
  onPauseCalls: () => void;
  onResumeCalls: () => void;
  onReviewRequest: (requestId: string, decision: 'APPROVE' | 'REJECT') => void;
}

export function DoctorRoom({
  snapshot,
  isOffline,
  language,
  standalone = false,
  onCallNext,
  onRecall,
  onSkipCurrent,
  onPauseCalls,
  onResumeCalls,
  onReviewRequest,
}: DoctorRoomProps) {
  const pendingRequests = snapshot.activeRequests.filter(r => r.reviewStatus === 'PENDING');
  const sizeWaiting = snapshot.waitingList.length;

  return (
    <div
      className={`bg-[#FAF8F5] text-slate-800 flex flex-col h-full font-sans ${
        standalone
          ? 'min-h-screen rounded-none border-0 shadow-none p-6'
          : 'rounded-3xl p-6 shadow-xl border border-stone-200'
      }`}
    >
      {/* 顶部标题栏 - 稳定的医疗控制面板风格 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b border-stone-200 pb-4 mb-4 gap-2">
        <div>
          <span className="text-xs font-black tracking-widest text-[#22B8A7] uppercase">
            {language === 'zh' ? '🖥️ 医生诊疗工作台 • 101专家诊室' : '🖥️ Clinical Workspace • Room 101'}
          </span>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight mt-0.5">
            {language === 'zh' ? '赵主任专家诊室 (心内科)' : 'Dr. Zhao Expert Room (Cardiology)'}
          </h2>
        </div>
        <div className="flex items-center space-x-2">
          {snapshot.isPaused ? (
            <span className="inline-flex items-center px-3.5 py-1.5 rounded-xl text-xs font-bold bg-[#4A90E2]/10 text-[#4A90E2] border border-[#4A90E2]/30 animate-pulse">
              <Pause className="h-3.5 w-3.5 mr-1" />
              {language === 'zh' ? '等候叫号暂停中' : 'Calling Paused'}
            </span>
          ) : (
            <span className="inline-flex items-center px-3.5 py-1.5 rounded-xl text-xs font-bold bg-[#22B8A7]/10 text-[#22B8A7] border border-[#22B8A7]/25">
              <span className="h-2 w-2 rounded-full bg-[#22B8A7] mr-2 animate-ping" />
              {language === 'zh' ? '门诊开诊中' : 'Console Active'}
            </span>
          )}
        </div>
      </div>

      {isOffline && (
        <div className="bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl p-4 mb-4 text-xs font-bold flex items-start space-x-3 shadow-xs animate-pulse">
          <ShieldAlert className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="font-extrabold text-[#991B1B] flex items-center">
              <span>{language === 'zh' ? '⚠️ 诊室网络服务异常 • 离线降级托管中' : '⚠️ Offline Mitigation Active'}</span>
            </h4>
            <p className="text-stone-550 font-medium leading-relaxed">
              {language === 'zh' 
                ? '检测到实时叫号网络通讯中断（已启用本地降级缓存）。当前叫号控制已被锁定，为防止重号冲突，请医护人员暂时采用人工口头叫号辅助。' 
                : 'Real-time WebSocket connection to server has degraded. Calling controls are locked; please utilize offline manual calling guides to prevent scheduling conflicts.'}
            </p>
          </div>
        </div>
      )}

      {/* 核心卡片统计与快速按钮 */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
        {/* 当前呼叫大卡片 - Highest signal density */}
        <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-stone-200 shadow-sm flex flex-col justify-between relative overflow-hidden">
          <div className="absolute top-0 right-0 p-3 bg-[#F4B740]/15 text-[#D97706] font-black text-xs rounded-bl-xl border-l border-b border-stone-150 tracking-wider">
            {language === 'zh' ? '当前就诊人' : 'Active Patient'}
          </div>
          <div>
            <span className="text-xs text-slate-500 font-extrabold uppercase tracking-widest block mb-2">{language === 'zh' ? '当前就诊号码 / 患者姓名' : 'Ticket No. & Patient Name'}</span>
            {snapshot.currentCall ? (
              <div className="mt-1 flex items-baseline flex-wrap gap-x-5 gap-y-1">
                <span className="text-6xl font-black text-[#F4B740] tracking-tight font-sans select-all">
                  {snapshot.currentCall.ticketNo}
                </span>
                <span className="text-3xl font-black text-slate-900 ml-2">
                  {snapshot.currentCall.patient.name}
                </span>
                <span className="text-sm font-bold text-slate-500 ml-1">
                  ({snapshot.currentCall.patient.englishNameOrPinyin} • {snapshot.currentCall.patient.gender === 'M' ? '男' : '女'} • {snapshot.currentCall.patient.age}岁)
                </span>
              </div>
            ) : (
              <div className="mt-3 py-4 text-base text-slate-400 font-bold italic tracking-wide">
                {language === 'zh' ? '— 暂无就诊中的患者，请点击下方进行呼叫 —' : '— No Active Patient, Click Below to Call —'}
              </div>
            )}
          </div>

          {/* 状态控制按钮组 - High readability and solid clinical control */}
          <div className="mt-8 flex flex-wrap gap-3">
            <button
              id="btn-call-next"
              disabled={isOffline || snapshot.isPaused}
              onClick={onCallNext}
              className={`flex-1 min-w-[140px] inline-flex items-center justify-center px-6 py-4 border border-transparent text-sm font-black rounded-xl text-white transition-all shadow-md cursor-pointer ${
                isOffline || snapshot.isPaused
                  ? 'bg-slate-100 text-slate-400 border border-slate-200 cursor-not-allowed'
                  : 'bg-[#22B8A7] hover:bg-[#14907F] active:scale-[0.98] shadow-lg shadow-[#22B8A7]/10'
              }`}
            >
              <FastForward className="h-4.5 w-4.5 mr-2" />
              {language === 'zh' ? '呼叫下一位患者' : 'Call Next Patient'}
            </button>

            {snapshot.currentCall && (
              <button
                id="btn-call-recall"
                disabled={isOffline}
                onClick={onRecall}
                className="inline-flex items-center justify-center px-5 py-4 border border-stone-200 text-sm font-bold rounded-xl text-slate-700 bg-stone-50 hover:bg-stone-100 transition-all cursor-pointer"
                title={language === 'zh' ? '重呼当前患者' : 'Recall Current Patient'}
              >
                <Volume2 className="h-4.5 w-4.5 mr-1.5 text-[#22B8A7]" />
                {language === 'zh' ? '重新呼叫' : 'Recall'}
              </button>
            )}

            <button
              id="btn-call-skip"
              disabled={isOffline || !snapshot.currentCall}
              onClick={onSkipCurrent}
              className={`inline-flex items-center justify-center px-5 py-4 border text-sm font-bold rounded-xl transition-all cursor-pointer ${
                isOffline || !snapshot.currentCall
                  ? 'bg-stone-50 border-stone-150 text-slate-400 cursor-not-allowed'
                  : 'border-[#F4B740]/40 text-[#D97706] bg-[#F4B740]/10 hover:bg-[#F4B740]/20 active:scale-[0.98]'
              }`}
            >
              <XCircle className="h-4.5 w-4.5 mr-2" />
              {language === 'zh' ? '过号跳过' : 'Skip'}
            </button>

            {snapshot.isPaused ? (
              <button
                id="btn-call-resume"
                disabled={isOffline}
                onClick={onResumeCalls}
                className="inline-flex items-center justify-center px-5 py-4 border border-[#22B8A7]/40 text-sm font-bold rounded-xl text-[#22B8A7] bg-[#22B8A7]/10 hover:bg-[#22B8A7]/20 cursor-pointer"
              >
                <Play className="h-4.5 w-4.5 mr-1.5" />
                {language === 'zh' ? '恢复正常开诊' : 'Resume'}
              </button>
            ) : (
              <button
                id="btn-call-pause"
                disabled={isOffline}
                onClick={onPauseCalls}
                className="inline-flex items-center justify-center px-5 py-4 border border-stone-200 text-sm font-bold rounded-xl text-slate-600 bg-stone-50 hover:bg-stone-100 cursor-pointer"
              >
                <Pause className="h-4.5 w-4.5 mr-1.5 text-slate-450" />
                {language === 'zh' ? '暂停叫号' : 'Pause'}
              </button>
            )}
          </div>
        </div>

        {/* 快速数据统计卡 */}
        <div className="bg-white p-6 rounded-2xl border border-stone-200 flex flex-col justify-between shadow-sm">
          <div>
            <span className="text-xs text-slate-500 font-extrabold uppercase tracking-widest block mb-4">{language === 'zh' ? '系统运行状态看板' : 'Live Dashboard'}</span>
            <div className="space-y-4">
              <div className="flex items-center justify-between text-sm border-b border-slate-100 pb-3">
                <span className="text-slate-600 font-medium flex items-center">
                  <Users className="h-4 w-4 mr-2 text-slate-400" />
                  {language === 'zh' ? '候诊室挂号人数' : 'Total Waiting:'}
                </span>
                <span className="font-extrabold text-xl text-[#22B8A7]">{sizeWaiting} 人</span>
              </div>
              <div className="flex items-center justify-between text-sm border-b border-slate-100 pb-3">
                <span className="text-slate-600 font-medium flex items-center">
                  <ShieldAlert className="h-4 w-4 mr-2 text-[#E25555]" />
                  {language === 'zh' ? '特急绿色通道申请' : 'AI Urgent Applied:'}
                </span>
                <span className={`font-extrabold text-xl ${pendingRequests.length > 0 ? 'text-[#E25555] animate-pulse' : 'text-slate-500'}`}>
                  {pendingRequests.length} 件待审
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-slate-600 font-medium flex items-center">
                  <RefreshCw className="h-4 w-4 mr-2 text-slate-400" />
                  {language === 'zh' ? '同步数据版本' : 'Sync Version:'}
                </span>
                <span className="font-mono text-xs font-bold text-slate-650 bg-slate-50 border border-slate-150 px-2 py-1 rounded">v{snapshot.snapshotVersion}</span>
              </div>
            </div>
          </div>
          <div className="text-[10px] text-slate-400 font-extrabold mt-6 text-center border-t border-slate-100 pt-3 uppercase tracking-wider">
            Clinical Signal Control Console
          </div>
        </div>
      </div>

      {/* 侧栏联动：左等候队列，右审核 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1 overflow-hidden min-h-[320px]">
        {/* 左等候队列 */}
        <div className="bg-white rounded-2xl border border-stone-200 flex flex-col h-full max-h-[440px] shadow-sm">
          <div className="px-5 py-4 bg-slate-50 border-b border-stone-150 flex items-center justify-between rounded-t-2xl">
            <h3 className="text-sm font-black text-slate-800 flex items-center tracking-wide">
              <Users className="h-4.5 w-4.5 mr-2 text-[#22B8A7]" />
              {language === 'zh' ? '后续等候队列明细' : 'Waiting Patient list'}
            </h3>
            <span className="text-xs font-bold bg-[#22B8A7]/10 text-[#22B8A7] px-2.5 py-1 rounded-full border border-[#22B8A7]/20">
              {sizeWaiting}人等候中
            </span>
          </div>
          <div className="p-4 overflow-y-auto flex-1 space-y-2 bg-slate-50/30">
            {snapshot.waitingList.length === 0 ? (
              <div className="py-16 text-center text-slate-450 text-sm font-bold italic">
                {language === 'zh' ? '— 绝妙！当前没有等候的患者 —' : 'Queue is empty.'}
              </div>
            ) : (
              snapshot.waitingList.map((t, idx) => {
                const isApproved = t.priorityLevel === 'APPROVED';
                return (
                  <div
                    key={t.ticketNo}
                    className={`px-4 py-3 rounded-xl flex items-center justify-between text-sm border transition-all ${
                      isApproved
                        ? 'bg-[#E25555]/5 border-[#E25555]/20'
                        : 'bg-white border-stone-150 hover:border-stone-300 shadow-xxs'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <span className="font-mono font-bold text-slate-450 text-xs w-4">
                        {idx + 1}
                      </span>
                      <span className={`font-mono font-black tracking-wider text-base ${isApproved ? 'text-[#E25555]' : 'text-slate-800'}`}>
                        {t.ticketNo}
                      </span>
                      <div>
                        <div className="font-black text-slate-800">
                          {t.patient.name}
                          {isApproved && (
                            <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-[10px] font-bold bg-[#E25555]/10 text-[#E25555] border border-[#E25555]/20 animate-pulse">
                              高危插队加急
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-500 font-bold mt-0.5">
                          {t.patient.englishNameOrPinyin} ({t.patient.gender === 'M' ? '男' : '女'} • {t.patient.age}岁)
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-black text-[#22B8A7] leading-tight">
                        +{t.estimatedWaitMinutes ?? idx * 10} min
                      </div>
                      <span className="text-[10px] text-slate-400 font-bold block mt-0.5">预计等待</span>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* 右侧 AI 审核 */}
        <div className="bg-white rounded-2xl border border-stone-200 flex flex-col h-full max-h-[440px] shadow-sm">
          <div className="px-5 py-4 bg-slate-50 border-b border-stone-150 flex items-center justify-between rounded-t-2xl">
            <h3 className="text-sm font-black text-slate-800 flex items-center tracking-wide">
              <Brain className="h-4.5 w-4.5 mr-2 text-[#E25555]" />
              {language === 'zh' ? '急症AI初筛与特急插队批准' : 'AI Urgent Priority Audit'}
            </h3>
            <span className="text-xs font-black bg-[#E25555]/10 text-[#E25555] px-2.5 py-1 rounded-full border border-[#E25555]/20 animate-pulse">
              {pendingRequests.length} 件未处理
            </span>
          </div>

          <div className="p-4 overflow-y-auto flex-1 space-y-3 bg-slate-50/30">
            {pendingRequests.length === 0 ? (
              <div className="py-16 text-center text-slate-400 text-sm font-bold italic flex flex-col items-center justify-center space-y-2">
                <CheckCircle className="h-8 w-8 text-slate-300" />
                <span>{language === 'zh' ? '暂无特急重症加急申请' : 'No priority applications.'}</span>
              </div>
            ) : (
              pendingRequests.map(req => {
                const levelColor =
                  req.aiResult?.urgencyLevel === 'high'
                    ? 'text-[#E25555] bg-[#E25555]/10 border-[#E25555]/20'
                    : req.aiResult?.urgencyLevel === 'medium'
                    ? 'text-[#F4B740] bg-[#F4B740]/10 border-[#F4B740]/20'
                    : 'text-slate-500 bg-slate-100 border-slate-200';

                // Find patient details dynamically from snapshot lists
                const patient = snapshot.waitingList.find(t => t.ticketNo === req.ticketNo)?.patient || 
                                snapshot.calledHistory.find(t => t.ticketNo === req.ticketNo)?.patient || 
                                (snapshot.currentCall?.ticketNo === req.ticketNo ? snapshot.currentCall.patient : null);

                return (
                  <div
                    key={req.requestId}
                    className="p-4 bg-white rounded-xl border border-stone-250 space-y-4 hover:border-stone-400 shadow-xxs transition-all"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-2">
                        <span className="text-sm font-extrabold text-[#D97706] tracking-wider bg-amber-50 px-2.5 py-0.5 rounded border border-amber-200 font-mono">
                          {req.ticketNo}
                        </span>
                        <span className="text-sm font-black text-slate-800">
                          {patient ? patient.name : (language === 'zh' ? '未知患者' : 'Unknown Patient')}
                        </span>
                        {patient && (
                          <span className="text-[10px] text-slate-400 font-bold">
                            ({patient.gender === 'M' ? '男' : '女'} • {patient.age}岁)
                          </span>
                        )}
                      </div>
                      <span className={`inline-flex items-center px-2.5 py-1 rounded-full border text-[10px] font-black tracking-wider ${levelColor}`}>
                        AI初筛：{req.aiResult?.urgencyLevel === 'high' ? '高危极重/High' : req.aiResult?.urgencyLevel === 'medium' ? '中度警示/Medium' : '低度非急/Low'}
                      </span>
                    </div>

                    <div className="bg-slate-50 p-3.5 rounded-xl text-xs text-slate-700 border border-slate-200 relative shadow-inner">
                      <span className="absolute -top-2 left-3 bg-white px-1.5 text-[9px] font-bold text-slate-400 tracking-wider border border-slate-100 rounded">患者主诉 / Raw Complaint</span>
                      <p className="italic mt-1 text-slate-800">"{req.descriptionText}"</p>
                    </div>

                    {req.aiResult && (
                      <div className="space-y-2 text-xs text-slate-700 bg-slate-50 p-3.5 rounded-xl border border-slate-200 shadow-inner">
                        <div className="flex items-center justify-between text-[11px] border-b border-slate-150 pb-2">
                          <span className="text-slate-500">{language === 'zh' ? '医学加急指数' : 'Medical Urgency'}:</span>
                          <span className={`font-black ${req.aiResult.medicalReason ? 'text-[#2EBD85]' : 'text-[#E25555]'}`}>
                            {req.aiResult.medicalReason ? (language === 'zh' ? '高度生命急理学相关' : 'Medical context') : (language === 'zh' ? '不符合急度发热疼重' : 'Non-medical context')}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-[11px] border-b border-slate-150 pb-2">
                          <span className="text-slate-500">{language === 'zh' ? '滥权插队嫌疑风险' : 'Queue Abuse Level'}:</span>
                          <span className={`font-black ${req.aiResult.isAbuseSuspected ? 'text-[#E25555]' : 'text-[#2EBD85]'}`}>
                            {req.aiResult.isAbuseSuspected ? (language === 'zh' ? '极高 (特权滥用预警)' : '正常无恶意') : (language === 'zh' ? 'Low risk' : 'High abuse risk')}
                          </span>
                        </div>
                        <p className="text-[11px] text-[#D97706] leading-relaxed bg-[#F4B740]/5 p-3 rounded-lg border border-[#F4B740]/10 mt-1">
                          <strong className="text-[#D97706]">AI极速预审结论：</strong>{req.aiResult.explanation}
                        </p>
                      </div>
                    )}

                    {/* 控制按钮 */}
                    <div className="pt-2 flex items-center justify-end space-x-2 border-t border-slate-150">
                      <button
                        onClick={() => onReviewRequest(req.requestId, 'REJECT')}
                        className="inline-flex items-center justify-center px-4 py-2 border border-slate-200 text-xs font-bold rounded-xl text-slate-650 bg-white hover:bg-slate-50 cursor-pointer transition-colors"
                      >
                        <XCircle className="h-3.5 w-3.5 mr-1 text-[#E25555]" />
                        {language === 'zh' ? '不予优待' : 'Reject'}
                      </button>
                      <button
                        onClick={() => onReviewRequest(req.requestId, 'APPROVE')}
                        className="inline-flex items-center justify-center px-5 py-2 border border-transparent text-xs font-black rounded-xl text-white bg-[#E25555] hover:bg-[#D32F2F] cursor-pointer shadow-md shadow-[#E25555]/10 hover:scale-[1.01] transition-transform"
                      >
                        <CheckCircle className="h-3.5 w-3.5 mr-1" />
                        {language === 'zh' ? '同意优先插队' : 'Approve'}
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
