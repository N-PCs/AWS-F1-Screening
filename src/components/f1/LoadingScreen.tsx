import { useEffect, useRef, useState } from "react";

const MINIMUM_DISPLAY_MS = 1500;

export function LoadingScreen() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(true);
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    let anim: { destroy: () => void; setSpeed: (speed: number) => void } | null = null;

    // Dynamically import lottie-web and the animation data (client-only)
    Promise.all([
      import("lottie-web/build/player/lottie_light"),
      import("@/assets/f1-track-loading.json"),
    ]).then(([lottie, animData]) => {
      if (containerRef.current) {
        anim = lottie.default.loadAnimation({
          container: containerRef.current,
          renderer: "svg",
          loop: true,
          autoplay: true,
          animationData: animData.default,
        });
        anim.setSpeed(1.5);
      }
    });

    const timer = setTimeout(() => {
      setFadeOut(true);
      setTimeout(() => setVisible(false), 600);
    }, MINIMUM_DISPLAY_MS);

    return () => {
      anim?.destroy();
      clearTimeout(timer);
    };
  }, []);

  if (!visible) return null;

  return (
    <div
      className={`loading-screen ${fadeOut ? "loading-screen--fade-out" : ""}`}
      aria-label="Loading"
    >
      <div className="loading-screen__content">
        <div ref={containerRef} className="loading-screen__lottie" />
        <p className="loading-screen__text">Loading</p>
      </div>
    </div>
  );
}
