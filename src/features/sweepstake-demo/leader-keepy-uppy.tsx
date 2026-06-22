"use client";

import dynamic from "next/dynamic";
import type { PointerEvent } from "react";
import { useEffect, useRef, useState } from "react";

const storageKey = "world-cup-keepy-uppy-best";
const ballSize = 48;
const initialBallState = {
  x: 200,
  y: 118,
  vx: 0.8,
  vy: -1.4,
  spin: 0,
  rotation: 0,
};

const ThreeLeaderKeepyUppyScene = dynamic(
  () =>
    import("./three-leader-keepy-uppy-scene").then(
      (module) => module.ThreeLeaderKeepyUppyScene,
    ),
  {
    ssr: false,
    loading: () => <KeepyUppyStaticBall />,
  },
);

export function LeaderKeepyUppy({ leaderName }: { leaderName: string }) {
  const [currentKeepUps, setCurrentKeepUps] = useState(0);
  const [bestKeepUps, setBestKeepUps] = useState(0);
  const prefersReducedMotion = usePrefersReducedMotion();
  const playAreaRef = useRef<HTMLDivElement>(null);
  const lastValidHitAt = useRef(0);
  const floorResetArmed = useRef(true);
  const ballState = useRef({ ...initialBallState });
  const [ballStyle, setBallStyle] = useState({
    x: initialBallState.x,
    y: initialBallState.y,
    rotation: initialBallState.rotation,
  });

  useEffect(() => {
    const timeoutId = window.setTimeout(() => {
      setBestKeepUps(readSavedBestKeepUps());
    }, 0);

    return () => window.clearTimeout(timeoutId);
  }, []);

  useEffect(() => {
    if (prefersReducedMotion) {
      return;
    }

    let animationFrameId = 0;
    let previousTime = performance.now();

    function tick(now: number) {
      const area = playAreaRef.current;

      if (!area) {
        animationFrameId = requestAnimationFrame(tick);
        return;
      }

      const delta = Math.min((now - previousTime) / 16.67, 2);
      previousTime = now;
      const maxX = area.clientWidth - ballSize;
      const maxY = area.clientHeight - ballSize;
      const state = ballState.current;

      state.vy += 0.28 * delta;
      state.x += state.vx * delta;
      state.y += state.vy * delta;
      state.rotation += state.spin * delta;
      state.vx *= 0.996;
      state.spin *= 0.992;

      if (state.x < 0) {
        state.x = 0;
        state.vx = Math.abs(state.vx) * 0.82;
        state.spin *= -0.8;
      } else if (state.x > maxX) {
        state.x = maxX;
        state.vx = -Math.abs(state.vx) * 0.82;
        state.spin *= -0.8;
      }

      if (state.y > maxY) {
        state.y = maxY;
        state.vy = -Math.abs(state.vy) * 0.62;
        state.vx *= 0.9;

        if (floorResetArmed.current) {
          setCurrentKeepUps(0);
          floorResetArmed.current = false;
        }
      } else if (state.y < 0) {
        state.y = 0;
        state.vy = Math.abs(state.vy) * 0.7;
      }

      setBallStyle({
        x: state.x,
        y: state.y,
        rotation: state.rotation,
      });
      animationFrameId = requestAnimationFrame(tick);
    }

    animationFrameId = requestAnimationFrame(tick);

    return () => cancelAnimationFrame(animationFrameId);
  }, [prefersReducedMotion]);

  function handleKeepUp() {
    setCurrentKeepUps((current) => {
      const next = current + 1;

      setBestKeepUps((best) => {
        if (next <= best) {
          return best;
        }

        window.localStorage.setItem(storageKey, String(next));
        return next;
      });

      return next;
    });
  }

  return (
    <aside
      aria-label={`${leaderName}'s keepy-uppy challenge`}
      className="hidden overflow-hidden rounded-2xl text-white md:block"
      data-testid="leader-keepy-uppy"
    >
      <div className="h-56 overflow-hidden rounded-2xl bg-white/15 shadow-inner ring-1 ring-white/25 lg:h-60">
        {prefersReducedMotion ? (
          <div className="relative h-full">
            <LeaderBallOverlay
              bestKeepUps={bestKeepUps}
              currentKeepUps={currentKeepUps}
              leaderName={leaderName}
            />
            <KeepyUppyStaticBall />
          </div>
        ) : (
          <div ref={playAreaRef} className="relative h-full overflow-hidden">
            <LeaderBallOverlay
              bestKeepUps={bestKeepUps}
              currentKeepUps={currentKeepUps}
              leaderName={leaderName}
            />
            <ThreeLeaderKeepyUppyScene
              onFloor={() => setCurrentKeepUps(0)}
              onKeepUp={handleKeepUp}
            />
            <button
              aria-label={`Keep ${leaderName}'s ball up`}
              className="absolute left-0 top-0 z-10 size-12 touch-none rounded-full bg-[radial-gradient(circle_at_32%_26%,#ffffff_0_16%,#f7f2ff_17%_31%,#ffe85d_32%_50%,#4d147d_51%_100%)] shadow-2xl ring-4 ring-white/35 transition-[filter] hover:brightness-110"
              onPointerDown={handleBallPointerDown}
              style={{
                transform: `translate3d(${ballStyle.x}px, ${ballStyle.y}px, 0) rotate(${ballStyle.rotation}deg)`,
              }}
              type="button"
            />
          </div>
        )}
      </div>
    </aside>
  );

  function handleBallPointerDown(event: PointerEvent<HTMLButtonElement>) {
    const area = playAreaRef.current;
    const now = performance.now();

    if (!area || now - lastValidHitAt.current < 180) {
      return;
    }

    const ballRect = event.currentTarget.getBoundingClientRect();
    const hitX = event.clientX - (ballRect.left + ballRect.width / 2);
    const hitY = event.clientY - (ballRect.top + ballRect.height / 2);
    const state = ballState.current;
    const lowerHalfLift = hitY > 0 ? 7.4 : 4.8;
    const sidewaysChaos = (Math.random() - 0.5) * 0.8;
    const upwardChaos = Math.random() * 0.8;

    state.vx += -(hitX / (ballRect.width / 2)) * 3.1 + sidewaysChaos;
    state.vy = -lowerHalfLift - upwardChaos;
    state.spin += -(hitX / (ballRect.width / 2)) * 5.2;
    lastValidHitAt.current = now;
    floorResetArmed.current = true;
    handleKeepUp();
  }
}

