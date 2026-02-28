"use client";
import { useEffect, useMemo, useState } from "react";
import { useConnect, useNetwork } from "@starknet-react/core";
import { Address } from "@starknet-react/chains";
import { AddressInfoDropdown } from "./AddressInfoDropdown";
import { WrongNetworkDropdown } from "./WrongNetworkDropdown";
import ConnectModal from "./ConnectModal";
import { AddressQRCodeModal } from "./AddressQRCodeModal";
import { useAutoConnect } from "~~/hooks/scaffold-stark";
import { useTargetNetwork } from "~~/hooks/scaffold-stark/useTargetNetwork";
import { useAccount } from "~~/hooks/useAccount";
import { useMe } from "~~/hooks/auth/useMe";
import { useAutoLinkWallet } from "~~/hooks/auth/useLinkWallet";
import { getBlockExplorerAddressLink } from "~~/utils/scaffold-stark";
import { useReadLocalStorage } from "usehooks-ts";

export const CustomConnectButton = () => {
  useAutoConnect();
  const { connector } = useConnect();
  const { targetNetwork } = useTargetNetwork();
  const { chain } = useNetwork();
  const { account, status, address: accountAddress } = useAccount();
  const { data: me } = useMe();
  const { tryLinkWallet } = useAutoLinkWallet();
  const wasDisconnectedManually = useReadLocalStorage<boolean>(
    "wasDisconnectedManually",
  );
  const [accountChainId, setAccountChainId] = useState<bigint>(0n);
  const [linkTrigger, setLinkTrigger] = useState(0);

  const blockExplorerAddressLink = useMemo(() => {
    return accountAddress
      ? getBlockExplorerAddressLink(targetNetwork, accountAddress)
      : "";
  }, [accountAddress, targetNetwork]);

  // effect to get chain id and address from account
  useEffect(() => {
    const getChainId = async () => {
      try {
        if (account?.channel?.getChainId) {
          const chainId = await account.channel.getChainId();
          setAccountChainId(BigInt(chainId));
        } else if (chain?.id) {
          setAccountChainId(BigInt(chain.id));
        }
      } catch (err) {
        console.error("Failed to get chainId:", err);
      }
    };

    getChainId();
  }, [account, status, chain?.id]);

  useEffect(() => {
    tryLinkWallet({ status, account, accountAddress, me });
  }, [account, accountAddress, tryLinkWallet, me, status, linkTrigger]);

  useEffect(() => {
    const handleConnectorChange = (event: { chainId?: bigint }) => {
      if (event.chainId && event.chainId !== accountChainId) {
        setAccountChainId(event.chainId);
      }
      setLinkTrigger((v) => v + 1);
    };
    connector?.on("change", handleConnectorChange);
    return () => {
      connector?.off("change", handleConnectorChange);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [connector]);

  useEffect(() => {
    if (status === "connected" && accountAddress) {
      setLinkTrigger((value) => value + 1);
    }
  }, [status, accountAddress]);

  if (status === "disconnected" || wasDisconnectedManually) {
    return <ConnectModal />;
  }

  const isLoading =
    status === "connected" &&
    (!accountAddress || !chain?.name || accountChainId === 0n);

  if (isLoading) {
    return (
      <button
        type="button"
        disabled
        className="w-36 h-10 rounded-xl bg-vaca-neutral-gray-100 animate-pulse"
      >
        &nbsp;
      </button>
    );
  }

  if (accountChainId !== targetNetwork.id) {
    return <WrongNetworkDropdown />;
  }

  return (
    <>
      <AddressInfoDropdown
        address={accountAddress as Address}
        displayName=""
        blockExplorerAddressLink={blockExplorerAddressLink}
      />
      <AddressQRCodeModal
        address={accountAddress as Address}
        modalId="qrcode-modal"
      />
    </>
  );
};
