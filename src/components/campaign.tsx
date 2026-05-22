import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

type CampaignTone =
  | "default"
  | "purple"
  | "magenta"
  | "pink"
  | "cyan"
  | "yellow"
  | "soft";

const panelToneClasses: Record<CampaignTone, string> = {
  default: "bg-campaign-panel text-campaign-ink",
  purple: "bg-campaign-purple text-white",
  magenta: "bg-campaign-magenta text-white",
  pink: "bg-campaign-pink text-campaign-ink",
  cyan: "bg-campaign-cyan text-campaign-ink",
  yellow: "bg-campaign-yellow text-campaign-ink",
  soft: "bg-campaign-panel-soft text-campaign-ink",
};

const eyebrowToneClasses: Record<CampaignTone, string> = {
  default: "text-campaign-magenta",
  purple: "text-campaign-yellow",
  magenta: "text-campaign-yellow",
  pink: "text-campaign-magenta",
  cyan: "text-campaign-magenta",
  yellow: "text-campaign-purple",
  soft: "text-campaign-magenta",
};

export function CampaignShell({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <main
      className={cn(
        "min-h-dvh overflow-x-hidden bg-campaign-page text-campaign-ink",
        className,
      )}
    >
      {children}
    </main>
  );
}

export function CampaignTopStrip({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "bg-campaign-purple px-4 py-2 text-center text-sm font-semibold text-white sm:text-base",
        className,
      )}
    >
      {children}
    </section>
  );
}

export function CampaignPageStack({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "mx-auto flex w-full max-w-7xl flex-col gap-3 px-3 py-3 sm:px-5 lg:px-6",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function CampaignPanel({
  children,
  className,
  tone = "default",
}: {
  children: ReactNode;
  className?: string;
  tone?: CampaignTone;
}) {
  return (
    <section
      className={cn(
        "rounded-[1.75rem] p-4 shadow-sm sm:p-5",
        panelToneClasses[tone],
        className,
      )}
    >
      {children}
    </section>
  );
}

export function CampaignHeader({
  actions,
  children,
  className,
  logo,
}: {
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  logo: ReactNode;
}) {
  return (
    <header
      className={cn(
        "rounded-[1.75rem] bg-campaign-panel px-4 py-4 shadow-sm sm:px-6",
        className,
      )}
    >
      <div className="grid gap-4 lg:grid-cols-[auto_minmax(0,1fr)_auto] lg:items-center">
        <div className="flex min-w-0 items-center gap-3">
          {logo}
          <div className="min-w-0">{children}</div>
        </div>
        {actions}
      </div>
    </header>
  );
}

export function CampaignLogoMark({
  alt,
  className,
  initials = "WC",
  src,
}: {
  alt?: string;
  className?: string;
  initials?: string;
  src?: string;
}) {
  return (
    <div
      className={cn(
        "flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-full bg-campaign-purple text-xl font-black text-white",
        className,
      )}
    >
      {src ? (
        <span
          aria-label={alt}
          className="size-full bg-cover bg-center"
          role={alt ? "img" : undefined}
          style={{ backgroundImage: `url(${src})` }}
        />
      ) : (
        <span aria-hidden={!alt}>{initials}</span>
      )}
    </div>
  );
}

export function CampaignHeading({
  children,
  className,
  eyebrow,
  inverted = false,
  titleClassName,
}: {
  children: ReactNode;
  className?: string;
  eyebrow?: string;
  inverted?: boolean;
  titleClassName?: string;
}) {
  return (
    <div className={cn("min-w-0", className)}>
      {eyebrow ? (
        <p
          className={cn(
            "text-xs font-black uppercase",
            inverted ? "text-campaign-yellow" : "text-campaign-magenta",
          )}
        >
          {eyebrow}
        </p>
      ) : null}
      <h1
        className={cn(
          "text-2xl font-black leading-tight text-campaign-purple-strong sm:text-4xl",
          inverted && "text-white",
          titleClassName,
        )}
      >
        {children}
      </h1>
    </div>
  );
}

export function CampaignSectionHeading({
  children,
  className,
  eyebrow,
  icon,
  inverted = false,
}: {
  children: ReactNode;
  className?: string;
  eyebrow: string;
  icon?: ReactNode;
  inverted?: boolean;
}) {
  return (
    <div className={cn("flex items-start justify-between gap-3", className)}>
      <div className="min-w-0">
        <p
          className={cn(
            "text-xs font-black uppercase",
            inverted ? "text-campaign-yellow" : "text-campaign-magenta",
          )}
        >
          {eyebrow}
        </p>
        <h2
          className={cn(
            "text-2xl font-black leading-tight text-campaign-purple-strong",
            inverted && "text-white",
          )}
        >
          {children}
        </h2>
      </div>
      {icon ? (
        <CampaignIconDisc inverted={inverted}>{icon}</CampaignIconDisc>
      ) : null}
    </div>
  );
}

export function CampaignIconDisc({
  children,
  className,
  inverted = false,
}: {
  children: ReactNode;
  className?: string;
  inverted?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex size-10 shrink-0 items-center justify-center rounded-full",
        inverted ? "bg-white text-campaign-purple" : "bg-campaign-purple text-white",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function CampaignPill({
  children,
  className,
  tone = "purple",
}: {
  children: ReactNode;
  className?: string;
  tone?: CampaignTone;
}) {
  return (
    <span
      className={cn(
        "inline-flex min-w-0 items-center gap-2 rounded-full px-3 py-1 text-sm font-black",
        panelToneClasses[tone],
        className,
      )}
    >
      {children}
    </span>
  );
}

export function CampaignMetric({
  className,
  label,
  tone = "default",
  value,
}: {
  className?: string;
  label: string;
  tone?: CampaignTone;
  value: string;
}) {
  return (
    <div
      className={cn(
        "rounded-2xl px-4 py-3",
        panelToneClasses[tone],
        className,
      )}
    >
      <p className={cn("text-xs font-black uppercase", eyebrowToneClasses[tone])}>
        {label}
      </p>
      <p className="mt-1 truncate text-xl font-black">{value}</p>
    </div>
  );
}

export function CampaignCompactRow({
  detail,
  marker,
  title,
  value,
}: {
  detail: string;
  marker?: ReactNode;
  title: string;
  value: string;
}) {
  return (
    <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3 rounded-2xl bg-white px-4 py-3">
      <div className="min-w-0">
        <p className="truncate font-black text-campaign-ink">{title}</p>
        <p className="truncate text-xs font-semibold text-campaign-muted">
          {detail}
        </p>
      </div>
      <CampaignPill className="shrink-0 text-white" tone="purple">
        <span className="truncate">{value}</span>
        {marker}
      </CampaignPill>
    </div>
  );
}
