import { useEffect, useState } from "react";

/**
 * Safari keyboard viewport fix (preserved from 1.0). Keeps the fixed app inside
 * the visible rectangle while the software keyboard resizes or pans the visual
 * viewport, and scrolls only bounded `.scroll-region` elements to the focused
 * field. Returns whether the keyboard appears to be open.
 */
export function useKeyboardViewport() {
  const [keyboardVisible, setKeyboardVisible] = useState(false);
  useEffect(() => {
    const viewport = window.visualViewport;
    let frame = 0;
    let fullHeight = window.innerHeight;
    const resize = () => {
      const unzoomed = !viewport || viewport.scale === 1;
      const height =
        unzoomed && viewport ? viewport.height : window.innerHeight;
      // Safari can pan the visual viewport independently of its height when
      // focusing a field. Keep the fixed app inside that visible rectangle.
      const top = unzoomed && viewport ? viewport.offsetTop : 0;
      document.documentElement.style.setProperty("--app-height", `${height}px`);
      document.documentElement.style.setProperty(
        "--app-offset-top",
        `${top}px`,
      );
      const field = document.activeElement;
      const editingField =
        field instanceof HTMLElement &&
        ["INPUT", "TEXTAREA"].includes(field.tagName);
      if (!editingField) fullHeight = window.innerHeight;
      fullHeight = Math.max(fullHeight, window.innerHeight);
      const keyboard = unzoomed && height < fullHeight * 0.8;
      setKeyboardVisible(!!keyboard);
      cancelAnimationFrame(frame);
      if (keyboard && editingField)
        frame = requestAnimationFrame(() => {
          // Scroll only a bounded form region. scrollIntoView() also scrolls
          // Safari's page, which can lift the entire game above the keyboard.
          const region = field.closest<HTMLElement>(".scroll-region");
          if (!region) return;
          const bounds = region.getBoundingClientRect();
          const input = field.getBoundingClientRect();
          if (input.bottom > bounds.bottom)
            region.scrollTop += input.bottom - bounds.bottom + 8;
          else if (input.top < bounds.top)
            region.scrollTop -= bounds.top - input.top + 8;
        });
    };
    resize();
    viewport?.addEventListener("resize", resize);
    viewport?.addEventListener("scroll", resize);
    window.addEventListener("resize", resize);
    window.addEventListener("scroll", resize);
    document.addEventListener("focusin", resize);
    document.addEventListener("focusout", resize);
    return () => {
      cancelAnimationFrame(frame);
      viewport?.removeEventListener("resize", resize);
      viewport?.removeEventListener("scroll", resize);
      window.removeEventListener("resize", resize);
      window.removeEventListener("scroll", resize);
      document.removeEventListener("focusin", resize);
      document.removeEventListener("focusout", resize);
    };
  }, []);
  return keyboardVisible;
}

/** True while the user prefers reduced motion. */
export function useReducedMotion() {
  const query = "(prefers-reduced-motion: reduce)";
  const [reduced, setReduced] = useState(
    () => typeof matchMedia === "function" && matchMedia(query).matches,
  );
  useEffect(() => {
    if (typeof matchMedia !== "function") return;
    const media = matchMedia(query);
    const change = () => setReduced(media.matches);
    media.addEventListener("change", change);
    return () => media.removeEventListener("change", change);
  }, []);
  return reduced;
}

/** Fewer items per page on very short screens (e.g. iPhone SE 1st gen). */
export function useCompactHeight() {
  const query = "(max-height: 600px)";
  const [compact, setCompact] = useState(
    () => typeof matchMedia === "function" && matchMedia(query).matches,
  );
  useEffect(() => {
    if (typeof matchMedia !== "function") return;
    const media = matchMedia(query);
    const change = () => setCompact(media.matches);
    media.addEventListener("change", change);
    return () => media.removeEventListener("change", change);
  }, []);
  return compact;
}
