import { useEffect, useState, useMemo } from "react";

const POINTER_QUERY = "(hover: none) and (pointer: coarse)";
const DEFAULT_MAX_WIDTH = 1366;

function canUseMatchMedia() {
  return typeof window !== "undefined" && typeof window.matchMedia === "function";
}

function getMatch(query) {
  if (!canUseMatchMedia()) {
    return false;
  }
  return window.matchMedia(query).matches;
}

function detectMobileUA() {
  if (typeof navigator === "undefined") {
    return false;
  }

  if (navigator.userAgentData && typeof navigator.userAgentData.mobile === "boolean") {
    return navigator.userAgentData.mobile;
  }

  const ua = navigator.userAgent || "";
  return /iPad|iPhone|Android|Tablet/i.test(ua);
}

function detectTouchSupport() {
  if (typeof navigator === "undefined") {
    return false;
  }

  if (typeof navigator.maxTouchPoints === "number") {
    return navigator.maxTouchPoints > 0;
  }

  return Boolean(navigator.msMaxTouchPoints);
}

function getViewport() {
  if (typeof window === "undefined") {
    return {
      width: undefined,
      height: undefined,
      isPortrait: false,
    };
  }

  const docElement = typeof document !== "undefined" ? document.documentElement : null;
  const width = window.innerWidth || docElement?.clientWidth || 0;
  const height = window.innerHeight || docElement?.clientHeight || 0;
  return {
    width,
    height,
    isPortrait: height >= width,
  };
}

export function useResponsiveProfile(options = {}) {
  const maxWidth = options.maxWidth ?? DEFAULT_MAX_WIDTH;
  const widthQuery = useMemo(() => `(max-width: ${maxWidth}px)`, [maxWidth]);

  const [state, setState] = useState(() => ({
    isCoarsePointer: getMatch(POINTER_QUERY),
    isNarrowWidth: getMatch(widthQuery),
    uaMobile: detectMobileUA(),
    hasTouch: detectTouchSupport(),
    viewport: getViewport(),
  }));

  useEffect(() => {
    if (!canUseMatchMedia()) {
      return;
    }

    const pointerMql = window.matchMedia(POINTER_QUERY);
    const widthMql = window.matchMedia(widthQuery);

    const update = () => {
      setState(prev => ({
        ...prev,
        isCoarsePointer: pointerMql.matches,
        isNarrowWidth: widthMql.matches,
        uaMobile: detectMobileUA(),
        hasTouch: detectTouchSupport(),
      }));
    };

    update();
    pointerMql.addEventListener("change", update);
    widthMql.addEventListener("change", update);

    return () => {
      pointerMql.removeEventListener("change", update);
      widthMql.removeEventListener("change", update);
    };
  }, [widthQuery]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const handleResize = () => {
      setState(prev => ({
        ...prev,
        viewport: getViewport(),
      }));
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    window.addEventListener("orientationchange", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("orientationchange", handleResize);
    };
  }, []);

  const isPortrait = state.viewport?.isPortrait ?? false;

  const isHandheld =
    state.isCoarsePointer ||
    state.uaMobile ||
    (state.isNarrowWidth && (state.uaMobile || state.isCoarsePointer || state.hasTouch)) ||
    (state.hasTouch && isPortrait);

  const isTablet =
    (state.hasTouch || state.uaMobile) && !state.isNarrowWidth && !state.isCoarsePointer;

  const isDesktop = !isHandheld;

  return {
    ...state,
    isPortrait,
    isHandheld,
    isTablet,
    isDesktop,
  };
}


