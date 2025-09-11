// app/layout.tsx
import Providers from "./providers";
import "@/styles/globals.css";

export const metadata = { title: "Finance Plan" };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pl" suppressHydrationWarning>
    <body
      className="min-h-screen bg-background text-foreground antialiased"
      suppressHydrationWarning
    >
    <Providers>{children}</Providers>
    </body>
    </html>
  );
}
