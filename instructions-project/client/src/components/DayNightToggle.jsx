import React from "react";

export default function DayNightToggle({
  isNight = false,
  onToggle,
  className = "",
  size = 44,
}) {
  const width = Math.round(size * 2.0);
  const height = size;
  const knob = Math.round(size * 0.72);
  const padding = Math.round((height - knob) / 2);

  return (
    <button
      type="button"
      aria-label={isNight ? "Switch to Day" : "Switch to Night"}
      onClick={() => onToggle?.(!isNight)}
      className={`relative rounded-full transition-colors duration-500 ${className}`}
      style={{
        width,
        height,
        background: isNight
          ? "linear-gradient(180deg, #0b1224 0%, #151b2e 100%)"
          : "linear-gradient(180deg, #4fc3ff 0%, #2aa7ff 100%)",
        boxShadow: isNight
          ? "inset 0 0 0 1px rgba(255,255,255,0.06), 0 4px 16px rgba(0,0,0,0.35)"
          : "inset 0 0 0 1px rgba(255,255,255,0.20), 0 6px 20px rgba(0,160,255,0.30)",
    }}
    >
      {/* Clouds (day) */}
      <div
        className="absolute inset-0 transition-opacity duration-500"
        style={{ opacity: isNight ? 0 : 1 }}
      >
        <div
          className="absolute rounded-full bg-white/90"
          style={{ left: padding + 6, top: padding + 8, width: knob * 0.9, height: knob * 0.4, filter: "blur(0.2px)" }}
        />
        <div
          className="absolute rounded-full bg-white/90"
          style={{ left: padding + 18, top: padding + 14, width: knob * 0.8, height: knob * 0.36, filter: "blur(0.2px)" }}
        />
        <div
          className="absolute rounded-full bg-white/90"
          style={{ left: padding + 34, top: padding + 10, width: knob * 0.7, height: knob * 0.34, filter: "blur(0.2px)" }}
        />
      </div>

      {/* Stars (night) */}
      <svg
        className="absolute inset-0 transition-opacity duration-500"
        style={{ opacity: isNight ? 1 : 0 }}
        width={width}
        height={height}
        viewBox={`0 0 ${width} ${height}`}
        aria-hidden
      >
        <g fill="white" opacity="0.9">
          <circle cx={width * 0.22} cy={height * 0.35} r={1.2} />
          <circle cx={width * 0.35} cy={height * 0.25} r={0.9} />
          <circle cx={width * 0.48} cy={height * 0.4} r={1} />
          <circle cx={width * 0.62} cy={height * 0.3} r={1.3} />
          <circle cx={width * 0.72} cy={height * 0.5} r={0.9} />
        </g>
      </svg>

      {/* Knob: Sun / Moon */}
      <div
        className="absolute rounded-full transition-all duration-500 ease-out"
        style={{
          width: knob,
          height: knob,
          left: isNight ? width - knob - padding : padding,
          top: padding,
          background: isNight ? "radial-gradient(circle at 40% 40%, #e6e9ef 0%, #c9ced8 60%, #aeb4c0 100%)" : "radial-gradient(circle at 40% 40%, #ffe37a 0%, #ffcc33 60%, #f5a623 100%)",
          boxShadow: isNight
            ? "inset -4px -4px 8px rgba(0,0,0,0.25), 0 4px 10px rgba(0,0,0,0.35)"
            : "inset -6px -6px 10px rgba(0,0,0,0.15), 0 6px 14px rgba(255,170,0,0.35)",
        }}
      >
        {/* Moon craters */}
        {isNight ? (
          <>
            <div className="absolute rounded-full bg-black/15" style={{ left: knob * 0.22, top: knob * 0.28, width: knob * 0.22, height: knob * 0.22 }} />
            <div className="absolute rounded-full bg-black/12" style={{ left: knob * 0.52, top: knob * 0.2, width: knob * 0.18, height: knob * 0.18 }} />
            <div className="absolute rounded-full bg-black/10" style={{ left: knob * 0.46, top: knob * 0.55, width: knob * 0.14, height: knob * 0.14 }} />
          </>
        ) : null}
      </div>
    </button>
  );
}


