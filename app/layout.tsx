import type { Metadata } from "next";
import "./globals.css";
import "./workspace.css";
import "./workspace-runner.css";

export const metadata: Metadata = {
  title: "Session Studio — Design project planner",
  description: "Turn your design goals into sessions. Review methods, adjust agendas and prepare your next step.",
  icons: {
    icon: "/favicon.svg",
    shortcut: "/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">{children}</body>
    </html>
  );
}
