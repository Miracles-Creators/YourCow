import { useMutation } from "@tanstack/react-query";

import { verifyLatestAuditBatch } from "~~/lib/api/audit";

export function useVerifyLatestAuditBatch() {
  return useMutation({
    mutationFn: verifyLatestAuditBatch,
  });
}
