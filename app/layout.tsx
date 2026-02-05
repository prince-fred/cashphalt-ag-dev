import type { Metadata } from "next";
import { Inter } from "next/font/google"; // Changed from Geist, Geist_Mono
import "./globals.css";

// Setup Inter font
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Cashphalt",
  description: "Parking made simple.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${inter.variable} antialiased font-inter bg-white text-matte-black`}
        suppressHydrationWarning
      >
        {children}
      </body>
    </html>
  );
}
