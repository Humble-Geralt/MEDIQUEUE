import React, { useState, useEffect } from 'react';
import { QueueSnapshot, QueueTicket } from '../types';
import { Tv, Volume2, Users, AlertTriangle, MessageSquare, ShieldAlert } from 'lucide-react';

export function renderDesensitizedName(name: string, gender: 'M' | 'F') {
  if (!name) return '';
  const suffix = gender === 'M' ? '先生' : '女士';
  
  if (name.toLowerCase().includes('david') || name.toLowerCase().includes('smith')) {
    return 'Mr. David S. (外宾)';
  }

  if (name.length <= 1) {
    return name + ' ' + suffix;
  } else if (name.length === 2) {
    return name[0] + 'X ' + suffix;
  } else {
    return name[0] + 'X' + name.slice(2) + ' ' + suffix;
  }
}

interface TVDisplayProps {
  snapshot: QueueSnapshot;
  isOffline: boolean;
  language: 'zh' | 'en';
  standalone?: boolean;
}

export function TVDisplay({
  snapshot,
  isOffline,
  language,
  standalone = false,
}: TVDisplayProps) {
  const [tickerIndex, setTickerIndex] = useState(0);

  // 公告轮播计时器
  useEffect(() => {
    const interval = setInterval(() => {
      setTickerIndex(prev => (prev + 1) % 2);
    }, 4500);
    return () => clearInterval(interval);
  }, []);

  const queueTop5 = snapshot.waitingList.slice(0, 5);

  return (
    <div
      className={`bg-[#FAF8F5] text-slate-800 flex flex-col h-full justify-between relative overflow-hidden font-sans ${
        standalone
          ? 'min-h-screen rounded-none border-0 shadow-none p-6'
          : 'min-h-[520px] rounded-3xl p-6 shadow-xl border border-stone-200'
      }`}
    >
      
      {/* 顶部广播电视台风格栏 - 稳定的医疗广播公告板 */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between border-b-2 border-stone-200 pb-4 mb-4 gap-2">
        <div className="flex items-center space-x-3">
          <span className="text-lg font-black text-slate-900 flex flex-col sm:flex-row sm:items-baseline sm:gap-2">
            <span>候诊广播电子大屏幕</span>
            <span className="text-xs text-slate-500 font-bold font-mono">Waiting Zone Live Display</span>
          </span>
        </div>
        <div className="flex items-center space-x-3">
          {isOffline ? (
            <span className="text-xs font-bold bg-rose-50 text-rose-600 border border-rose-200 px-3.5 py-1.5 rounded-xl flex items-center gap-1.5 animate-pulse">
              <ShieldAlert className="h-3.5 w-3.5" />
              <span>{language === 'zh' ? '离线降级状态 / Offline State' : 'Offline State'}</span>
            </span>
          ) : snapshot.isPaused ? (
            <span className="text-xs font-bold bg-amber-50 text-amber-600 border border-amber-200 px-3.5 py-1.5 rounded-xl flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
              <span>后台暂停叫号 / Calling Paused</span>
            </span>
          ) : (
            <span className="text-xs font-bold bg-[#22B8A7]/10 text-[#14907F] border border-[#22B8A7]/20 px-3.5 py-1.5 rounded-xl flex items-center gap-1.5">
              <span className="h-2 w-2 rounded-full bg-[#22B8A7] animate-ping" />
              <span>正常叫号中 / Broadcasting Active</span>
            </span>
          )}
        </div>
      </div>

      {isOffline && (
        <div className="bg-rose-50 border border-rose-200 text-rose-800 rounded-2xl p-4 mb-2 text-xs font-bold flex items-start space-x-3 shadow-xs animate-pulse">
          <AlertTriangle className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="font-extrabold text-[#991B1B] flex items-center">
              <span>{language === 'zh' ? '📢 候诊大屏已切换到本地缓存模式' : '📢 Broadcast Screen in Standalone Cache'}</span>
            </h4>
            <p className="text-stone-550 font-medium leading-relaxed">
              {language === 'zh' 
                ? '电子叫号系统检测到服务器网络不稳定，当前显示可能存在刷新延迟。请现场候诊患者无需慌张，并向分诊台或护士核对您的实际排队动态。' 
                : 'Connection compromised. Display is running on standard local persistence. Please verify your active position with staff if needed.'}
            </p>
          </div>
        </div>
      )}

      {/* 核心叫号高亮卡片 (交付物 B3: 远距离超大字体显示) - Dynamic pulsing layout */}
      <div className="flex-1 flex flex-col items-center justify-center py-8 px-6 bg-white rounded-2xl border border-stone-200 shadow-sm relative z-10 my-4">
        {snapshot.currentCall ? (
          <div className="text-center w-full space-y-4">
            <span className="inline-flex items-center text-xs tracking-widest font-black text-[#2EBD85] uppercase bg-[#2EBD85]/10 px-4 py-1.5 rounded-full border border-[#2EBD85]/25 shadow-sm animate-pulse gap-1">
              <Volume2 className="h-4 w-4 mr-1 text-[#2EBD85]" />
              <span>🔊 请以下号码患者立即到诊 / PLEASE PROCEED IMMEDIATELY</span>
            </span>
            
            {/* 超大叫号号码 - 华贵温暖金色，高对比远距极强可读 */}
            <div className="text-[100px] sm:text-[130px] font-black tracking-tighter text-[#F4B740] font-sans leading-none select-none drop-shadow-xs animate-pulse">
              {snapshot.currentCall.ticketNo}
            </div>

            {/* 患者中文脱敏名 + 中英诊室提示 */}
            <div className="space-y-3 mt-4">
              <div className="text-4xl sm:text-5xl font-black text-slate-800 px-7 py-3 bg-slate-50 rounded-2xl border border-stone-200 inline-block my-2">
                {renderDesensitizedName(snapshot.currentCall.patient.name, snapshot.currentCall.patient.gender)}
              </div>
              <p className="text-2xl font-black tracking-tight text-[#22B8A7]">
                请前往 101 专家诊室 就诊 / Proceed to Specialist Room 101
              </p>
              <p className="text-xs sm:text-sm font-semibold text-slate-500 tracking-wider font-mono max-w-xl mx-auto uppercase">
                Patient {snapshot.currentCall.patient.englishNameOrPinyin}, please proceed to Room 101 immediately
              </p>
            </div>
          </div>
        ) : (
          <div className="text-center py-16 space-y-3">
            <div className="text-6xl font-black text-slate-405 font-mono tracking-widest animate-pulse">
              STANDBY
            </div>
            <p className="text-slate-500 font-semibold text-sm sm:text-base leading-relaxed">
              正在等待呼叫中，请您安坐等候...
              <span className="text-xs text-slate-400 font-mono block mt-1">Ready for next call, please wait...</span>
            </p>
          </div>
        )}
      </div>

      {/* 下方等候排队情况 (等候队列前 5 位) */}
      <div className="bg-white rounded-2xl p-4 border border-stone-200 shadow-sm">
        <div className="flex items-center justify-between border-b border-stone-150 pb-2.5 mb-3">
          <span className="text-xs font-black tracking-widest text-[#22B8A7] flex items-center uppercase">
            <Users className="h-4.5 w-4.5 mr-2" />
            后续候诊顺序队列 (前五位) / Next Up On Queue (Top 5)
          </span>
          <span className="text-xs font-semibold text-slate-500">
            {snapshot.waitingList.length} 人在等候区 / {snapshot.waitingList.length} Waiting
          </span>
        </div>
        
        {queueTop5.length === 0 ? (
          <div className="py-4 text-center text-xs text-slate-450 italic leading-relaxed">
            当前无等待排队患者，请在导诊处登记 <br />
            <span className="text-[10px] text-slate-400 block mt-1">No patients currently waiting in line.</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
            {queueTop5.map((t, idx) => (
              <div
                key={t.ticketNo}
                className={`p-3 rounded-xl border text-center transition-all ${
                  t.priorityLevel === 'APPROVED'
                    ? 'bg-[#E25555]/10 border-[#E25555]/30 text-slate-800 shadow-md animate-pulse'
                    : 'bg-slate-50 border-stone-150 text-slate-700'
                }`}
              >
                <div className="text-[9px] font-bold text-slate-500 uppercase leading-none">
                  {idx === 0 ? 'NEXT / 即将就诊' : `WAIT / 第 ${idx + 1} 位`}
                </div>
                <div className="text-2xl font-black mt-1.5 tracking-wider text-[#22B8A7]">
                  {t.ticketNo}
                </div>
                <div className="text-xs font-bold text-slate-700 mt-1 truncate">
                  {renderDesensitizedName(t.patient.name, t.patient.gender).split(' ')[0]}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* TV大屏滚动尾部公告栏 & 断网降级安抚内容 */}
      <div className="mt-4 border-t border-stone-200 pt-3.5 flex items-center justify-between text-xs gap-3">
        <div className="bg-stone-100 border border-stone-200 px-3 py-1.5 flex items-center rounded-lg text-slate-700 select-none font-bold">
          <Volume2 className="h-3.5 w-3.5 mr-1.5 text-[#22B8A7]" />
          <span className="font-black uppercase tracking-wider text-[10px]">滚动公告 / TICKER</span>
        </div>
        <div className="flex-1 overflow-hidden relative h-5 text-xs font-medium text-slate-650">
          {isOffline ? (
            <div className="text-[#E25555] font-black whitespace-nowrap animate-pulse flex items-center justify-center">
              <AlertTriangle className="h-4 w-4 inline mr-1 text-[#E25555]" />
              {tickerIndex === 0 ? (
                <span>【紧急播报】当前医院分诊 system 处于备份离线状态，各级叫号将进入人工线下导引！</span>
              ) : (
                <span>【Offline】Paging network down. Please follow staff's physical backup queue guidelines.</span>
              )}
            </div>
          ) : (
            <div className="text-slate-600 flex items-center justify-center whitespace-nowrap font-medium">
              {tickerIndex === 0 ? (
                <span>为胸痛、晕厥、发热急痛等重症患者提供智能绿色通道，可在手机一键提交分诊加急。</span>
              ) : (
                <span>For rapid pain, trauma or fainting, submit your priority requests via Patient H5.</span>
              )}
            </div>
          )}
        </div>
        <div className="hidden sm:block text-[10px] font-bold text-slate-400 uppercase tracking-widest">
          Intelligent Signal Cast
        </div>
      </div>
    </div>
  );
}
