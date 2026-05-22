import React, { useEffect, useState } from 'react';
import {
  Award,
  HeartHandshake,
  Languages,
  LayoutGrid,
  MonitorPlay,
  RefreshCw,
  Smartphone,
  Users,
  Wifi,
  WifiOff,
} from 'lucide-react';
import { TVDisplay } from './display/TVDisplay';
import { DoctorRoom } from './doctor/DoctorRoom';
import { useMediQueueBridge } from './hooks/useMediQueueBridge';
import { PatientMobile } from './patient/PatientMobile';
import { playTtsAnnouncements, stopTtsAnnouncements } from './utils/tts';

type ViewMode = 'sandbox' | 'doctor' | 'tv' | 'mobile';

function resolveInitialView(): ViewMode {
  const params = new URLSearchParams(window.location.search);
  const queryView = params.get('view');
  if (
    queryView === 'sandbox' ||
    queryView === 'doctor' ||
    queryView === 'tv' ||
    queryView === 'mobile'
  ) {
    return queryView;
  }

  const defaultView = (import.meta as any).env?.VITE_DEFAULT_VIEW;
  if (
    defaultView === 'sandbox' ||
    defaultView === 'doctor' ||
    defaultView === 'tv' ||
    defaultView === 'mobile'
  ) {
    return defaultView;
  }

  return 'sandbox';
}

