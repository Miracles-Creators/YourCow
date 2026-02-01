import { useMutation } from "@tanstack/react-query";

import { createAuditBatch } from "~~/lib/api/audit";

export function useCreateAuditBatch() {
  return useMutation({
    mutationFn: createAuditBatch,
  });
}
