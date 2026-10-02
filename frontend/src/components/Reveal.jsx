import { useEffect, useRef, useState } from "react";

/*
 * Content that arrives as you scroll to it.
 *
 * WHY AN OBSERVER AND NOT A SCROLL HANDLER
 *
 * A scroll listener fires on every frame of every scroll for the life of the
 * page, and then has to measure each element to work out whether it is in
 * view — which forces a layout on the main thread, during the one activity
 * where dropping frames is most obvious. IntersectionObserver is told once
 * what to watch and calls back only when something actually crosses the
 * threshold, off the main thread.
 *
 * IT ONLY FIRES ONCE
 *
 * The observer disconnects as soon as an element has been seen. Re-animating
 * on the way back up sounds richer and is worse to use: scrolling up past
 * something you have already read should not make it fade out and in again.
 *
 * SAFETY
 *
 * The element starts invisible, so anything that stops the observer running
 * would leave a blank page. Two guards: a browser without
 * IntersectionObserver shows everything immediately, and the observer fires
 * for elements already on screen at mount, so the top of the page is never
 * waiting for a scroll that a short page will never get.
 *
 * Somebody who has asked for reduced motion gets the content with no movement
 * at all — the global rule in index.css collapses the transition, so the
 * opacity change lands in one frame instead of sliding.
 */

export function useReveal({ threshold = 0.12 } = {}) {
  const ref = useRef(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const element = ref.current;
    if (!element) return undefined;

    if (typeof IntersectionObserver === "undefined") {
      setShown(true);
      return undefined;
    }

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        setShown(true);
        observer.disconnect();
      },
      {
        threshold,
        // Start a little before the element reaches the bottom edge, so it has
        // finished arriving by the time it is properly in view rather than
        // animating under the reader's eyes.
        rootMargin: "0px 0px -8% 0px",
      }
    );

    observer.observe(element);
    return () => observer.disconnect();
  }, [threshold]);

  return [ref, shown];
}

/*
 * `delay` staggers a row of cards so they arrive one after another rather than
 * all at once. Kept small — a stagger you have to wait for is an obstacle, not
 * a flourish.
 */
export default function Reveal({ children, delay = 0, className = "" }) {
  const [ref, shown] = useReveal();

  return (
    <div
      ref={ref}
      className={`transition-[opacity,transform] duration-500 ease-out ${
        shown ? "translate-y-0 opacity-100" : "translate-y-5 opacity-0"
      } ${className}`}
      style={{ transitionDelay: shown ? `${delay}ms` : "0ms" }}
    >
      {children}
    </div>
  );
}
