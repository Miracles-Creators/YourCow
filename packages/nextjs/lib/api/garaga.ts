import { apiFetch } from "./client";

export type ProofJobStatus = "pending" | "proving" | "verifying" | "done" | "failed";

export interface ProofJob {
  jobId: string;
  status: ProofJobStatus;
  txHash?: string;
  error?: string;
}

export async function startProof(lotId: number, thresholdPercent: number): Promise<{ jobId: string }> {
  return apiFetch<{ jobId: string }>("/garaga/prove-threshold", {
    method: "POST",
    body: JSON.stringify({ lotId: String(lotId), thresholdPercent }),
  });
}

export async function pollJob(jobId: string): Promise<ProofJob> {
  return apiFetch<ProofJob>(`/garaga/jobs/${jobId}`);
}
