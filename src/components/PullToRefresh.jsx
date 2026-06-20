import React, { useState, useRef } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';

const PTR_THRESHOLD = 80;

export default function PullToRefresh({ onRefresh, children }) {
  const [ptrY, setPtrY] = useState(0);
  const [ptrActive, setPtrActive] = useState(false);
  const touchStartY = useRef(null);

  const handleTouchStart = (e) => {
    if (window.scrollY === 0) touchStartY.current = e.touches[0].clientY;
  };

  const handleTouchMove = (e) => {
    if (touchStartY.current === null) return;
    const delta = e.touches[0].clientY - touchStartY.current;
    if (delta > 0) setPtrY(Math.min(delta, PTR_THRESHOLD + 20));
  };

  const handleTouchEnd = async () => {
    if (ptrY >= PTR_THRESHOLD) {
      setPtrActive(true);
      await onRefresh();
      setPtrActive(false);
    }
    setPtrY(0);
    touchStartY.current = null;
  };

  return (
    <div
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <div
        className="ptr-indicator overflow-hidden bg-slate-100 transition-all"
        style={{ height: ptrY > 0 ? `${ptrY}px` : ptrActive ? '60px' : '0px' }}
      >
        <div className="flex items-center gap-2 text-slate-500 text-sm">
          <motion.div
            animate={ptrActive ? { rotate: 360 } : { rotate: ptrY * 3 }}
            transition={{ duration: ptrActive ? 0.6 : 0, repeat: ptrActive ? Infinity : 0, ease: 'linear' }}
          >
            <ArrowRight className="w-4 h-4 rotate-90" />
          </motion.div>
          {ptrActive ? 'Refreshing...' : ptrY >= PTR_THRESHOLD ? 'Release to refresh' : 'Pull to refresh'}
        </div>
      </div>
      {children}
    </div>
  );
}