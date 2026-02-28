import { Connector, useConnect } from "@starknet-react/core";
import { useRef, useState } from "react";
import { useLocalStorage } from "usehooks-ts";
import { BurnerConnector, burnerAccounts } from "@scaffold-stark/stark-burner";
import { BlockieAvatar } from "../BlockieAvatar";
import GenericModal from "./GenericModal";
import Wallet from "~~/components/scaffold-stark/CustomConnectButton/Wallet";
import { LAST_CONNECTED_TIME_LOCALSTORAGE_KEY } from "~~/utils/Constants";

const loader = ({ src }: { src: string }) => src;

const ConnectModal = () => {
  const modalRef = useRef<HTMLInputElement>(null);
  const [isBurnerWallet, setIsBurnerWallet] = useState(false);
  const { connectors, connect } = useConnect();
  const [, setLastConnector] = useLocalStorage<{ id: string; ix?: number }>(
    "lastUsedConnector",
    { id: "" },
  );
  const [, setLastConnectionTime] = useLocalStorage<number>(
    LAST_CONNECTED_TIME_LOCALSTORAGE_KEY,
    0,
  );
  const [, setWasDisconnectedManually] = useLocalStorage<boolean>(
    "wasDisconnectedManually",
    false,
  );

  const handleCloseModal = () => {
    if (modalRef.current) modalRef.current.checked = false;
  };

  function handleConnectWallet(
    e: React.MouseEvent<HTMLButtonElement>,
    connector: Connector,
  ) {
    if (connector.id === "burner-wallet") {
      setIsBurnerWallet(true);
      return;
    }
    setWasDisconnectedManually(false);
    connect({ connector });
    setLastConnector({ id: connector.id });
    setLastConnectionTime(Date.now());
    handleCloseModal();
  }

  function handleConnectBurner(
    e: React.MouseEvent<HTMLButtonElement>,
    ix: number,
  ) {
    const connector = connectors.find((it) => it.id == "burner-wallet");
    if (connector && connector instanceof BurnerConnector) {
      connector.burnerAccount = burnerAccounts[ix];
      setWasDisconnectedManually(false);
      connect({ connector });
      setLastConnector({ id: connector.id, ix });
      setLastConnectionTime(Date.now());
      handleCloseModal();
    }
  }

  return (
    <div>
      <label
        htmlFor="connect-modal"
        className="inline-flex size-10 cursor-pointer items-center justify-center rounded-full border border-slate-100 bg-white shadow-sm transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-vaca-green/30"
        aria-label="Connect wallet"
      >
        <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-slate-600"><path d="M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1"/><path d="M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4"/></svg>
      </label>
      <input
        ref={modalRef}
        type="checkbox"
        id="connect-modal"
        className="modal-toggle"
      />
      <GenericModal modalId="connect-modal">
        <>
          <div className="flex items-center justify-between">
            <h3 className="font-playfair text-xl font-bold text-vaca-green">
              {isBurnerWallet ? "Choose account" : "Connect a Wallet"}
            </h3>
            <label
              onClick={() => {
                setIsBurnerWallet(false);
              }}
              htmlFor="connect-modal"
              className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full text-vaca-neutral-gray-500 transition hover:bg-vaca-neutral-gray-100 hover:text-vaca-neutral-gray-700"
            >
              ✕
            </label>
          </div>
          <div className="flex flex-col flex-1">
            <div className="flex flex-col gap-3 w-full py-6">
              {!isBurnerWallet ? (
                <>
                  {connectors.map((connector, index) => (
                    <Wallet
                      key={connector.id || index}
                      connector={connector}
                      loader={loader}
                      handleConnectWallet={handleConnectWallet}
                    />
                  ))}
                </>
              ) : (
                <div className="flex flex-col justify-end gap-3">
                  <div className="max-h-[300px] overflow-y-auto flex w-full flex-col gap-2">
                    {burnerAccounts.map((burnerAcc, ix) => (
                      <div
                        key={burnerAcc.publicKey}
                        className="w-full flex flex-col"
                      >
                        <button
                          className="flex items-center gap-4 rounded-xl border border-vaca-neutral-gray-200 px-4 py-3 text-vaca-neutral-gray-700 transition hover:border-vaca-green hover:bg-vaca-green/5"
                          onClick={(e) => handleConnectBurner(e, ix)}
                        >
                          <BlockieAvatar
                            address={burnerAcc.accountAddress}
                            size={35}
                          />
                          {`${burnerAcc.accountAddress.slice(0, 6)}...${burnerAcc.accountAddress.slice(-4)}`}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </>
      </GenericModal>
    </div>
  );
};

export default ConnectModal;
