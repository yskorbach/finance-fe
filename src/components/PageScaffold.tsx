"use client";

import * as React from "react";
import Link from "next/link";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import type { ComponentProps } from "react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * PageScaffold — jednolity szablon nagłówka + layoutu strony w stylu shadcn/ui.
 * Użycie:
 *
 * <PageShell>
 *   <PageHeader
 *     title="Categories"
 *     description="Manage your budget categories and subcategories."
 *     backHref="/dashboard"
 *     breadcrumbs={[
 *       { label: "Dashboard", href: "/dashboard" },
 *       { label: "Categories" },
 *     ]}
 *     primaryAction={{ label: "Go to Dashboard", href: "/dashboard", icon: LayoutDashboard }}
 *   />
 *   <YourContent />
 * </PageShell>
 */
type ButtonProps = ComponentProps<typeof Button>;

export type Crumb = {
  label: string;
  href?: string; // ostatni okruszek bez href traktowany jest jako aktywny
};

export type HeaderAction = {
  label: string;
  href?: string;
  onClick?: () => void;
  icon?: React.ComponentType<{ className?: string }>;
  variant?: ButtonProps["variant"]; // default: default
  size?: ButtonProps["size"]; // default: default
  ariaLabel?: string;
};

export type PageHeaderProps = {
  title: string;
  description?: string;
  breadcrumbs?: Crumb[];
  backHref?: string; // pokaż przycisk "Back" gdy ustawione
  primaryAction?: HeaderAction; // główne CTA po prawej
  secondaryActions?: HeaderAction[]; // dodatkowe, np. Filtry
  className?: string;
};

export function PageHeader({
                             title,
                             description,
                             breadcrumbs,
                             backHref,
                             primaryAction,
                             secondaryActions,
                             className,
                           }: PageHeaderProps) {
  return (
    <div className={cn("grid gap-4", className)}>
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <div className="flex items-center gap-3">
          {backHref && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button asChild size="icon" variant="ghost" className="h-8 w-8">
                    <Link href={backHref} aria-label="Back">
                      <ArrowLeft className="h-4 w-4" />
                    </Link>
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">Back</TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}

          {breadcrumbs && breadcrumbs.length > 0 && (
            <Breadcrumb>
              <BreadcrumbList>
                {breadcrumbs.map((c, i) => {
                  const isLast = i === breadcrumbs.length - 1 || !c.href;
                  return (
                    <React.Fragment key={`${c.label}-${i}`}>
                      <BreadcrumbItem>
                        {isLast ? (
                          <BreadcrumbPage>{c.label}</BreadcrumbPage>
                        ) : (
                          <BreadcrumbLink asChild>
                            <Link href={c.href!}>{c.label}</Link>
                          </BreadcrumbLink>
                        )}
                      </BreadcrumbItem>
                      {i < breadcrumbs.length - 1 && (
                        <BreadcrumbSeparator />
                      )}
                    </React.Fragment>
                  );
                })}
              </BreadcrumbList>
            </Breadcrumb>
          )}
        </div>

        <div className="flex items-center gap-2">
          {secondaryActions?.map((a, idx) => (
            <HeaderButton key={idx} action={a} variant={a.variant ?? "outline"} size={a.size ?? "sm"} />
          ))}
          {primaryAction && (
            <HeaderButton action={primaryAction} variant={primaryAction.variant ?? "default"} size={primaryAction.size ?? "default"} />
          )}
        </div>
      </div>

      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div className="grid gap-1">
          <h1 className="text-2xl md:text-3xl font-semibold tracking-tight">{title}</h1>
          {description && (
            <p className="text-sm text-muted-foreground max-w-prose">{description}</p>
          )}
        </div>
      </div>

      <Separator />
    </div>
  );
}

function HeaderButton({ action, variant, size }: { action: HeaderAction; variant: ButtonProps["variant"]; size: ButtonProps["size"]; }) {
  const { label, href, onClick, icon: Icon, ariaLabel } = action;
  const content = (
    <Button className="gap-2" variant={variant} size={size} onClick={onClick} aria-label={ariaLabel ?? label} asChild={!!href}>
      {href ? (
        <Link href={href}>
          {Icon && <Icon className="h-4 w-4" />} {label}
        </Link>
      ) : (
        <>
          {Icon && <Icon className="h-4 w-4" />} {label}
        </>
      )}
    </Button>
  );
  return content;
}

export type PageShellProps = React.PropsWithChildren<{
  className?: string;
  containerClassName?: string;
}>;

/**
 * PageShell — wspólny kontener dla stron: padding + max-width + kolumnowy układ.
 */
export function PageShell({ children, className, containerClassName }: PageShellProps) {
  return (
    <main className={cn("p-6 md:p-10", className)}>
      <div className={cn("max-w-6xl mx-auto grid gap-6", containerClassName)}>
        {children}
      </div>
    </main>
  );
}

/**
 * PageSection — pomocnicza sekcja z odstępem i opcjonalnym nagłówkiem.
 */
export function PageSection({ title, children, className }: { title?: string; children: React.ReactNode; className?: string }) {
  return (
    <section className={cn("grid gap-3", className)}>
      {title && <h2 className="text-lg font-medium tracking-tight">{title}</h2>}
      {children}
    </section>
  );
}
