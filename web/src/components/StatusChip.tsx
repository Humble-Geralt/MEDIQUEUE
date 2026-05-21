import React from 'react';
import { QueueTicketStatus, QueuePriorityLevel } from '../types';

interface StatusChipProps {
  status: QueueTicketStatus | QueuePriorityLevel;
}

export function StatusChip({ status }: StatusChipProps) {
  let classes = '';
  let label: string = status;

  switch (status) {
    case 'WAITING':
      classes = 'bg-[#22B8A7]/15 text-[#14907F] border border-[#22B8A7]/20';
      label = '等候中 / Waiting';
      break;
    case 'CALLED':
      classes = 'bg-[#F4B740]/20 text-[#D99214] border border-[#F4B740]/30 font-extrabold animate-pulse';
      label = '叫号中 / Called';
      break;
    case 'SKIPPED':
      classes = 'bg-[#465468]/15 text-[#465468] border border-[#465468]/20';
      label = '已跳过 / Skipped';
      break;
    case 'COMPLETED':
      classes = 'bg-[#2EBD85]/15 text-[#2EBD85] border border-[#2EBD85]/20';
      label = '已诊完 / Completed';
      break;
    case 'NORMAL':
      classes = 'bg-[#E9EEF4] text-[#465468] border border-[#E9EEF4]';
      label = '普通 / Normal';
      break;
    case 'REVIEWING':
      classes = 'bg-[#4A90E2]/15 text-[#4A90E2] border border-[#4A90E2]/20 font-bold';
      label = 'AI初筛中 / Reviewing';
      break;
    case 'APPROVED':
      classes = 'bg-[#E25555]/15 text-[#E25555] border border-[#E25555]/20 font-bold';
      label = '已通过 / Approved';
      break;
    case 'REJECTED':
      classes = 'bg-[#465468]/10 text-[#465468]/60 border border-[#465468]/15 line-through';
      label = '已驳回 / Rejected';
      break;
  }

  return (
    <span className={`inline-flex items-center px-3 py-1.5 rounded-full text-xs font-bold leading-none select-none tracking-wide ${classes}`}>
      {label}
    </span>
  );
}
