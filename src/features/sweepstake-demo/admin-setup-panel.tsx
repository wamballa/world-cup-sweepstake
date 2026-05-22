import { BadgeCheck, Check, Clipboard, Mail } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Textarea } from "@/components/ui/textarea";

import { Metric } from "./demo-primitives";
import type { ParticipantDraft } from "./types";

const automatedBadges = [
  "1st Place",
  "2nd Place",
  "3rd Place",
  "4th Place",
  "Wooden Spoon",
  "First Knocked Out",
  "Most Goals Conceded",
  "Fewest Goals Scored",
];

const manualFutureBadges = [
  "Most Cards",
  "Golden Boot Team",
  "Golden Glove Team",
];

export function AdminSetupPanel({
  sweepstakeName,
  participantText,
  adminEmails,
  participants,
  duplicateNames,
  onSweepstakeNameChange,
  onParticipantTextChange,
  onAdminEmailsChange,
  onParticipantEmailChange,
}: {
  sweepstakeName: string;
  participantText: string;
  adminEmails: string;
  participants: ParticipantDraft[];
  duplicateNames: string[];
  onSweepstakeNameChange: (value: string) => void;
  onParticipantTextChange: (value: string) => void;
  onAdminEmailsChange: (value: string) => void;
  onParticipantEmailChange: (name: string, value: string) => void;
}) {
  return (
    <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_24rem]">
      <Card className="bg-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Clipboard className="size-4 text-primary" />
            Setup
          </CardTitle>
          <CardDescription>
            Name, tournament, participants, optional email capture, and admins.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 lg:grid-cols-2">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="sweepstake-name">Sweepstake name</Label>
              <Input
                id="sweepstake-name"
                value={sweepstakeName}
                onChange={(event) =>
                  onSweepstakeNameChange(event.target.value)
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="tournament">Tournament</Label>
              <Input
                id="tournament"
                value="FIFA World Cup 2026"
                readOnly
                aria-readonly="true"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="admin-emails">Admin emails</Label>
              <Textarea
                id="admin-emails"
                value={adminEmails}
                onChange={(event) => onAdminEmailsChange(event.target.value)}
                placeholder="one admin email per line"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="participants">Participant names</Label>
            <Textarea
              id="participants"
              className="min-h-44"
              value={participantText}
              onChange={(event) => onParticipantTextChange(event.target.value)}
              placeholder="Paste one participant per line"
            />
            <div className="grid gap-2 pt-2 sm:grid-cols-2">
              {participants.map((participant) => (
                <div
                  key={participant.id}
                  className="rounded-lg border bg-surface-muted p-3"
                >
                  <div className="flex items-center justify-between gap-2">
                    <p className="truncate text-sm font-semibold">
                      {participant.name}
                    </p>
                    <Badge variant={participant.email ? "secondary" : "outline"}>
                      {participant.email ? "Email" : "No email"}
                    </Badge>
                  </div>
                  <div className="relative mt-2">
                    <Mail
                      className="pointer-events-none absolute left-2 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground"
                      aria-hidden="true"
                    />
                    <Input
                      className="h-8 pl-7"
                      value={participant.email}
                      onChange={(event) =>
                        onParticipantEmailChange(
                          participant.name,
                          event.target.value,
                        )
                      }
                      placeholder="Optional email"
                      type="email"
                    />
                  </div>
                </div>
              ))}
            </div>
            {duplicateNames.length > 0 ? (
              <p className="text-sm font-medium text-destructive">
                Duplicate names: {duplicateNames.join(", ")}
              </p>
            ) : null}
          </div>
        </CardContent>
      </Card>

      <BadgeSettingsPanel />
    </section>
  );
}

function BadgeSettingsPanel() {
  return (
    <Card className="bg-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <BadgeCheck className="size-4 text-primary" />
          Badge categories
        </CardTitle>
        <CardDescription>
          Automated badges are visible; free-tier gaps are marked as future.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <Metric label="Automated" value={`${automatedBadges.length}`} />
          <Metric label="Future" value={`${manualFutureBadges.length}`} />
        </div>
        <div className="flex flex-wrap gap-2">
          {automatedBadges.map((badge) => (
            <Badge key={badge} variant="secondary">
              <Check className="size-3" aria-hidden="true" />
              {badge}
            </Badge>
          ))}
        </div>
        <Separator />
        <div className="flex flex-wrap gap-2">
          {manualFutureBadges.map((badge) => (
            <Badge key={badge} variant="outline">
              {badge}
            </Badge>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
