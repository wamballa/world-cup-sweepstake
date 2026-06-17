import { BarChart3, ShieldCheck, UsersRound } from "lucide-react";
import type { ReactNode } from "react";

import {
  CampaignHeader,
  CampaignHeading,
  CampaignLogoMark,
  CampaignMetric,
  CampaignPageStack,
  CampaignPanel,
  CampaignPill,
  CampaignShell,
} from "@/components/campaign";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { buildAlternativeBoardRows } from "@/features/shared-board/alternative-board-data";
import type { SharedBoardData } from "@/features/shared-board/shared-board-data";

const alternativeBoardTableHeadClassName =
  "bg-campaign-muted font-black text-white hover:bg-campaign-muted hover:text-white";

export function AlternativeBoard({ boardData }: { boardData: SharedBoardData }) {
  const rows = buildAlternativeBoardRows(boardData);
  const leader = rows[0];
  const topScore = leader?.displayAlternativeScore ?? "0";
  const topTiedPlayerCount = rows.filter((row) => row.rank === 1).length;

  return (
    <CampaignShell>
      <CampaignPageStack>
        <CampaignHeader
          logo={
            <CampaignLogoMark
              alt="World Cup sweepstake logo"
              src="/brand/logo1-web.png"
            />
          }
          actions={
            <div className="grid grid-cols-3 gap-2 text-center">
              <HeaderMetric
                icon={<UsersRound className="size-5" aria-hidden="true" />}
                label="Players"
                value={`${boardData.participants.length}`}
              />
              <HeaderMetric
                icon={<ShieldCheck className="size-5" aria-hidden="true" />}
                label="Teams"
                value={`${boardData.teams.length}`}
              />
              <HeaderMetric
                icon={<BarChart3 className="size-5" aria-hidden="true" />}
                label="Mode"
                value="Average"
              />
            </div>
          }
        >
          <CampaignHeading eyebrow="Experimental comparison board">
            Alternative Board
          </CampaignHeading>
        </CampaignHeader>

        <CampaignPanel className="relative overflow-hidden p-5 sm:p-6" tone="magenta">
          <div className="absolute -right-12 -top-14 size-36 rounded-full bg-campaign-yellow" />
          <div className="absolute -bottom-14 left-16 size-32 rounded-full bg-campaign-cyan/80" />
          <div className="relative grid gap-5 lg:grid-cols-[minmax(0,1fr)_30rem] lg:items-end">
            <div className="min-w-0">
              <Badge className="bg-white text-campaign-purple hover:bg-white">
                Alternative Board
              </Badge>
              <h2 className="mt-3 text-4xl font-black leading-none text-white sm:text-5xl">
                Average score per assigned team
              </h2>
              <p className="mt-3 max-w-2xl text-sm font-semibold text-white/90 sm:text-base">
                This is an experimental alternative board. The official
                leaderboard remains the Luck of the Draw table. This board uses
                average score per assigned team so participants with one team
                and two teams can be compared more evenly.
              </p>
              <p className="mt-1 max-w-2xl text-xs font-semibold text-white/80 sm:text-sm">
                Cached tournament data. {boardData.syncState.freshnessLabel}.
              </p>
            </div>
            <div className="grid gap-2 sm:grid-cols-[minmax(12rem,1.5fr)_1fr_1fr]">
              <HeroMetric label="Top score" value={topScore} />
              <HeroMetric
                label="Players tied"
                value={`${topTiedPlayerCount}`}
              />
              <HeroMetric label="Players" value={`${rows.length}`} />
            </div>
          </div>
        </CampaignPanel>

        <CampaignPanel className="space-y-4 p-3 sm:p-4">
          <div className="grid gap-2 sm:grid-cols-3">
            <CampaignMetric
              label="Scoring"
              value="Average"
              tone="yellow"
            />
            <CampaignMetric
              label="Official board"
              value="Unchanged"
              tone="cyan"
            />
            <CampaignMetric
              label="Status"
              value="Hidden"
              tone="pink"
            />
          </div>

          <div className="overflow-hidden rounded-2xl bg-campaign-panel-soft">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className={alternativeBoardTableHeadClassName}>
                    Rank
                  </TableHead>
                  <TableHead className={alternativeBoardTableHeadClassName}>
                    Participant
                  </TableHead>
                  <TableHead className={alternativeBoardTableHeadClassName}>
                    Assigned teams
                  </TableHead>
                  <TableHead
                    className={`${alternativeBoardTableHeadClassName} text-right`}
                  >
                    Total official score
                  </TableHead>
                  <TableHead
                    className={`${alternativeBoardTableHeadClassName} text-right`}
                  >
                    Teams
                  </TableHead>
                  <TableHead
                    className={`${alternativeBoardTableHeadClassName} text-right`}
                  >
                    Alternative score
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row, index) => (
                  <TableRow
                    key={row.participantId}
                    className={index === 0 ? "bg-campaign-blush" : undefined}
                  >
                    <TableCell>
                      <div
                        className={`flex size-11 items-center justify-center rounded-full text-sm font-black text-white ${
                          index === 0 ? "bg-campaign-magenta" : "bg-campaign-purple"
                        }`}
                      >
                        #{row.rank}
                      </div>
                    </TableCell>
                    <TableCell className="font-black text-campaign-ink">
                      {row.name}
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-wrap gap-1.5">
                        {row.teamNames.length > 0 ? (
                          row.teamNames.map((teamName, teamIndex) => (
                            <Badge
                              key={`${row.participantId}-${row.teamIds[teamIndex] ?? teamIndex}`}
                              className="max-w-full truncate bg-white text-campaign-muted hover:bg-white"
                            >
                              {teamName}
                            </Badge>
                          ))
                        ) : (
                          <CampaignPill tone="soft">No valid teams</CampaignPill>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      {row.totalOfficialTeamScore}
                    </TableCell>
                    <TableCell className="text-right font-semibold">
                      {row.assignedTeamCount}
                    </TableCell>
                    <TableCell className="text-right text-xl font-black text-campaign-purple-strong">
                      {row.displayAlternativeScore}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          <p className="text-xs font-semibold text-campaign-muted">
            Alternative score = total official score of valid assigned teams
            divided by number of valid assigned teams. The official Luck of the
            Draw leaderboard remains unchanged.
          </p>
        </CampaignPanel>
      </CampaignPageStack>
    </CampaignShell>
  );
}

function HeaderMetric({
  icon,
  label,
  value,
}: {
  icon: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex min-w-0 flex-col items-center gap-1 rounded-2xl bg-campaign-panel-soft px-2 py-2 text-campaign-purple-strong">
      {icon}
      <span className="text-xs font-black">{label}</span>
      <span className="max-w-24 truncate text-[0.7rem] font-semibold text-campaign-muted sm:max-w-32">
        {value}
      </span>
    </div>
  );
}

function HeroMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-2xl bg-white px-4 py-3 text-campaign-ink">
      <p className="text-xs font-black uppercase text-campaign-magenta">
        {label}
      </p>
      <p className="mt-1 whitespace-normal break-words text-xl font-black leading-tight text-campaign-purple-strong">
        {value}
      </p>
    </div>
  );
}
