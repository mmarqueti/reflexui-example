import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "reflexui · full example",
  description: "Playground to validate reflexui with mocked profiles.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
