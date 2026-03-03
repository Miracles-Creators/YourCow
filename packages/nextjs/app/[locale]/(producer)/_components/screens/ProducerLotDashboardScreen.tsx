"use client";

import { motion, useReducedMotion } from "framer-motion";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useMemo, useState } from "react";
import { z } from "zod";
import { cn } from "~~/lib/utils/cn";
import { useAnimalsByLot } from "~~/hooks/animals/useAnimalsByLot";
import { useCreateAnimal } from "~~/hooks/animals/useCreateAnimal";
import { useLot } from "~~/hooks/lots/useLot";
import { useQueryClient } from "@tanstack/react-query";
import { FundingProgress } from "../ui/FundingProgress";
import { StatusPill, type StatusTone } from "../ui/StatusPill";
import type { AnimalApprovalStatus } from "~~/lib/api/schemas";

/**
 * Maps approval status to UI display properties
 */
function getApprovalStatusDisplay(status?: AnimalApprovalStatus): {
  label: string;
  tone: StatusTone;
  description: string;
} {
  switch (status) {
    case "APPROVED":
      return {
        label: "Approved",
        tone: "success",
        description: "Registered on-chain",
      };
    case "REJECTED":
      return {
        label: "Rejected",
        tone: "warning",
        description: "Contact admin for details",
      };
    case "PENDING_APPROVAL":
    default:
      return {
        label: "Pending approval",
        tone: "info",
        description: "Awaiting admin review",
      };
  }
}

function getLotStatusDisplay(
  status?: string,
): { label: string; tone: StatusTone } {
  switch (status) {
    case "ACTIVE":
      return { label: "Active", tone: "success" };
    case "FUNDING":
      return { label: "Funding", tone: "warning" };
    case "COMPLETED":
      return { label: "Completed", tone: "neutral" };
    case "SETTLING":
      return { label: "Settling", tone: "warning" };
    case "PENDING_DEPLOY":
    case "DRAFT":
    default:
      return { label: "Pending", tone: "info" };
  }
}

const AnimalFormSchema = z.object({
  eid: z.string().min(1, "EID is required."),
  custodian: z.string().min(1, "Custodian wallet is required."),
  breed: z.string().min(1, "Breed is required."),
  initialWeight: z
    .string()
    .min(1, "Initial weight is required.")
    .refine(value => Number.parseFloat(value) > 0, "Initial weight must be > 0."),
});

