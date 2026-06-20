import React from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronLeft } from 'lucide-react';

export default function MobileHeader({ title }) {
  const navigate = useNavigate();
  return (
    <div
      className="md:hidden flex items-center gap-2 bg-white border-b border-slate-200 px-4 shadow-sm"
      style={{ paddingTop: 'env(safe-area-inset-top, 0px)', minHeight: 'calc(52px + env(safe-area-inset-top, 0px))' }}
    >
      <button
        onClick={() => navigate(-1)}
        className="p-1 -ml-1 text-slate-600 no-select"
        aria-label="Go back"
      >
        <ChevronLeft className="w-6 h-6" />
      </button>
      <span className="font-semibold text-slate-800 text-base">{title}</span>
    </div>
  );
}