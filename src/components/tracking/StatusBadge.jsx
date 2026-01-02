import React from 'react';
import { Badge } from "@/components/ui/badge";
import { Clock, Search, CheckCircle, CreditCard, Loader2, XCircle, FileCheck } from 'lucide-react';

const statusConfig = {
  pending_review: {
    label: 'Pending Review',
    color: 'bg-amber-100 text-amber-700 border-amber-200',
    icon: Clock,
  },
  under_review: {
    label: 'Under Review',
    color: 'bg-blue-100 text-blue-700 border-blue-200',
    icon: Search,
  },
  approved: {
    label: 'Approved',
    color: 'bg-green-100 text-green-700 border-green-200',
    icon: CheckCircle,
  },
  payment_pending: {
    label: 'Payment Pending',
    color: 'bg-purple-100 text-purple-700 border-purple-200',
    icon: CreditCard,
  },
  paid: {
    label: 'Paid',
    color: 'bg-emerald-100 text-emerald-700 border-emerald-200',
    icon: CheckCircle,
  },
  processing: {
    label: 'Processing',
    color: 'bg-cyan-100 text-cyan-700 border-cyan-200',
    icon: Loader2,
  },
  completed: {
    label: 'Completed',
    color: 'bg-green-100 text-green-700 border-green-200',
    icon: FileCheck,
  },
  rejected: {
    label: 'Rejected',
    color: 'bg-red-100 text-red-700 border-red-200',
    icon: XCircle,
  },
  pending: {
    label: 'Pending',
    color: 'bg-slate-100 text-slate-700 border-slate-200',
    icon: Clock,
  },
};

export default function StatusBadge({ status, size = 'default' }) {
  const config = statusConfig[status] || statusConfig.pending;
  const Icon = config.icon;
  
  return (
    <Badge 
      variant="outline" 
      className={`${config.color} ${size === 'lg' ? 'px-3 py-1.5 text-sm' : 'px-2 py-1 text-xs'} flex items-center gap-1.5`}
    >
      <Icon className={`${size === 'lg' ? 'w-4 h-4' : 'w-3 h-3'} ${status === 'processing' ? 'animate-spin' : ''}`} />
      {config.label}
    </Badge>
  );
}