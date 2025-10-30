import React, { useRef, useEffect } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { useGSAP } from '@gsap/react';

gsap.registerPlugin(ScrollTrigger, useGSAP);

const SplitText = ({
  text,
  className = '',
  delay = 100,
  duration = 0.6,
  ease = 'power3.out',
  splitType = 'chars', // 'chars' | 'words'
  from = { opacity: 0, y: 40 },
  to = { opacity: 1, y: 0 },
  threshold = 0.1,
  rootMargin = '-100px',
  textAlign = 'center',
  tag = 'p',
  onLetterAnimationComplete,
}) => {
  const ref = useRef(null);

  // Basic splitter for chars/words (no paid SplitText plugin)
  const buildSpans = () => {
    if (!text) return [];
    if (splitType === 'words') {
      return String(text).split(/(\s+)/).map((word, idx) => (
        <span key={idx} className="split-word" style={{ display: 'inline-block', whiteSpace: 'pre' }}>{word}</span>
      ));
    }
    // default chars
    return Array.from(String(text)).map((ch, idx) => (
      <span key={idx} className="split-char" style={{ display: 'inline-block', whiteSpace: 'pre' }}>{ch}</span>
    ));
  };

  useGSAP(() => {
    const el = ref.current;
    if (!el) return;

    const targets = el.querySelectorAll(splitType === 'words' ? '.split-word' : '.split-char');
    if (!targets.length) return;

    const startPct = (1 - threshold) * 100;
    const marginMatch = /^(-?\d+(?:\.\d+)?)(px|em|rem|%)?$/.exec(rootMargin);
    const marginValue = marginMatch ? parseFloat(marginMatch[1]) : 0;
    const marginUnit = marginMatch ? marginMatch[2] || 'px' : 'px';
    const sign = marginValue === 0 ? '' : marginValue < 0 ? `-=${Math.abs(marginValue)}${marginUnit}` : `+=${marginValue}${marginUnit}`;
    const start = `top ${startPct}%${sign}`;

    gsap.fromTo(
      targets,
      { ...from },
      {
        ...to,
        duration,
        ease,
        stagger: delay / 1000,
        scrollTrigger: {
          trigger: el,
          start,
          once: true,
          fastScrollEnd: true,
          anticipatePin: 0.4,
        },
        onComplete: () => onLetterAnimationComplete?.(),
        willChange: 'transform, opacity',
        force3D: true,
      }
    );
  }, { scope: ref, dependencies: [text, className, delay, duration, ease, splitType, JSON.stringify(from), JSON.stringify(to), threshold, rootMargin] });

  const style = {
    textAlign,
    overflow: 'hidden',
    display: 'inline-block',
    whiteSpace: 'normal',
    wordWrap: 'break-word',
    willChange: 'transform, opacity',
  };

  const Tag = tag;
  return (
    <Tag ref={ref} style={style} className={`split-parent ${className}`}>
      {buildSpans()}
    </Tag>
  );
};

export default SplitText;


