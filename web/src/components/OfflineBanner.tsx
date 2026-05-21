import React from 'react';
import { WifiOff, AlertTriangle } from 'lucide-react';

interface OfflineBannerProps {
  isOffline: boolean;
  language: 'zh' | 'en';
}

export function OfflineBanner({ isOffline, language }: OfflineBannerProps) {
  if (!isOffline) return null;

  return (
    <div className="bg-gradient-to-r from-red-600 to-amber-600 text-white px-4 py-3 shadow-md flex items-center justify-between animate-pulse">
      <div className="flex items-center space-x-3 mx-auto">
        <WifiOff className="h-6 w-6 text-white animate-bounce" />
        <div className="text-sm font-medium">
          {language === 'zh' ? (
            <span>
              <strong>网络连接异常 • 离线降级状态</strong> — 当前显示的是断网前最后缓存队列状况。如有问题请不要紧张，听从现场工作人员或护士指引。
            </span>
          ) : (
            <span>
              <strong>Network Error • Offline Mode</strong> — Displaying cached queue status. The queue system is temporarily offline, please stay calm and follow the staff instructions.
            </span>
          )}
        </div>
        <AlertTriangle className="h-4 w-4 text-amber-200" />
      </div>
    </div>
  );
}
