import { useRef, useState } from "react";
import { NetworkOptions } from "./NetworkOptions";
import CopyToClipboard from "react-copy-to-clipboard";
import { createPortal } from "react-dom";
import {
  ArrowLeftEndOnRectangleIcon,
  ArrowTopRightOnSquareIcon,
  CheckCircleIcon,
  ChevronDownIcon,
  DocumentDuplicateIcon,
  QrCodeIcon,
  UserCircleIcon,
} from "@heroicons/react/24/outline";
import { useLocalStorage } from "usehooks-ts";
import {
  BlockieAvatar,
  isStarknetName,
} from "~~/components/scaffold-stark";
import { useOutsideClick } from "~~/hooks/scaffold-stark";
import { BurnerConnector, burnerAccounts } from "@scaffold-stark/stark-burner";
import { getTargetNetworks, notification } from "~~/utils/scaffold-stark";
import { Address } from "@starknet-react/chains";
import { useDisconnect, useNetwork, useConnect } from "@starknet-react/core";
import { useScaffoldStarkProfile } from "~~/hooks/scaffold-stark/useScaffoldStarkProfile";

const allowedNetworks = getTargetNetworks();

type AddressInfoDropdownProps = {
  address: Address;
  blockExplorerAddressLink: string | undefined;
  displayName: string;
};

