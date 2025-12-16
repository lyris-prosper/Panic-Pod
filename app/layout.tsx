import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Panic Pod - Cross-Chain Emergency Evacuation",
  description: "One Click, All Chains, Safe Exit. Evacuate your BTC, ETH, and Solana assets simultaneously when market crashes.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="relative">
        <div className="relative z-10">
          {children}
        </div>
      </body>
    </html>
  );
}