export function ProducerLotDashboardScreen() {
  const prefersReducedMotion = useReducedMotion();
  const params = useParams();
  const lotId = typeof params.lotId === "string" ? Number(params.lotId) : 0;
  const queryClient = useQueryClient();
  const lotQuery = useLot(lotId);
  const animalsQuery = useAnimalsByLot(lotId);
  const createAnimal = useCreateAnimal();
  const [animalForm, setAnimalForm] = useState({
    eid: "",
    custodian: "",
    breed: "",
    initialWeight: "",
  });
  const [animalError, setAnimalError] = useState("");
  const [animalSuccess, setAnimalSuccess] = useState("");
  const transition = useMemo(
    () =>
      prefersReducedMotion
        ? { duration: 0 }
        : { duration: 0.4, ease: [0.4, 0, 0.2, 1] as const },
    [prefersReducedMotion],
  );
  const lotStatus = useMemo(
    () => getLotStatusDisplay(lotQuery.data?.status),
    [lotQuery.data?.status],
  );
  const totalCapital = useMemo(() => {
    if (!lotQuery.data) return null;
    return lotQuery.data.totalShares * lotQuery.data.pricePerShare;
  }, [lotQuery.data]);
  const fundedPercent = lotQuery.data?.fundedPercent ?? 0;
  const amountRaised = useMemo(() => {
    if (!totalCapital || lotQuery.data?.fundedPercent == null) return "—";
    const raised = (totalCapital * lotQuery.data.fundedPercent) / 100;
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
    }).format(raised);
  }, [totalCapital, lotQuery.data?.fundedPercent]);
  const lastUpdateLabel = useMemo(() => {
    if (!lotQuery.data?.updatedAt) return "—";
    return new Date(lotQuery.data.updatedAt).toLocaleDateString();
  }, [lotQuery.data?.updatedAt]);
  const canRegisterSale = lotQuery.data?.status === "ACTIVE";
  const handleAnimalChange = (field: keyof typeof animalForm, value: string) => {
    setAnimalForm(prev => ({ ...prev, [field]: value }));
    setAnimalError("");
    setAnimalSuccess("");
  };

  const handleAddAnimal = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setAnimalError("");
    setAnimalSuccess("");

    const parsed = AnimalFormSchema.safeParse(animalForm);
    if (!parsed.success) {
      setAnimalError(parsed.error.issues[0]?.message ?? "Invalid data.");
      return;
    }

    try {
      const initialWeightKg = Number.parseFloat(parsed.data.initialWeight);
      const initialWeightGrams = Math.round(initialWeightKg * 1000);
      await createAnimal.mutateAsync({
        eid: parsed.data.eid,
        custodian: parsed.data.custodian,
        initialWeightGrams,
        lotId,
        profile: {
          breed: parsed.data.breed,
        },
      });
      setAnimalSuccess("Animal registered. Pending admin approval.");
      setAnimalForm({ eid: "", custodian: "", breed: "", initialWeight: "" });
      queryClient.invalidateQueries({ queryKey: ["animals", "lot", lotId] });
    } catch (error) {
      setAnimalError(
        error instanceof Error ? error.message : "Failed to register animal.",
      );
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={transition}
      className="space-y-8"
    >
      <header className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <h1 className="font-playfair text-4xl font-semibold text-vaca-neutral-gray-900">
            {lotQuery.data?.name ?? (lotQuery.isPending ? "Loading..." : "Lot")}
          </h1>
          <StatusPill label={lotStatus.label} tone={lotStatus.tone} />
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Link
            href={`/producer/lots/${lotId}/updates/new`}
            className={cn(
              "btn btn-primary w-full sm:w-auto",
              "border-vaca-green bg-vaca-green text-vaca-neutral-white hover:bg-vaca-green-dark",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-vaca-blue focus-visible:ring-offset-2 focus-visible:ring-offset-vaca-neutral-bg",
            )}
          >
            Add Update
          </Link>
          <Link
            href={`/producer/lots/${lotId}/timeline`}
            className={cn(
              "btn btn-outline w-full sm:w-auto",
              "border-vaca-blue text-vaca-blue hover:bg-vaca-blue/10",
            )}
          >
            View Timeline
          </Link>
          {canRegisterSale ? (
            <Link
              href={`/producer/lots/${lotId}/sale`}
              className={cn(
                "btn btn-outline w-full sm:w-auto",
                "border-vaca-brown text-vaca-brown hover:bg-vaca-brown/10",
              )}
            >
              Register Sale
            </Link>
          ) : (
            <button
              type="button"
              disabled
              title="Available when the lot is ACTIVE"
              className={cn(
                "btn btn-outline w-full sm:w-auto",
                "border-vaca-brown/40 text-vaca-brown/60",
                "cursor-not-allowed opacity-70",
              )}
            >
              Register Sale
            </button>
          )}
        </div>
      </header>

      <section className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-xl border border-vaca-neutral-gray-100 bg-vaca-neutral-white p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-vaca-neutral-gray-700">
            Funding progress
          </h2>
          <p className="mt-2 text-2xl font-semibold text-vaca-green">
            {amountRaised}
          </p>
          <FundingProgress value={fundedPercent} className="mt-4" />
        </div>
        <div className="rounded-xl border border-vaca-neutral-gray-100 bg-vaca-neutral-white p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-vaca-neutral-gray-700">
            Next required update
          </h2>
          <p className="mt-3 font-playfair text-2xl text-vaca-blue">
            —
          </p>
          <p className="mt-1 text-xs text-vaca-neutral-gray-500">
            Please submit by end of day.
          </p>
        </div>
        <div className="rounded-xl border border-vaca-neutral-gray-100 bg-vaca-neutral-white p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-vaca-neutral-gray-700">
            Last update
          </h2>
          <p className="mt-3 text-sm text-vaca-neutral-gray-600">
            {lastUpdateLabel}
          </p>
        </div>
      </section>

      <section className="rounded-xl border-l-4 border-vaca-brown bg-vaca-neutral-white p-5">
        <h2 className="text-sm font-semibold text-vaca-brown">
          This is what investors see
        </h2>
        <ul className="mt-3 space-y-2 text-sm text-vaca-neutral-gray-600">
          <li>Last weight update: —</li>
          <li>Last health check: —</li>
          <li>
            Producer video:{" "}
            Not added
          </li>
        </ul>
      </section>

      <section className="grid gap-6 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
        <div className="rounded-xl border border-vaca-neutral-gray-100 bg-vaca-neutral-white p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-vaca-neutral-gray-700">
            Animals in this lot
          </h2>
          <div className="mt-4 space-y-3 text-sm text-vaca-neutral-gray-600">
            {animalsQuery.isLoading && <p>Loading animals...</p>}
            {animalsQuery.isError && (
              <p className="text-vaca-brown">
                {animalsQuery.error instanceof Error
                  ? animalsQuery.error.message
                  : "Failed to load animals."}
              </p>
            )}
            {!animalsQuery.isLoading && animalsQuery.data?.length === 0 && (
              <p>No animals registered yet.</p>
            )}
            {animalsQuery.data?.map(animal => {
              const approvalDisplay = getApprovalStatusDisplay(animal.approvalStatus);
              return (
                <div
                  key={animal.id}
                  className="flex items-center justify-between rounded-lg border border-vaca-neutral-gray-100 px-4 py-3"
                >
                  <div className="space-y-1">
                    <p className="font-semibold text-vaca-neutral-gray-900">
                      {animal.eid}
                    </p>
                    <p className="text-xs text-vaca-neutral-gray-500">
                      Custodian: {animal.custodian}
                    </p>
                    <p className="text-xs text-vaca-neutral-gray-400">
                      {approvalDisplay.description}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1.5">
                    <StatusPill
                      label={animal.status}
                      tone={animal.status === "ALIVE" ? "success" : "warning"}
                    />
                    <StatusPill
                      label={approvalDisplay.label}
                      tone={approvalDisplay.tone}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="rounded-xl border border-vaca-neutral-gray-100 bg-vaca-neutral-white p-5 shadow-sm">
          <h2 className="text-sm font-semibold text-vaca-neutral-gray-700">
            Register animal
          </h2>
          <div className="mt-3 rounded-lg border border-vaca-blue/20 bg-vaca-blue/5 p-3">
            <p className="text-xs text-vaca-blue">
              Animals you register will be reviewed by an administrator before
              being added on-chain. You will be notified when they are approved.
            </p>
          </div>
          <form onSubmit={handleAddAnimal} className="mt-4 space-y-4">
            <div className="form-control">
              <label className="label" htmlFor="animal-eid">
                <span className="label-text font-medium">EID</span>
              </label>
              <input
                id="animal-eid"
                className="input input-bordered w-full"
                value={animalForm.eid}
                onChange={event => handleAnimalChange("eid", event.target.value)}
                required
              />
            </div>
            <div className="form-control">
              <label className="label" htmlFor="animal-custodian">
                <span className="label-text font-medium">Custodian wallet</span>
              </label>
              <input
                id="animal-custodian"
                className="input input-bordered w-full"
                value={animalForm.custodian}
                onChange={event =>
                  handleAnimalChange("custodian", event.target.value)
                }
                required
              />
            </div>
            <div className="form-control">
              <label className="label" htmlFor="animal-breed">
                <span className="label-text font-medium">Breed</span>
              </label>
              <input
                id="animal-breed"
                className="input input-bordered w-full"
                value={animalForm.breed}
                onChange={event =>
                  handleAnimalChange("breed", event.target.value)
                }
                required
              />
            </div>
            <div className="form-control">
              <label className="label" htmlFor="animal-weight">
                <span className="label-text font-medium">
                  Initial weight (kg)
                </span>
              </label>
              <input
                id="animal-weight"
                className="input input-bordered w-full"
                value={animalForm.initialWeight}
                onChange={event =>
                  handleAnimalChange("initialWeight", event.target.value)
                }
              />
            </div>

            {animalError && (
              <p className="text-xs text-vaca-brown">{animalError}</p>
            )}
            {animalSuccess && (
              <p className="text-xs text-vaca-green">{animalSuccess}</p>
            )}

            <button
              type="submit"
              className={cn(
                "btn btn-primary w-full",
                "border-vaca-green bg-vaca-green text-vaca-neutral-white hover:bg-vaca-green-dark",
                createAnimal.isPending && "pointer-events-none opacity-70",
              )}
            >
              {createAnimal.isPending ? "Registering..." : "Register animal"}
            </button>
          </form>
        </div>
      </section>
    </motion.div>
  );
}
