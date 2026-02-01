import { apiFetch } from "./client";
import {
  AuditBatchSchema,
  AuditBatchVerificationSchema,
  type AuditBatchDto,
  type AuditBatchVerificationDto,
} from "./schemas";

export async function createAuditBatch(): Promise<AuditBatchDto> {
  const batch = await apiFetch<AuditBatchDto>("/audit/batch", {
    method: "POST",
  });
  return AuditBatchSchema.parse(batch);
}

export async function verifyLatestAuditBatch(): Promise<AuditBatchVerificationDto> {
  const verification = await apiFetch<AuditBatchVerificationDto>(
    "/audit/batch/verify-latest",
  );
  return AuditBatchVerificationSchema.parse(verification);
}
