import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import "bootstrap/dist/css/bootstrap.min.css";
import "bootstrap-icons/font/bootstrap-icons.css";
import Navigation from "./Navigation";
import BootstrapClient from "./BootstrapClient";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Car Expense & Mileage Tracker",
  description: "Track your vehicle expenses, fuel refills, and mileage over time",
};

/**
 * RootLayout Component
 * 
 * Main layout for the application with Bootstrap styling and responsive navigation.
 * Features:
 * - Bootstrap CSS import
 * - Bootstrap Icons for UI elements
 * - Responsive navigation bar with logout functionality
 * - Consistent layout across all pages
 * 
 * Requirements: 7.1, 7.2, 7.5
 */
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable}`}>
        <BootstrapClient />
        <Navigation />
        <main className="container-fluid py-4">
          {children}
        </main>
      </body>
    </html>
  );
}
