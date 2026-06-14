"use client";

import { LoaderCircle, MessageCircle } from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

type AiSweepstakeUpdateResponse =
  | {
      status: "ready";
      text: string;
      cached: boolean;
      generatedAt: string;
      freshnessLabel: string;
      model: string;
      sourceUpdatedAt: string | null;
    }
  | {
      status: "unavailable";
      message: string;
      freshnessLabel?: string;
    };

export function AiSweepstakeUpdateButton({
  sourceUpdatedAt,
  shareToken,
}: {
  sourceUpdatedAt: string | null;
  shareToken: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [requestVersion, setRequestVersion] = useState(0);
  const [response, setResponse] = useState<AiSweepstakeUpdateResponse | null>(
    null,
  );

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    const controller = new AbortController();

    async function loadUpdate() {
      setIsLoading(true);

      try {
        const result = await fetch("/api/ai/sweepstake-update", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ shareToken }),
          cache: "no-store",
          signal: controller.signal,
        });

        if (!result.ok) {
          throw new Error("AI update request failed.");
        }

        setResponse((await result.json()) as AiSweepstakeUpdateResponse);
      } catch {
        if (controller.signal.aborted) {
          return;
        }

        setResponse({
          status: "unavailable",
          message:
            "AI update is unavailable right now. The scoreboard data above is still the source of truth.",
        });
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false);
        }
      }
    }

    void loadUpdate();

    return () => controller.abort();
  }, [isOpen, requestVersion, shareToken]);

  function handleOpenChange(open: boolean) {
    setIsOpen(open);

    if (open) {
      setRequestVersion((current) => current + 1);
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        <Button
          aria-label="Open AI sweepstake update"
          className="fixed bottom-4 right-4 z-40 size-16 overflow-hidden rounded-full border-4 border-white bg-campaign-purple p-0 text-white shadow-2xl shadow-campaign-purple/30 hover:bg-campaign-purple-strong focus-visible:ring-campaign-yellow sm:bottom-6 sm:right-6"
          size="icon"
        >
          <Image
            alt=""
            aria-hidden="true"
            className="object-cover"
            fill
            sizes="64px"
            src="/brand/ai-icon.avif"
          />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[min(34rem,calc(100vh-2rem))] overflow-y-auto rounded-3xl border-2 border-campaign-ring bg-campaign-page p-5 text-campaign-ink shadow-2xl sm:max-w-lg">
        <DialogHeader className="pr-8">
          <div className="flex items-center gap-2 text-campaign-magenta">
            <span className="flex size-10 items-center justify-center rounded-full bg-campaign-purple text-white">
              <MessageCircle className="size-5" aria-hidden="true" />
            </span>
            <span className="text-xs font-black uppercase tracking-normal">
              AI update
            </span>
          </div>
          <DialogTitle className="text-2xl font-black leading-tight text-campaign-purple-strong">
            Sweepstake pulse check
          </DialogTitle>
          <DialogDescription className="font-semibold text-campaign-muted">
            Cached sweepstake data. Football-data cache:{" "}
            {formatAgentFreshness(
              response?.status === "ready"
                ? response.sourceUpdatedAt
                : sourceUpdatedAt,
            )}
            .
          </DialogDescription>
        </DialogHeader>

        <div className="rounded-3xl bg-white p-4">
          {isLoading && !response ? (
            <div className="flex items-center gap-3 text-sm font-semibold text-campaign-muted">
              <LoaderCircle
                className="size-5 animate-spin text-campaign-purple"
                aria-hidden="true"
              />
              Building the latest AI update...
            </div>
          ) : response?.status === "ready" ? (
            <div className="space-y-3">
              <div className="whitespace-pre-line text-sm font-semibold leading-6 text-campaign-ink">
                {response.text}
              </div>
              <p className="text-xs font-semibold text-campaign-muted">
                {response.cached ? "Cached update." : "Fresh update."}
                {isLoading ? " Checking for a newer match update..." : ""}
              </p>
            </div>
          ) : (
            <p className="text-sm font-semibold leading-6 text-campaign-muted">
              {response?.message ??
                "AI update is unavailable right now. The scoreboard data above is still the source of truth."}
            </p>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function formatAgentFreshness(value: string | null) {
  if (!value) {
    return "awaiting first sync";
  }

  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
    timeZone: "Europe/London",
    timeZoneName: "short",
  }).format(new Date(value));
}
