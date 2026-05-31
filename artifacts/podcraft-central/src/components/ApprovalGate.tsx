import React from 'react';
import { AlertTriangleIcon, ShieldAlertIcon, InfoIcon, CheckCircle2Icon, XIcon } from 'lucide-react';
import type { ApprovalRequest, ApprovalImpact } from '../services/ai/types';

interface Props {
  request: ApprovalRequest;
  onApprove: () => void;
  onReject: () => void;
}

const IMPACT_CONFIG: Record<ApprovalImpact, { label: string; color: string; icon: React.ElementType; approveLabel: string }> = {
  low:         { label: 'Low impact',        color: 'text-blue-600 bg-blue-50 border-blue-200',    icon: InfoIcon,         approveLabel: 'Confirm' },
  medium:      { label: 'Medium impact',     color: 'text-amber-600 bg-amber-50 border-amber-200', icon: AlertTriangleIcon, approveLabel: 'Proceed' },
  high:        { label: 'High impact',       color: 'text-orange-600 bg-orange-50 border-orange-200', icon: AlertTriangleIcon, approveLabel: 'Approve' },
  destructive: { label: 'Destructive action', color: 'text-red-600 bg-red-50 border-red-200',      icon: ShieldAlertIcon,  approveLabel: 'Yes, Approve' },
};

export function ApprovalGate({ request, onApprove, onReject }: Props) {
  const cfg = IMPACT_CONFIG[request.impact];
  const Icon = cfg.icon;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden">
        <div className={`p-5 border-b ${cfg.color.split(' ').filter(c => c.startsWith('bg-') || c.startsWith('border-')).join(' ')}`}>
          <div className="flex items-start gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 ${cfg.color.split(' ').filter(c => c.startsWith('bg-')).join(' ')}`}>
              <Icon className={`w-5 h-5 ${cfg.color.split(' ').filter(c => c.startsWith('text-')).join(' ')}`} />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h3 className="font-bold text-gray-900">{request.action}</h3>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${cfg.color}`}>{cfg.label}</span>
              </div>
              <p className="text-sm text-gray-600">{request.description}</p>
            </div>
          </div>
        </div>

        <div className="p-5">
          <p className="text-sm text-gray-500 mb-5">
            AI Producer requires your approval before performing this action. You remain in full control — this action will only proceed with your explicit confirmation.
          </p>
          <div className="flex items-center justify-between gap-3">
            <button
              onClick={onReject}
              className="flex items-center gap-2 px-4 py-2 border border-gray-200 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-50"
            >
              <XIcon className="w-4 h-4" /> Cancel
            </button>
            <button
              onClick={onApprove}
              className={`flex items-center gap-2 px-5 py-2 rounded-lg text-sm font-semibold text-white ${
                request.impact === 'destructive' ? 'bg-red-600 hover:bg-red-700' :
                request.impact === 'high' ? 'bg-orange-600 hover:bg-orange-700' :
                'bg-violet-600 hover:bg-violet-700'
              }`}
            >
              <CheckCircle2Icon className="w-4 h-4" /> {cfg.approveLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
