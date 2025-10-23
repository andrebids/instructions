import React from "react";

// Ultra-clean glass overlay: very faint diagonal sheen only.
export function GlassOverlay({ className = "", angle = 115 }) {
  const angleClass = {
    105: "bg-[linear-gradient(105deg,rgba(255,255,255,0.14)_0%,rgba(255,255,255,0.04)_32%,rgba(255,255,255,0)_56%)]",
    115: "bg-[linear-gradient(115deg,rgba(255,255,255,0.14)_0%,rgba(255,255,255,0.04)_32%,rgba(255,255,255,0)_56%)]",
    125: "bg-[linear-gradient(125deg,rgba(255,255,255,0.14)_0%,rgba(255,255,255,0.04)_32%,rgba(255,255,255,0)_56%)]",
  }[angle] || "bg-[linear-gradient(115deg,rgba(255,255,255,0.14)_0%,rgba(255,255,255,0.04)_32%,rgba(255,255,255,0)_56%)]";

  return (
    <>
      <div className={`absolute inset-0 z-10 pointer-events-none ${className}`} />
      {/* Transversal (diagonal) base gradient to sell the card surface */}
      <div className="absolute inset-0 z-10 pointer-events-none bg-[linear-gradient(135deg,rgba(255,255,255,0.04)_0%,rgba(255,255,255,0.015)_100%)]" />
      {/* Single low-opacity sheen; no extra highlights or radial glows */}
      <div className={`absolute inset-0 z-20 pointer-events-none opacity-8 mix-blend-screen ${angleClass}`} />
      {/* Frosted corner highlights (very subtle) */}
      <div className="absolute inset-0 z-20 pointer-events-none opacity-10 mix-blend-screen bg-[radial-gradient(40%_30%_at_15%_0%,rgba(255,255,255,0.18)_0%,rgba(255,255,255,0)_70%)]" />
      <div className="absolute inset-0 z-20 pointer-events-none opacity-6 mix-blend-screen bg-[radial-gradient(35%_25%_at_90%_8%,rgba(255,255,255,0.14)_0%,rgba(255,255,255,0)_70%)]" />
      {/* Subtle inner vignette to reveal card edges without borders */}
      <div className="absolute inset-0 z-10 pointer-events-none opacity-8 bg-[radial-gradient(120%_120%_at_50%_55%,rgba(0,0,0,0)_62%,rgba(0,0,0,0.1)_100%)]" />
    </>
  );
}


