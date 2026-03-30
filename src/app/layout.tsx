import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "OTLP Log Viewer",
  description: "View and explore OTLP log data",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="font-sans antialiased bg-white text-slate-900 min-h-screen">
        {children}
      </body>
    </html>
  );
}
