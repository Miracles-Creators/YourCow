"use client";

import React, { useEffect, useState } from "react";
import { Toaster } from "react-hot-toast";
import { StarknetConfig, starkscan } from "@starknet-react/core";

import { appChains, connectors } from "~~/services/web3/connectors";
import provider from "~~/services/web3/provider";

// SCAFFOLD-STARK: All scaffold chrome removed (Header, Footer, gradient circles).
// YourCow uses its own layout system per route group:
//   - (investor) → InvestorLayout
//   - (producer) → producer layout
//   - (admin) → admin layout
// Only StarknetConfig + Toaster remain as global providers.

export const ScaffoldStarkAppWithProviders = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) return null;

  return (
    <StarknetConfig
      chains={appChains}
      provider={provider}
      connectors={connectors}
      explorer={starkscan}
    >
      {children}
      <Toaster />
    </StarknetConfig>
  );
};
