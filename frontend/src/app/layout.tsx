import type { Metadata } from "next";
import { Plus_Jakarta_Sans, Space_Grotesk } from "next/font/google";
import "./globals.css";
import { SettingsProvider } from "./components/SettingsProvider";
import { AppShell } from "./components/AppShell";
import { AuthGate } from "./components/AuthGate";

const spaceGrotesk = Space_Grotesk({
  variable: "--font-display",
  subsets: ["latin"],
});

const jakartaSans = Plus_Jakarta_Sans({
  variable: "--font-body",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "RetailOps Console",
  description: "RetailOps operations console for products, orders, and billing.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${spaceGrotesk.variable} ${jakartaSans.variable}`}
        suppressHydrationWarning
      >
        <SettingsProvider>
          <AuthGate>
            <AppShell>{children}</AppShell>
          </AuthGate>
        </SettingsProvider>
      </body>
    </html>
  );
}
