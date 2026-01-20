import { useMutation } from "@tanstack/react-query";

import { approveLot } from "~~/lib/api/lots";
import { type ApproveLotInput } from "~~/lib/api/schemas";

type ApproveLotPayload = {
  lotId: number;
  data: ApproveLotInput;
};

export function useApproveLot() {
  return useMutation({
    mutationFn: ({ lotId, data }: ApproveLotPayload) => approveLot(lotId, data),
  });
}