export const AddressInfoDropdown = ({
  address,
  displayName,
  blockExplorerAddressLink,
}: AddressInfoDropdownProps) => {
  const { disconnect } = useDisconnect();
  const [addressCopied, setAddressCopied] = useState(false);
  const { data: profile } = useScaffoldStarkProfile(address);
  const { chain } = useNetwork();
  const [showBurnerAccounts, setShowBurnerAccounts] = useState(false);
  const [selectingNetwork, setSelectingNetwork] = useState(false);
  const { connectors, connect } = useConnect();
  const dropdownRef = useRef<HTMLDetailsElement>(null);
  const closeDropdown = () => {
    setSelectingNetwork(false);
    dropdownRef.current?.removeAttribute("open");
  };

  useOutsideClick(dropdownRef, closeDropdown);

  function handleConnectBurner(
    e: React.MouseEvent<HTMLButtonElement>,
    ix: number,
  ) {
    const connector = connectors.find((it) => it.id == "burner-wallet");
    if (connector && connector instanceof BurnerConnector) {
      connector.burnerAccount = burnerAccounts[ix];
      connect({ connector });
      setLastConnector({ id: connector.id, ix });
      setShowBurnerAccounts(false);
    }
  }

  const [_, setLastConnector] = useLocalStorage<{ id: string; ix?: number }>(
    "lastUsedConnector",
    { id: "" },
    {
      initializeWithValue: false,
    },
  );

  const [, setWasDisconnectedManually] = useLocalStorage<boolean>(
    "wasDisconnectedManually",
    false,
    {
      initializeWithValue: false,
    },
  );

  const handleDisconnect = () => {
    try {
      disconnect();
      localStorage.removeItem("lastUsedConnector");
      localStorage.removeItem("lastConnectionTime");
      setWasDisconnectedManually(true);
      window.dispatchEvent(new Event("manualDisconnect"));
      notification.success("Disconnect successfully!");
    } catch (err) {
      console.log(err);
      notification.success("Disconnect failure!");
    }
  };
  return (
    <>
      <details ref={dropdownRef} className="dropdown dropdown-end leading-3">
        <summary className="btn btn-sm gap-0 !h-auto rounded-full border-none bg-vaca-green px-3 py-1.5 text-white shadow-none transition hover:bg-vaca-green/90">
          <span className="text-xs font-medium tracking-wide">
            {isStarknetName(displayName)
              ? displayName
              : profile?.name ||
                address?.slice(0, 6) + "..." + address?.slice(-4)}
          </span>
          <ChevronDownIcon className="h-3.5 w-3.5 text-white/70 ml-1" />
        </summary>
        <ul
          tabIndex={0}
          className="dropdown-content menu z-10 p-2 mt-2 rounded-xl gap-1 border border-vaca-neutral-gray-200 bg-vaca-neutral-white shadow-lg"
        >
          <NetworkOptions hidden={!selectingNetwork} />
          <li className={selectingNetwork ? "hidden" : ""}>
            {addressCopied ? (
              <div className="btn-sm !rounded-xl flex gap-3">
                <CheckCircleIcon
                  className="text-xl font-normal h-6 w-4 cursor-pointer ml-2 sm:ml-0"
                  aria-hidden="true"
                />
                <span className=" whitespace-nowrap">Copy address</span>
              </div>
            ) : (
              //@ts-ignore
              <CopyToClipboard
                text={address}
                onCopy={() => {
                  setAddressCopied(true);
                  setTimeout(() => {
                    setAddressCopied(false);
                  }, 800);
                }}
              >
                <div className="btn-sm !rounded-xl flex gap-3">
                  <DocumentDuplicateIcon
                    className="text-xl font-normal h-6 w-4 cursor-pointer ml-2 sm:ml-0"
                    aria-hidden="true"
                  />
                  <span className=" whitespace-nowrap">Copy address</span>
                </div>
              </CopyToClipboard>
            )}
          </li>
          <li className={selectingNetwork ? "hidden" : ""}>
            <label
              htmlFor="qrcode-modal"
              className="btn-sm !rounded-xl flex gap-3"
            >
              <QrCodeIcon className="h-6 w-4 ml-2 sm:ml-0" />
              <span className="whitespace-nowrap">View QR Code</span>
            </label>
          </li>
          {chain.network != "devnet" ? (
            <li className={selectingNetwork ? "hidden" : ""}>
              <button
                className="menu-item btn-sm !rounded-xl flex gap-3"
                type="button"
              >
                <ArrowTopRightOnSquareIcon className="h-6 w-4 ml-2 sm:ml-0" />
                <a
                  target="_blank"
                  href={blockExplorerAddressLink}
                  rel="noopener noreferrer"
                  className="whitespace-nowrap"
                >
                  View on Block Explorer
                </a>
              </button>
            </li>
          ) : null}

          {chain.network == "devnet" ? (
            <li className={selectingNetwork ? "hidden" : ""}>
              <button
                className="menu-item btn-sm !rounded-xl flex gap-3 "
                type="button"
                onClick={() => {
                  setShowBurnerAccounts(true);
                }}
              >
                <UserCircleIcon className="h-6 w-4 ml-2 sm:ml-0" />
                <span className="whitespace-nowrap">Switch Account</span>
              </button>
            </li>
          ) : null}

          {showBurnerAccounts &&
            createPortal(
              <>
                <div className="justify-center items-center flex overflow-x-hidden overflow-y-auto fixed inset-0 z-50 outline-none focus:outline-none">
                  <div className="relative w-auto my-6 mx-auto max-w-5xl">
                    <div className="rounded-2xl border border-vaca-neutral-gray-200 bg-vaca-neutral-white shadow-xl relative w-full mx-auto md:max-h-[30rem] md:max-w-[25rem] outline-none focus:outline-none">
                      <div className="flex items-start justify-between p-4 pt-8 rounded-t">
                        <div className="flex justify-center items-center w-11/12">
                          <h2 className="font-playfair text-lg text-center text-vaca-green font-bold m-0">
                            Choose Account
                          </h2>
                        </div>
                        <button
                          className="w-8 h-8 rounded-full justify-center items-center flex text-vaca-neutral-gray-500 hover:bg-vaca-neutral-gray-100 hover:text-vaca-neutral-gray-700 transition"
                          onClick={() => setShowBurnerAccounts(false)}
                        >
                          <svg
                            xmlns="http://www.w3.org/2000/svg"
                            width="24"
                            height="24"
                            viewBox="0 0 24 24"
                          >
                            <path
                              fill="currentColor"
                              d="m6.4 18.308l-.708-.708l5.6-5.6l-5.6-5.6l.708-.708l5.6 5.6l5.6-5.6l.708.708l-5.6 5.6l5.6 5.6l-.708.708l-5.6-5.6z"
                            />
                          </svg>
                        </button>
                      </div>
                      <div className="flex flex-col items-center justify-center gap-3 mx-6 pb-8 pt-6">
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
                                ></BlockieAvatar>
                                {`${burnerAcc.accountAddress.slice(
                                  0,
                                  6,
                                )}...${burnerAcc.accountAddress.slice(-4)}`}
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="backdrop-blur-sm fixed inset-0 z-40"></div>
              </>,
              document.body,
            )}

          {/* TODO: reinstate if needed */}
          {/* {allowedNetworks.length > 1 ? (
            <li className={selectingNetwork ? "hidden" : ""}>
              <button
                className="btn-sm !rounded-xl flex gap-3 py-3"
                type="button"
                onClick={() => {
                  setSelectingNetwork(true);
                }}
              >
                <ArrowsRightLeftIcon className="h-6 w-4 ml-2 sm:ml-0" />{" "}
                <span>Switch Network</span>
              </button>
            </li>
          ) : null} */}
          <li className={selectingNetwork ? "hidden" : "p-0"}>
            <button
              className="menu-item btn-sm text-sm !rounded-xl flex gap-3 text-red-500 hover:text-red-600"
              type="button"
              onClick={handleDisconnect}
            >
              <ArrowLeftEndOnRectangleIcon className="h-6 w-4 ml-2 sm:ml-0" />{" "}
              <span>Disconnect</span>
            </button>
          </li>
        </ul>
      </details>
    </>
  );
};
