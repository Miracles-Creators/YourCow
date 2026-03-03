import React, { useEffect, useMemo, useState } from "react";
import { Connector } from "@starknet-react/core";
import Image from "next/image";

const Wallet = ({
  handleConnectWallet,
  connector,
  loader,
}: {
  connector: Connector;
  loader: ({ src }: { src: string }) => string;
  handleConnectWallet: (
    e: React.MouseEvent<HTMLButtonElement>,
    connector: Connector,
  ) => void;
}) => {
  const [clicked, setClicked] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  const icon = useMemo(() => {
    return typeof connector.icon === "object"
      ? (connector.icon.light as string)
      : (connector.icon as string);
  }, [connector]);
  useEffect(() => {
    setIsMounted(true);
  }, []);

  return isMounted ? (
    <button
      className={`flex gap-4 items-center rounded-xl border border-vaca-neutral-gray-200 px-4 py-3 text-vaca-neutral-gray-700 transition hover:border-vaca-green hover:bg-vaca-green/5 ${clicked ? "border-vaca-green bg-vaca-green/5" : ""}`}
      onClick={(e) => {
        setClicked(true);
        handleConnectWallet(e, connector);
      }}
    >
      <div className="h-8 w-8 rounded-lg overflow-hidden">
        <Image
          alt={connector.name}
          loader={loader}
          src={icon}
          width={70}
          height={70}
          className="h-full w-full object-cover"
        />
      </div>
      <span className="text-sm font-medium">{connector.name}</span>
    </button>
  ) : null;
};

export default Wallet;
