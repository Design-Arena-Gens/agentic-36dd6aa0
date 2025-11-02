import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Deep Search PDF Generator - Free",
  description: "Generate comprehensive PDFs on any topic using advanced deep search",
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
