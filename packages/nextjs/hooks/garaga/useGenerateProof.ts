import { useCallback, useEffect, useRef, useState } from "react";
import { startProof, pollJob, type ProofJob, type ProofJobStatus } from "~~/lib/api/garaga";

type AnyStatus = ProofJobStatus | "idle";

interface State {
  status: AnyStatus;
  jobId: string | null;
  txHash: string | null;
  error: string | null;
}

const POLL_INTERVAL_MS = 5_000;

export function useGenerateProof(lotId: number) {
  const [state, setState] = useState<State>({
    status: "idle",
    jobId: null,
    txHash: null,
    error: null,
  });

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const stopPolling = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!state.jobId || state.status === "done" || state.status === "failed") return;

    const tick = async () => {
      try {
        const job: ProofJob = await pollJob(state.jobId!);
        setState(prev => ({
          ...prev,
          status: job.status,
          txHash: job.txHash ?? null,
          error: job.error ?? null,
        }));
        if (job.status === "done" || job.status === "failed") {
          stopPolling();
        }
      } catch {
        // keep polling on transient network errors
      }
    };

    intervalRef.current = setInterval(tick, POLL_INTERVAL_MS);
    return stopPolling;
  }, [state.jobId, state.status, stopPolling]);

  const generate = useCallback(async () => {
    setState({ status: "pending", jobId: null, txHash: null, error: null });
    try {
      const { jobId } = await startProof(lotId, 100);
      setState(prev => ({ ...prev, jobId, status: "proving" }));
    } catch (err) {
      setState({ status: "failed", jobId: null, txHash: null, error: err instanceof Error ? err.message : "Failed to start proof" });
    }
  }, [lotId]);

  return { ...state, generate };
}
