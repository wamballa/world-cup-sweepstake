"use client";

import type { PointerEvent } from "react";
import { useCallback, useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import type {
  KeepyUppyScore,
  KeepyUppyScoreboard,
} from "@/server/keepy-uppy/scores";

const storageKey = "world-cup-keepy-uppy-best";
const ballSize = 48;
export const keepyUppyFrameClassName =
  "h-56 overflow-hidden rounded-2xl bg-[radial-gradient(circle_at_22%_18%,rgba(255,255,255,0.24),rgba(255,255,255,0.08)_34%,rgba(77,20,125,0.36)_72%,rgba(239,0,86,0.32))] shadow-inner ring-1 ring-white/25 lg:h-[19.75rem]";
const emptyScoreboard: KeepyUppyScoreboard = {
  highScore: 0,
  scores: [],
};
const initialBallState = {
  x: 200,
  y: 118,
  vx: 0.8,
  vy: -1.4,
  spin: 0,
  rotation: 0,
};

export function LeaderKeepyUppy({
  initialScoreboard = emptyScoreboard,
  leaderName,
  shareToken,
}: {
  initialScoreboard?: KeepyUppyScoreboard;
  leaderName: string;
  shareToken?: string;
}) {
  const [currentKeepUps, setCurrentKeepUps] = useState(0);
  const [bestKeepUps, setBestKeepUps] = useState(0);
  const [scoreboard, setScoreboard] = useState(initialScoreboard);
  const [scoreboardOpen, setScoreboardOpen] = useState(false);
  const [nameDialogOpen, setNameDialogOpen] = useState(false);
  const [missDialogOpen, setMissDialogOpen] = useState(false);
  const [completedScore, setCompletedScore] = useState(0);
  const [submitScoreTitle, setSubmitScoreTitle] = useState("New high score");
  const [playerName, setPlayerName] = useState("");
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const prefersReducedMotion = usePrefersReducedMotion();
  const playAreaRef = useRef<HTMLDivElement>(null);
  const lastValidHitAt = useRef(0);
  const floorResetArmed = useRef(true);
  const currentKeepUpsRef = useRef(0);
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

  const refreshScoreboard = useCallback(async () => {
    if (!shareToken) {
      return scoreboard;
    }

    try {
      const nextScoreboard = await fetchKeepyUppyScoreboard(shareToken);
      setScoreboard(nextScoreboard);
      return nextScoreboard;
    } catch {
      // Keep the current table visible if refresh fails.
      return scoreboard;
    }
  }, [scoreboard, shareToken]);

  const evaluateCompletedStreak = useCallback(
    async (score: number) => {
      if (score < 1 || !shareToken) {
        return;
      }

      const latestScoreboard = await refreshScoreboard();

      setCompletedScore(score);
      setSubmitError(null);

      if (qualifiesForTopTen(score, latestScoreboard.scores)) {
        setSubmitScoreTitle(
          score > latestScoreboard.highScore
            ? "New high score"
            : "You made the top 10",
        );
        setNameDialogOpen(true);
        return;
      }

      setMissDialogOpen(true);
    },
    [refreshScoreboard, shareToken],
  );

  const handleCompletedStreak = useCallback(() => {
    const score = currentKeepUpsRef.current;

    setCurrentKeepUps(0);
    currentKeepUpsRef.current = 0;

    if (score > bestKeepUps) {
      window.localStorage.setItem(storageKey, String(score));
      setBestKeepUps(score);
    }

    void evaluateCompletedStreak(score);
  }, [bestKeepUps, evaluateCompletedStreak]);


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
          handleCompletedStreak();
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
  }, [handleCompletedStreak, prefersReducedMotion]);

  function handleKeepUp() {
    setCurrentKeepUps((current) => {
      const next = current + 1;

      currentKeepUpsRef.current = next;
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
    <>
      <aside
        aria-label={`${leaderName}'s keepy-uppy challenge`}
        className="hidden overflow-hidden rounded-2xl text-white md:block"
        data-testid="leader-keepy-uppy"
      >
        <div
          className={keepyUppyFrameClassName}
          data-testid="keepy-uppy-frame"
        >
          {prefersReducedMotion ? (
            <div className="relative h-full">
              <LeaderBallOverlay
                currentKeepUps={currentKeepUps}
                highScore={scoreboard.highScore}
                onOpenScoreboard={openScoreboard}
              />
              <KeepyUppyStaticBall />
            </div>
          ) : (
            <div ref={playAreaRef} className="relative h-full overflow-hidden">
              <LeaderBallOverlay
                currentKeepUps={currentKeepUps}
                highScore={scoreboard.highScore}
                onOpenScoreboard={openScoreboard}
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
      <HighScoreDialog
        onOpenChange={setScoreboardOpen}
        open={scoreboardOpen}
        scores={scoreboard.scores}
      />
      <MissedTopTenDialog
        onOpenChange={setMissDialogOpen}
        open={missDialogOpen}
        scores={scoreboard.scores}
      />
      <SubmitScoreDialog
        completedScore={completedScore}
        error={submitError}
        isSubmitting={isSubmitting}
        onOpenChange={setNameDialogOpen}
        onPlayerNameChange={setPlayerName}
        onSubmit={submitScore}
        open={nameDialogOpen}
        playerName={playerName}
        title={submitScoreTitle}
      />
    </>
  );

  async function openScoreboard() {
    setScoreboardOpen(true);
    await refreshScoreboard();
  }

  async function submitScore() {
    if (!shareToken || completedScore < 1) {
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);

    try {
      const response = await fetch("/api/keepy-uppy-scores", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          shareToken,
          playerName,
          score: completedScore,
        }),
      });

      if (!response.ok) {
        const body = (await response.json().catch(() => null)) as {
          message?: string;
        } | null;

        throw new Error(body?.message ?? "Score could not be saved.");
      }

      const nextScoreboard = (await response.json()) as KeepyUppyScoreboard;
      setScoreboard(nextScoreboard);
      setNameDialogOpen(false);
      setScoreboardOpen(true);
      setPlayerName("");
      setCompletedScore(0);
    } catch (error) {
      setSubmitError(
        error instanceof Error ? error.message : "Score could not be saved.",
      );
    } finally {
      setIsSubmitting(false);
    }
  }

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
  currentKeepUps,
  highScore,
  onOpenScoreboard,
}: {
  currentKeepUps: number;
  highScore: number;
  onOpenScoreboard: () => void;
}) {
  return (
    <>
      <div className="pointer-events-none absolute left-3 top-3 z-20 min-w-0">
        <p className="text-[0.65rem] font-black uppercase leading-none text-white/75">
          Keepy Uppy
        </p>
        <p className="mt-1 max-w-28 truncate text-sm font-black leading-tight text-white">
          Challenge
        </p>
      </div>
      <div className="absolute right-3 top-3 z-20 rounded-full bg-campaign-yellow px-3 py-1 text-xs font-black text-campaign-ink shadow-sm">
        <span>Keep-ups {currentKeepUps}</span>
        <span aria-hidden="true"> · </span>
        <button
          className="underline decoration-campaign-ink/50 decoration-dotted underline-offset-4"
          onClick={onOpenScoreboard}
          type="button"
        >
          Hi Score {highScore}
        </button>
      </div>
    </>
  );
}

