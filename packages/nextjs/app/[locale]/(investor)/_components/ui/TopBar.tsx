"use client";

import { BRAND_COPY } from "~~/lib/constants/brand";
import { CustomConnectButton } from "~~/components/scaffold-stark/CustomConnectButton";
import { CowLogo } from "./Logo";

export function TopBar() {
  return (
    <header className="sticky top-0 z-50 mb-6 flex w-full items-center justify-between border-b border-vaca-neutral-gray-100/50 bg-vaca-neutral-bg/80 px-2 py-3 backdrop-blur-md">
      {/* Brand — hidden on desktop (SideNav owns it) */}
      <div className="flex items-center gap-2.5 lg:hidden">
        <CowLogo className="h-8 w-8" />
        <span className="font-playfair text-base font-bold tracking-tight text-vaca-neutral-gray-900">
          {BRAND_COPY.name}
        </span>
      </div>

      {/* Wallet — always visible, pushed right on desktop */}
      <div className="ml-auto flex items-center gap-3">
        <CustomConnectButton />
      </div>
    </header>
  );
}
