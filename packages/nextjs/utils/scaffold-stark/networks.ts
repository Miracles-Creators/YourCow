import scaffoldConfig from "~~/scaffold.config";
import { devnet, sepolia, mainnet, Chain } from "@starknet-react/chains";
export const chains = {
  devnet,
  sepolia,
  mainnet,
};

type ChainAttributes = {
  // color | [lightThemeColor, darkThemeColor]
  color: string | [string, string];
  nativeCurrencyTokenAddress?: string;
};

export type ChainWithAttributes = Chain & Partial<ChainAttributes>;

export const NETWORKS_EXTRA_DATA: Record<string, ChainAttributes> = {
  [chains.devnet.network]: {
    color: "#b8af0c",
  },
  [chains.mainnet.network]: {
    color: "#ff8b9e",
  },
  [chains.sepolia.network]: {
    color: ["#5f4bb6", "#87ff65"],
  },
};
const VOYAGER_EXPLORER: Record<string, string> = {
  [chains.mainnet.network]: "https://voyager.online",
  [chains.sepolia.network]: "https://sepolia.voyager.online",
};

/**
 * Gives the block explorer transaction URL, returns empty string if the network is a local chain
 */
export function getBlockExplorerTxLink(network: string, txnHash: string) {
  if (network === chains.devnet.network) {
    return "";
  }

  const baseURL = VOYAGER_EXPLORER[network] ?? "https://voyager.online";
  return `${baseURL}/tx/${txnHash}`;
}

/**
 * Gives the block explorer URL for a given address.
 * Defaults to Voyager if no block explorer is configured for the network.
 */
export function getBlockExplorerAddressLink(network: Chain, address: string) {
  if (network.network === chains.devnet.network) {
    return `/blockexplorer/address/${address}`;
  }

  const baseURL = VOYAGER_EXPLORER[network.network] ?? "https://voyager.online";
  return `${baseURL}/contract/${address}`;
}

/**
 * Gives the block explorer URL for a given classhash.
 * Defaults to Voyager if no block explorer is configured for the network.
 */
export function getBlockExplorerClasshashLink(network: Chain, address: string) {
  if (network.network === chains.devnet.network) {
    return `/blockexplorer/class/${address}`;
  }

  const baseURL = VOYAGER_EXPLORER[network.network] ?? "https://voyager.online";
  return `${baseURL}/class/${address}`;
}

export function getBlockExplorerLink(network: Chain) {
  return VOYAGER_EXPLORER[network.network] ?? "https://voyager.online";
}

export function getTargetNetworks(): ChainWithAttributes[] {
  return scaffoldConfig.targetNetworks.map((targetNetwork) => ({
    ...targetNetwork,
  }));
}
