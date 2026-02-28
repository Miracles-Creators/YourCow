import {
  ChevronDownIcon,
  ArrowLeftEndOnRectangleIcon,
} from "@heroicons/react/24/outline";
import { useDisconnect } from "@starknet-react/core";
import { notification } from "~~/utils/scaffold-stark";
import { useLocalStorage } from "usehooks-ts";

export const WrongNetworkDropdown = () => {
  const { disconnect } = useDisconnect();
  const [, setWasDisconnectedManually] = useLocalStorage<boolean>(
    "wasDisconnectedManually",
    false,
  );

  const handleDisconnect = () => {
    try {
      disconnect();
      localStorage.removeItem("lastConnectionTime");
      setWasDisconnectedManually(true);
      window.dispatchEvent(new Event("manualDisconnect"));
      notification.success("Disconnect successfully!");
    } catch (err) {
      console.error(err);
      notification.success("Disconnect failure!");
    }
  };

  return (
    <div className="dropdown dropdown-end">
      <label
        tabIndex={0}
        className="btn btn-sm gap-1 rounded-xl border border-red-200 bg-red-50 text-red-600 hover:bg-red-100"
      >
        <span className="text-sm font-medium">Wrong network</span>
        <ChevronDownIcon className="h-4 w-4" />
      </label>

      <ul
        tabIndex={0}
        className="dropdown-content menu p-2 mt-2 rounded-xl border border-vaca-neutral-gray-200 bg-vaca-neutral-white shadow-lg gap-1"
      >
        <li>
          <button
            className="menu-item btn-sm !rounded-xl flex gap-3 py-3 text-red-500 hover:text-red-600"
            type="button"
            onClick={handleDisconnect}
          >
            <ArrowLeftEndOnRectangleIcon className="h-5 w-5" />
            <span>Disconnect</span>
          </button>
        </li>
      </ul>
    </div>
  );
};
