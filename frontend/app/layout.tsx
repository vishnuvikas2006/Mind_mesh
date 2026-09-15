import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "MindMesh | Support · Monitor · Heal",
  description: "A human-reviewed wellbeing support platform.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body>{children}</body></html>;
}
