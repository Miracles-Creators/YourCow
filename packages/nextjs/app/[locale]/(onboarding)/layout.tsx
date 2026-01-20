"use client";

import type { ReactNode } from "react";
import { cn } from "~~/lib/utils/cn";

interface OnboardingLayoutProps {
  children: ReactNode;
}

/**
 * OnboardingLayout - Base layout for onboarding screens
 * Provides:
 * - Off-white calm background
 * - Organic floating gradient orbs
 * - Subtle grain texture
 * - Mobile-first responsive design
 * - Centered card-based layout
 */
export default function OnboardingLayout({ children }: OnboardingLayoutProps) {
  return (
    <div
      className={cn(
        "relative min-h-screen overflow-hidden bg-vaca-neutral-bg",
        "flex items-center justify-center",
        "px-4 py-8 sm:px-6 lg:px-8",
      )}
    >
      {/* Floating Background Orbs - Nature-inspired ambient gradients */}
      <div
        className="pointer-events-none absolute -left-48 -top-48 h-96 w-96 animate-float rounded-full opacity-15 blur-3xl"
        style={{
          background:
            "radial-gradient(circle, #1B5E20 0%, #2E7D32 50%, transparent 100%)",
          animationDelay: "0s",
        }}
        aria-hidden="true"
      />

      <div
        className="pointer-events-none absolute -bottom-32 -right-32 h-80 w-80 animate-float rounded-full opacity-15 blur-3xl"
        style={{
          background:
            "radial-gradient(circle, #4FC3F7 0%, #81D4FA 50%, transparent 100%)",
          animationDelay: "-10s",
        }}
        aria-hidden="true"
      />

      {/* Subtle Grain Texture Overlay */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.03]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
        }}
        aria-hidden="true"
      />

      {/* Content */}
      <main className="relative z-10 w-full max-w-md">{children}</main>
    </div>
  );
}