function LeaderBallOverlay({
  bestKeepUps,
  currentKeepUps,
  leaderName,
}: {
  bestKeepUps: number;
  currentKeepUps: number;
  leaderName: string;
}) {
  return (
    <>
      <div className="pointer-events-none absolute left-3 top-3 z-20 min-w-0">
        <p className="text-[0.65rem] font-black uppercase leading-none text-white/75">
          Leader ball
        </p>
        <p className="mt-1 max-w-28 truncate text-sm font-black leading-tight text-white">
          {leaderName}
        </p>
      </div>
      <div className="pointer-events-none absolute right-3 top-3 z-20 rounded-full bg-campaign-yellow px-3 py-1 text-xs font-black text-campaign-ink shadow-sm">
        Keep-ups {currentKeepUps} · Best {bestKeepUps}
      </div>
    </>
  );
}

function usePrefersReducedMotion() {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia("(prefers-reduced-motion: reduce)");
    const timeoutId = window.setTimeout(() => {
      setPrefersReducedMotion(mediaQuery.matches);
    }, 0);

    function handleChange(event: MediaQueryListEvent) {
      setPrefersReducedMotion(event.matches);
    }

    mediaQuery.addEventListener("change", handleChange);

    return () => {
      window.clearTimeout(timeoutId);
      mediaQuery.removeEventListener("change", handleChange);
    };
  }, []);

  return prefersReducedMotion;
}

function readSavedBestKeepUps() {
  if (typeof window === "undefined") {
    return 0;
  }

  const savedBest = window.localStorage.getItem(storageKey);
  const parsedBest = savedBest ? Number.parseInt(savedBest, 10) : 0;

  return Number.isFinite(parsedBest) && parsedBest > 0 ? parsedBest : 0;
}

function KeepyUppyStaticBall() {
  return (
    <div className="flex h-full items-center justify-center">
      <div
        aria-hidden="true"
        className="size-12 rounded-full bg-[radial-gradient(circle_at_32%_26%,#ffffff_0_18%,#f7f2ff_19%_34%,#ffe85d_35%_52%,#4d147d_53%_100%)] shadow-2xl ring-4 ring-white/35"
      />
    </div>
  );
}
