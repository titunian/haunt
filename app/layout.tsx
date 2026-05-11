import type { Metadata } from "next";
import GhostDefs from "@/components/GhostDefs";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://haunt-pied.vercel.app"),
  title: {
    default: "Haunt — every coding session, haunted",
    template: "%s · Haunt",
  },
  description:
    "A little daemon that catches every Claude Code, Codex, and Cursor session the moment it ends, and stows it as clean, searchable markdown. Install once.",
  openGraph: {
    title: "Haunt — every coding session, haunted",
    description:
      "A little daemon that catches every Claude Code, Codex, and Cursor session the moment it ends, and stows it as clean, searchable markdown.",
    url: "https://haunt-pied.vercel.app",
    siteName: "Haunt",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Haunt — every coding session, haunted",
    description:
      "Every Claude Code, Codex, and Cursor session, archived as clean markdown. Install once.",
  },
  icons: { icon: "/favicon.svg" },
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link rel="preconnect" href="https://cdn.jsdelivr.net" />
        <link
          href="https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable.min.css"
        />
      </head>
      <body>
        <GhostDefs />
        {children}
      </body>
    </html>
  );
}
