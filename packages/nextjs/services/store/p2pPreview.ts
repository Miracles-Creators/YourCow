import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

type P2PPreviewState = {
  currentWei: string;
  pendingWei: string;
  fundBalance: (amountWei: string) => void;
  spendBalance: (amountWei: string) => void;
  reset: () => void;
};

const DEFAULT_CURRENT_WEI = (96n * 10n ** 18n).toString();
const DEFAULT_PENDING_WEI = (8n * 10n ** 18n).toString();

export const useP2PPreviewStore = create<P2PPreviewState>()(
  persist(
    set => ({
      currentWei: DEFAULT_CURRENT_WEI,
      pendingWei: DEFAULT_PENDING_WEI,
      fundBalance: amountWei =>
        set(state => ({
          currentWei: (BigInt(state.currentWei) + BigInt(amountWei)).toString(),
        })),
      spendBalance: amountWei =>
        set(state => ({
          currentWei: (BigInt(state.currentWei) - BigInt(amountWei)).toString(),
        })),
      reset: () =>
        set({
          currentWei: DEFAULT_CURRENT_WEI,
          pendingWei: DEFAULT_PENDING_WEI,
        }),
    }),
    {
      name: "yc_p2p_preview",
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
