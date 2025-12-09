import React from 'react';
import { motion } from 'framer-motion';
import { 
  ArrowRightLeft, 
  Calculator, 
  Lock, 
  Clock, 
  Heart, 
  Plus, 
  TrendingUp 
} from 'lucide-react';

const StockControlSection = () => {
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
        delayChildren: 0.2,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.6, ease: "easeOut" },
    },
  };

  const features = [
    {
      icon: <ArrowRightLeft className="w-6 h-6 text-indigo-400" />,
      title: "Parts Comparator",
      desc: "Side-by-side specs comparison.",
      colSpan: "col-span-1"
    },
    {
      icon: <Calculator className="w-6 h-6 text-indigo-400" />,
      title: "Project Budgeting",
      desc: "Add parts to projects with auto-budget calculation.",
      colSpan: "col-span-1"
    },
    {
      icon: <div className="relative w-6 h-6 flex items-center justify-center">
              <span className="absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-25 animate-ping"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
            </div>,
      title: "Live Stock Management",
      desc: "Real-time inventory tracking.",
      colSpan: "col-span-2"
    },
    {
      icon: <Lock className="w-6 h-6 text-indigo-400" />,
      title: "Smart Reservations",
      desc: "Lock, Confirm, and Release workflow with automated expiration warnings.",
      colSpan: "col-span-2"
    }
  ];

  return (
    <section className="relative w-full py-24 bg-[#0B0D17] overflow-hidden text-white">
      {/* Background Ambience */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] right-[-5%] w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[100px]" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[600px] h-[600px] bg-purple-900/10 rounded-full blur-[120px]" />
      </div>

      <div className="container mx-auto px-6 relative z-10">
        
        {/* Header */}
        <div className="flex flex-col items-center text-center mb-16">
          <motion.span 
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-indigo-400 font-medium tracking-wider uppercase text-sm mb-3"
          >
            Advanced Tools
          </motion.span>
          <motion.h2 
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            viewport={{ once: true }}
            className="text-4xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-white to-gray-400"
          >
            Complete Control. <br className="hidden md:block" /> Real-time Precision.
          </motion.h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          
          {/* Left Side: Mockup Demo */}
          <motion.div 
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="relative"
          >
            {/* Floating Container */}
            <motion.div 
              animate={{ y: [0, -10, 0] }}
              transition={{ repeat: Infinity, duration: 6, ease: "easeInOut" }}
              className="relative rounded-xl bg-gray-900/40 backdrop-blur-xl border border-white/10 shadow-[0_0_50px_-12px_rgba(99,102,241,0.2)] overflow-hidden"
            >
              {/* Browser Header */}
              <div className="h-10 bg-white/5 border-b border-white/10 flex items-center px-4 gap-2">
                <div className="flex gap-2">
                  <div className="w-3 h-3 rounded-full bg-red-500/80" />
                  <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                  <div className="w-3 h-3 rounded-full bg-green-500/80" />
                </div>
                <div className="mx-auto w-1/2 h-5 bg-white/5 rounded-full text-[10px] flex items-center justify-center text-gray-400 font-mono">
                  thecore.app/stock-control
                </div>
              </div>

              {/* Video/Content Placeholder */}
              <div className="aspect-video bg-gradient-to-br from-gray-800 to-gray-900 flex items-center justify-center relative group cursor-pointer">
                 {/* This would be the video tag */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-16 h-16 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 group-hover:scale-110 transition-transform">
                    <div className="w-0 h-0 border-t-[10px] border-t-transparent border-l-[18px] border-l-white border-b-[10px] border-b-transparent ml-1" />
                  </div>
                </div>
                
                {/* Simulated UI Overlay */}
                <div className="absolute bottom-4 left-4 right-4 flex justify-between items-end">
                  <div className="bg-black/50 backdrop-blur-md px-3 py-2 rounded-lg border border-white/10">
                    <div className="text-xs text-gray-400">Total Valuation</div>
                    <div className="text-sm font-bold text-white">$142,050.00</div>
                  </div>
                  <div className="bg-indigo-500 text-white text-xs font-bold px-3 py-1 rounded-full animate-pulse shadow-lg shadow-indigo-500/20">
                    Live Demo
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>

          {/* Right Side: Feature Grid */}
          <motion.div 
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            className="flex flex-col gap-6"
          >
            <div className="grid grid-cols-2 gap-4">
              {features.map((feature, idx) => (
                <motion.div 
                  key={idx}
                  variants={itemVariants}
                  whileHover={{ scale: 1.02, borderColor: "rgba(99, 102, 241, 0.4)" }}
                  className={`${feature.colSpan} p-5 rounded-xl bg-white/5 border border-white/10 backdrop-blur-sm hover:bg-white/10 transition-colors group`}
                >
                  <div className="mb-3 p-2 bg-indigo-500/10 rounded-lg w-fit group-hover:bg-indigo-500/20 transition-colors">
                    {feature.icon}
                  </div>
                  <h3 className="text-lg font-semibold text-white mb-1 group-hover:text-indigo-300 transition-colors">
                    {feature.title}
                  </h3>
                  <p className="text-sm text-gray-400 leading-relaxed">
                    {feature.desc}
                  </p>
                </motion.div>
              ))}
            </div>

            {/* Quick Actions Row */}
            <motion.div 
              variants={itemVariants}
              className="flex items-center gap-4 mt-2"
            >
              <button className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10 hover:text-white transition-all group">
                <Heart className="w-5 h-5 group-hover:text-red-400 transition-colors" />
                <span className="text-sm font-medium">Add to Favorites</span>
              </button>
              
              <button className="flex-1 flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-900/20 transition-all">
                <Plus className="w-5 h-5" />
                <span className="text-sm font-medium">Quick Add</span>
              </button>
            </motion.div>

          </motion.div>
        </div>
      </div>
    </section>
  );
};

export default StockControlSection;
