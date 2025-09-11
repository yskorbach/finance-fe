import Link from "next/link";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { type PropsWithChildren } from "react";

type Props = PropsWithChildren<{
  title: string;
  subtitle?: string;
  footer?: { text: string; linkText: string; href: string };
}>;

export function AuthCard({ title, subtitle, footer, children }: Props) {
  return (
    <Card className="w-full max-w-md shadow-lg">
      <CardHeader>
        <CardTitle className="text-2xl">{title}</CardTitle>
        {subtitle ? <CardDescription>{subtitle}</CardDescription> : null}
      </CardHeader>
      <CardContent>{children}</CardContent>
      {footer ? (
        <div className="px-6 pb-6 text-sm text-muted-foreground">
          {footer.text}{" "}
          <Link href={footer.href} className="text-primary underline-offset-4 hover:underline">
            {footer.linkText}
          </Link>
        </div>
      ) : null}
    </Card>
  );
}
