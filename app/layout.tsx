import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Soaring Photos",
  description: "Private photo & video sharing for our family",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-neutral-100 text-neutral-900 antialiased">
        {children}
      </body>
    </html>
  );
}
