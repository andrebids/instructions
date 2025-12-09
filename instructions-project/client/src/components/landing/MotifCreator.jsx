import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SparklesIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import GlassSurface from '../ui/GlassSurface';
import { cn } from '../../lib/utils';

export default function MotifCreator() {
  const [isProcessing, setIsProcessing] = useState(false);
  const [formData, setFormData] = useState({
    supportType: '',
    style: '',
    keywords: ''
  });

  const handleGenerate = () => {
    setIsProcessing(true);
    // Simulate API call
    setTimeout(() => {
      setIsProcessing(false);
    }, 3000);
  };

  return (
    <div className="w-full max-w-7xl mx-auto h-[600px] flex gap-8 p-4">
      {/* LEFT SIDE: Smart Interface */}
      <motion.div 
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5 }}
        className="w-1/2 flex flex-col justify-center"
      >
        <div className="mb-8">
          <h2 className="text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400 mb-4">
            Define Your Signature Light.
          </h2>
          <p className="text-gray-400 text-lg">
            Find the perfect lighting motif from our catalog or generate a unique concept with AI.
          </p>
        </div>

        <GlassSurface className="p-8 space-y-6">
          <div className="space-y-4">
            {/* Input 1: Dropdown */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">Support Type</label>
              <select 
                className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-[#6C5DD3] focus:outline-none transition-all"
                value={formData.supportType}
                onChange={(e) => setFormData({...formData, supportType: e.target.value})}
              >
                <option value="" disabled>Select support type</option>
                <option value="pole">Pole Mount</option>
                <option value="facade">Facade</option>
                <option value="street">Street Cross</option>
              </select>
            </div>

            {/* Input 2: Style */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">Style & Vibe</label>
              <select 
                className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-3 text-white focus:ring-2 focus:ring-[#6C5DD3] focus:outline-none transition-all"
                value={formData.style}
                onChange={(e) => setFormData({...formData, style: e.target.value})}
              >
                <option value="" disabled>Select style</option>
                <option value="warm">Warm White</option>
                <option value="cold">Cold White</option>
                <option value="rgb">RGB</option>
                <option value="classic">Classic</option>
                <option value="abstract">Abstract</option>
              </select>
            </div>

            {/* Input 3: Keywords */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-300">Keywords</label>
              <input 
                type="text"
                placeholder="e.g. Star, Snowflake, Ribbon"
                className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:ring-2 focus:ring-[#6C5DD3] focus:outline-none transition-all"
                value={formData.keywords}
                onChange={(e) => setFormData({...formData, keywords: e.target.value})}
              />
            </div>
          </div>

          <div className="pt-4 flex gap-4">
            <button className="flex-1 px-6 py-3 border border-white/20 rounded-xl text-white font-semibold hover:bg-white/5 transition-colors flex items-center justify-center gap-2 group">
              <MagnifyingGlassIcon className="w-5 h-5 group-hover:scale-110 transition-transform" />
              Find Existing Match
            </button>
            <button 
              onClick={handleGenerate}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-[#6C5DD3] to-[#FF9F43] rounded-xl text-white font-semibold shadow-[0_0_20px_rgba(108,93,211,0.4)] hover:shadow-[0_0_30px_rgba(108,93,211,0.6)] transition-all flex items-center justify-center gap-2 group"
            >
              <SparklesIcon className="w-5 h-5 group-hover:spin-slow" />
              Generate Idea with AI
            </button>
          </div>
        </GlassSurface>
      </motion.div>

      {/* RIGHT SIDE: Visual Experience */}
      <motion.div 
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
        className="w-1/2 relative flex items-center justify-center"
      >
        <div className="relative w-full h-full bg-black/40 rounded-3xl border border-white/5 backdrop-blur-sm overflow-hidden flex items-center justify-center">
          
          <AnimatePresence mode='wait'>
            {isProcessing ? (
              <motion.div
                key="processing"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="flex flex-col items-center gap-4"
              >
                 <div className="relative">
                    <div className="w-24 h-24 rounded-full border-4 border-[#6C5DD3]/30 border-t-[#6C5DD3] animate-spin"></div>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <SparklesIcon className="w-8 h-8 text-[#FF9F43] animate-pulse" />
                    </div>
                 </div>
                 <p className="text-gray-400 font-medium animate-pulse">Generating Concept...</p>
              </motion.div>
            ) : (
              <motion.div 
                key="result"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="relative z-10"
              >
                {/* Simulated glowing motif */}
                <div className="relative group cursor-pointer">
                  {/* Glow effect */}
                  <div className="absolute -inset-4 bg-[#FF9F43]/20 blur-xl rounded-full animate-pulse"></div>
                  <div className="absolute -inset-8 bg-[#6C5DD3]/10 blur-2xl rounded-full animate-pulse delay-75"></div>
                  
                  {/* The Motif Object (Abstract Star Shape) */}
                  <svg width="300" height="300" viewBox="0 0 100 100" className="drop-shadow-[0_0_15px_rgba(255,159,67,0.8)]">
                     <path 
                       d="M50 5 L63 35 L95 40 L72 65 L77 95 L50 80 L23 95 L28 65 L5 40 L37 35 Z" 
                       fill="none" 
                       stroke="url(#grad1)" 
                       strokeWidth="2"
                       strokeLinecap="round"
                       strokeLinejoin="round"
                       className="animate-[dash_5s_linear_infinite]"
                     />
                     <defs>
                       <linearGradient id="grad1" x1="0%" y1="0%" x2="100%" y2="0%">
                         <stop offset="0%" stopColor="#6C5DD3" />
                         <stop offset="100%" stopColor="#FF9F43" />
                       </linearGradient>
                     </defs>
                  </svg>
                </div>
                
                <div className="absolute bottom-[-60px] left-1/2 -translate-x-1/2 text-center w-full">
                  <p className="text-sm text-gray-500">Interactive 3D Preview</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Background Grid/Void effect */}
          <div className="absolute inset-0 z-0 bg-[linear-gradient(rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,black,transparent)]"></div>
        </div>
      </motion.div>
    </div>
  );
}