export default function App() {
  const [entryViewMode] = useState<ViewMode>(resolveInitialView);
  const [simulateOffline, setSimulateOffline] = useState(false);
  const [viewMode, setViewMode] = useState<ViewMode>(entryViewMode);
  const [language, setLanguage] = useState<'zh' | 'en'>('zh');

  const bridge = useMediQueueBridge(simulateOffline, viewMode === 'tv' || viewMode === 'sandbox');
  const snapshot = bridge.snapshot;
  const loading = bridge.loading;
  const isOffline = simulateOffline || bridge.isBackendOffline;
  const isStandaloneView = viewMode !== 'sandbox';

  const buildStandaloneViewUrl = (targetView: Exclude<ViewMode, 'sandbox'>) => {
    const url = new URL(window.location.href);
    url.searchParams.set('view', targetView);
    return url.toString();
  };

  useEffect(() => {
    if (!bridge.lastSpeech) {
      return;
    }
    void playTtsAnnouncements(bridge.lastSpeech.clips);
  }, [bridge.lastSpeech]);

  useEffect(() => {
    if (viewMode !== 'tv' && viewMode !== 'sandbox') {
      stopTtsAnnouncements();
    }
  }, [viewMode]);

  const handleCallNext = async () => {
    try {
      await bridge.callNext();
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Call next failed');
    }
  };

  const handleRecall = async () => {
    try {
      await bridge.recallCurrent();
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Recall failed');
    }
  };

  const handleSkipCurrent = async () => {
    try {
      await bridge.skipCurrent();
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Skip failed');
    }
  };

  const handlePauseCalls = async () => {
    try {
      await bridge.pauseCalls();
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Pause failed');
    }
  };

  const handleResumeCalls = async () => {
    try {
      await bridge.resumeCalls();
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Resume failed');
    }
  };

  const handleApplyPriority = async (ticketNo: string, descriptionText: string) => {
    return bridge.applyPriority(ticketNo, descriptionText);
  };

  const handleReviewRequest = async (requestId: string, decision: 'APPROVE' | 'REJECT') => {
    try {
      await bridge.reviewRequest(requestId, decision);
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Review failed');
    }
  };

  const handleResetQueue = async () => {
    try {
      await bridge.resetQueue();
      alert(language === 'zh' ? '候诊队列已重置，可以重新开始演示。' : 'Demo queue has been reset.');
    } catch (error) {
      alert(error instanceof Error ? error.message : 'Reset failed');
    }
  };

  if (loading || !snapshot) {
    return (
      <div className="min-h-screen bg-[#FAF8F5] flex items-center justify-center text-stone-600 font-sans flex-col space-y-4 p-6 select-none">
        <RefreshCw className="h-10 w-10 text-emerald-600 animate-spin" />
        <span className="text-sm font-black tracking-widest text-[#2E7D32]">
          {language === 'zh' ? '正在连接 FastAPI 候诊服务...' : 'Connecting to FastAPI queue service...'}
        </span>
        <span className="text-xs text-stone-400 max-w-sm text-center">
          {language === 'zh'
            ? '前端将直接读取真实后端队列与实时事件，请稍候。'
            : 'The frontend is loading live queue data and realtime events from the backend.'}
        </span>
      </div>
    );
  }

  const doctorView = (
    <DoctorRoom
      snapshot={snapshot}
      isOffline={isOffline}
      language={language}
      standalone={isStandaloneView}
      onCallNext={handleCallNext}
      onRecall={handleRecall}
      onSkipCurrent={handleSkipCurrent}
      onPauseCalls={handlePauseCalls}
      onResumeCalls={handleResumeCalls}
      onReviewRequest={handleReviewRequest}
    />
  );

  const tvView = (
    <TVDisplay
      snapshot={snapshot}
      isOffline={isOffline}
      language={language}
      standalone={isStandaloneView}
    />
  );

  const mobileView = (
    <PatientMobile
      snapshot={snapshot}
      isOffline={isOffline}
      language={language}
      standalone={isStandaloneView}
      onApplyPriority={handleApplyPriority}
    />
  );

  if (isStandaloneView) {
    if (viewMode === 'doctor') {
      return <div className="min-h-screen bg-[#FDFBF9]">{doctorView}</div>;
    }

    if (viewMode === 'tv') {
      return <div className="min-h-screen bg-[#FDFBF9]">{tvView}</div>;
    }

    return <div className="min-h-screen bg-stone-900">{mobileView}</div>;
  }

  return (
    <div className="min-h-screen bg-[#FDFBF9] border-t-4 border-emerald-600 text-[#433F3B] flex flex-col font-sans select-none antialiased selection:bg-emerald-100">
      <header className="bg-white border-b border-stone-200/80 px-6 py-4 flex flex-wrap gap-4 items-center justify-between z-50 sticky top-0 shadow-sm backdrop-blur">
        <div className="flex items-center space-x-3">
          <div className="bg-gradient-to-tr from-[#388E3C] to-[#4CAF50] p-2.5 rounded-2xl text-white shadow-md shadow-emerald-500/10">
            <HeartHandshake className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tight text-emerald-800">MediQueue</h1>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="inline-flex rounded-xl bg-white border border-stone-200 p-1 shadow-xxs">
            <a
              href={buildStandaloneViewUrl('doctor')}
              target="_blank"
              rel="noreferrer"
              className="px-3 py-1 text-xs font-bold rounded-lg flex items-center cursor-pointer text-stone-600 hover:bg-emerald-50 hover:text-emerald-700"
            >
              <Users className="h-3.5 w-3.5 mr-1" />
              {language === 'zh' ? '医生端' : 'Doctor'}
            </a>
            <a
              href={buildStandaloneViewUrl('tv')}
              target="_blank"
              rel="noreferrer"
              className="px-3 py-1 text-xs font-bold rounded-lg flex items-center cursor-pointer text-stone-600 hover:bg-emerald-50 hover:text-emerald-700"
            >
              <MonitorPlay className="h-3.5 w-3.5 mr-1" />
              {language === 'zh' ? '大屏端' : 'TV'}
            </a>
            <a
              href={buildStandaloneViewUrl('mobile')}
              target="_blank"
              rel="noreferrer"
              className="px-3 py-1 text-xs font-bold rounded-lg flex items-center cursor-pointer text-stone-600 hover:bg-emerald-50 hover:text-emerald-700"
            >
              <Smartphone className="h-3.5 w-3.5 mr-1" />
              {language === 'zh' ? '患者端' : 'Mobile'}
            </a>
          </div>

          <div className="inline-flex rounded-xl bg-stone-100 border border-stone-200 p-1">
            <button
              onClick={() => setLanguage('zh')}
              className={`px-3 py-1 text-xs font-bold rounded-lg flex items-center cursor-pointer ${
                language === 'zh' ? 'bg-emerald-600 text-white shadow-sm' : 'text-stone-500 hover:text-stone-800'
              }`}
            >
              <Languages className="h-3.5 w-3.5 mr-1" /> 中文
            </button>
            <button
              onClick={() => setLanguage('en')}
              className={`px-3 py-1 text-xs font-bold rounded-lg flex items-center cursor-pointer ${
                language === 'en' ? 'bg-emerald-600 text-white shadow-sm' : 'text-stone-500 hover:text-stone-800'
              }`}
            >
              EN
            </button>
          </div>

          <button
            onClick={() => setSimulateOffline(!simulateOffline)}
            className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center transition-all cursor-pointer ${
              simulateOffline
                ? 'bg-rose-50 border-rose-200 text-rose-700 animate-pulse'
                : 'bg-white border-stone-200 text-stone-600 hover:bg-stone-50'
            }`}
          >
            {isOffline ? (
              <>
                <WifiOff className="h-3.5 w-3.5 mr-1 text-rose-600" />
                {language === 'zh' ? '离线模拟已开启' : 'Offline simulation on'}
              </>
            ) : (
              <>
                <Wifi className="h-3.5 w-3.5 mr-1 text-emerald-600" />
                {language === 'zh' ? '实时后端已连接' : 'Backend connected'}
              </>
            )}
          </button>

          <button
            onClick={handleResetQueue}
            className="px-3 py-1.5 bg-white border border-stone-200 text-xs font-bold rounded-xl hover:bg-stone-50 text-stone-650 flex items-center shadow-xxs cursor-pointer"
          >
            <RefreshCw className="h-3.5 w-3.5 mr-1 text-emerald-600" />
            {language === 'zh' ? '重置演示队列' : 'Reset Demo'}
          </button>
        </div>
      </header>

      <main className="flex-1 p-6 max-w-7xl mx-auto w-full">
        <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-start">
          <div className="xl:col-span-4 flex justify-center z-20 xl:sticky xl:top-28">
            {mobileView}
          </div>

          <div className="xl:col-span-8 flex flex-col space-y-6">
            {doctorView}
            {tvView}
          </div>
        </div>
      </main>

      <footer className="bg-white border-t border-stone-200/80 px-6 py-4 mt-auto text-xs text-stone-500 text-center">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>© 2026 MediQueue. Clinic intelligent queue and triage system.</p>
          <div className="flex items-center space-x-2 font-mono">
            <span className={`h-2 w-2 rounded-full ${isOffline ? 'bg-rose-500' : 'bg-emerald-500 animate-pulse'}`} />
            <span>{isOffline ? '[FASTAPI DEGRADED / SIMULATED OFFLINE]' : '[FASTAPI LIVE CONNECTION ACTIVE]'}</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
