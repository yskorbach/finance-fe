import * as React from "react";

export function SectionHeader(props: { icon?: React.ReactNode; title: string; subtitle?: string }) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2">
        {props.icon}
        <h2 className="text-lg font-semibold">{props.title}</h2>
      </div>
      {props.subtitle && <p className="text-sm text-muted-foreground">{props.subtitle}</p>}
    </div>
  );
}
