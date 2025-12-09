import React from 'react';
import { motion } from 'framer-motion';
import { LightBulbIcon, CubeTransparentIcon } from '@heroicons/react/24/outline';
import { cn } from '../../lib/utils'; // Assuming cn utility exists, otherwise I'll use simple string interp or just classes

export default function ContextSwitcher({ activeMode, onSwitch }) {
  return (
    <div className="relative z-20 flex items-center justify-center mb-8">
      <div className="relative flex p-1 rounded-full bg-black/20 backdrop-blur-md border border-white/10 shadow-xl w-[320px] md:w-[400px]">
        {/* Sliding Background */}
        <div className="absolute inset-1 pointer-events-none">
          <motion.div
            layoutId="active-pill"
            className="h-full rounded-full bg-[#6C5DD3] shadow-[0_0_20px_rgba(108,93,211,0.5)]"
            initial={false}
            animate={{
              width: "50%",
              x: activeMode === 'simulation' ? '0%' : '100%'
            }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          />
        </div>

        {/* Buttons */}
        <button
          onClick={() => onSwitch('simulation')}
          className={cn(
            "relative flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors duration-200 rounded-full z-10",
            activeMode === 'simulation' ? "text-white" : "text-gray-400 hover:text-white"
          )}
        >
          <CubeTransparentIcon className="w-5 h-5" />
          <span>Project Simulation</span>
        </button>

        <button
          onClick={() => onSwitch('motif')}
          className={cn(
            "relative flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors duration-200 rounded-full z-10",
            activeMode === 'motif' ? "text-white" : "text-gray-400 hover:text-white"
          )}
        >
          <LightBulbIcon className="w-5 h-5" />
          <span>Motif Creator</span>
        </button>
      </div>
    </div>
  );
}