function HighScoreDialog({
  onOpenChange,
  open,
  scores,
}: {
  onOpenChange: (open: boolean) => void;
  open: boolean;
  scores: KeepyUppyScore[];
}) {
  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Keepy-uppy high scores</DialogTitle>
          <DialogDescription>
            Top 10 scores for this sweepstake.
          </DialogDescription>
        </DialogHeader>
        <TopTenScoresList scores={scores} />
      </DialogContent>
    </Dialog>
  );
}

function MissedTopTenDialog({
  onOpenChange,
  open,
  scores,
}: {
  onOpenChange: (open: boolean) => void;
  open: boolean;
  scores: KeepyUppyScore[];
}) {
  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Sorry, you didn&apos;t make it</DialogTitle>
          <DialogDescription>
            Here&apos;s the top 10 to chase next time.
          </DialogDescription>
        </DialogHeader>
        <TopTenScoresList scores={scores} />
        <DialogFooter>
          <Button onClick={() => onOpenChange(false)} type="button">
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function SubmitScoreDialog({
  completedScore,
  error,
  isSubmitting,
  onOpenChange,
  onPlayerNameChange,
  onSubmit,
  open,
  playerName,
  title,
}: {
  completedScore: number;
  error: string | null;
  isSubmitting: boolean;
  onOpenChange: (open: boolean) => void;
  onPlayerNameChange: (playerName: string) => void;
  onSubmit: () => void;
  open: boolean;
  playerName: string;
  title: string;
}) {
  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>
            Save {completedScore} keep-ups to the shared table.
          </DialogDescription>
        </DialogHeader>
        <form
          className="grid gap-3"
          onSubmit={(event) => {
            event.preventDefault();
            onSubmit();
          }}
        >
          <Input
            aria-label="Player name"
            maxLength={40}
            onChange={(event) => onPlayerNameChange(event.target.value)}
            placeholder="Player name"
            value={playerName}
          />
          {error ? (
            <p className="text-sm font-semibold text-destructive">{error}</p>
          ) : null}
          <DialogFooter>
            <Button disabled={isSubmitting || !playerName.trim()} type="submit">
              {isSubmitting ? "Saving..." : "Save score"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function TopTenScoresList({ scores }: { scores: KeepyUppyScore[] }) {
  if (scores.length === 0) {
    return (
      <p className="rounded-xl bg-campaign-page px-3 py-4 text-sm font-semibold text-campaign-muted">
        No shared scores yet.
      </p>
    );
  }

  return (
    <div className="grid gap-2" data-testid="keepy-uppy-high-scores">
      {scores.map((score, index) => (
        <div
          className="grid grid-cols-[2.5rem_minmax(0,1fr)_4rem] items-center gap-2 rounded-xl bg-campaign-page px-3 py-2"
          key={score.id}
        >
          <span className="font-black text-campaign-magenta">
            #{index + 1}
          </span>
          <span className="truncate font-semibold text-campaign-ink">
            {score.playerName}
          </span>
          <span className="text-right font-black text-campaign-purple-strong">
            {score.score}
          </span>
        </div>
      ))}
    </div>
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

async function fetchKeepyUppyScoreboard(shareToken: string) {
  const response = await fetch(
    `/api/keepy-uppy-scores?shareToken=${encodeURIComponent(shareToken)}`,
  );

  if (!response.ok) {
    throw new Error("High scores unavailable.");
  }

  return (await response.json()) as KeepyUppyScoreboard;
}

function qualifiesForTopTen(score: number, scores: KeepyUppyScore[]) {
  if (!Number.isInteger(score) || score < 1) {
    return false;
  }

  if (scores.length < 10) {
    return true;
  }

  return score > scores[9].score;
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
