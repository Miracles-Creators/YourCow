import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { z } from "zod";

const TimelineModeSchema = z.enum(["duration", "date"]);

export const LotDraftSchema = z.object({
  producerId: z.number(),
  basicInfo: z.object({
    lotName: z.string(),
    farmName: z.string(),
    location: z.string(),
    productionType: z.string(),
    startDate: z.string(),
  }),
  herdCycle: z.object({
    cattleCount: z.number(),
    averageWeightKg: z.number(),
    initialWeightKg: z.number(),
    durationWeeks: z.number(),
    targetEndDate: z.string(),
    notes: z.string(),
    timelineMode: TimelineModeSchema,
  }),
  financing: z.object({
    totalCapital: z.number(),
    investorPercent: z.number(),
    fundingDeadline: z.string(),
    operatingCosts: z.number(),
  }),
  documents: z.object({
    ownership: z.number().nullable(),
    lotDocs: z.number().nullable(),
    insurance: z.number().nullable(),
    video: z.number().nullable(),
  }),
});

export type LotDraft = z.infer<typeof LotDraftSchema>;

const DEFAULT_LOT_DRAFT: LotDraft = {
  producerId: 0,
  basicInfo: {
    lotName: "",
    farmName: "",
    location: "",
    productionType: "",
    startDate: "",
  },
  herdCycle: {
    cattleCount: 0,
    averageWeightKg: 0,
    initialWeightKg: 0,
    durationWeeks: 0,
    targetEndDate: "",
    notes: "",
    timelineMode: "duration",
  },
  financing: {
    totalCapital: 0,
    investorPercent: 35,
    fundingDeadline: "",
    operatingCosts: 0,
  },
  documents: {
    ownership: null,
    lotDocs: null,
    insurance: null,
    video: null,
  },
};

type LotDraftState = {
  draft: LotDraft;
  updateDraft: (update: Partial<LotDraft>) => void;
  resetDraft: () => void;
};

const mergeDraft = (base: LotDraft, update: Partial<LotDraft>): LotDraft => ({
  ...base,
  ...update,
  basicInfo: { ...base.basicInfo, ...update.basicInfo },
  herdCycle: { ...base.herdCycle, ...update.herdCycle },
  financing: { ...base.financing, ...update.financing },
  documents: { ...base.documents, ...update.documents },
});

export const useLotDraftStore = create<LotDraftState>()(
  persist(
    (set) => ({
      draft: DEFAULT_LOT_DRAFT,
      updateDraft: (update) =>
        set((state) => ({
          draft: mergeDraft(state.draft, update),
        })),
      resetDraft: () => set({ draft: DEFAULT_LOT_DRAFT }),
    }),
    {
      name: "yc_lot_draft",
      storage: createJSONStorage(() => localStorage),
      merge: (persistedState, currentState) => {
        const raw =
          (persistedState as { state?: LotDraftState })?.state?.draft ??
          (persistedState as { draft?: LotDraft })?.draft;
        const parsed = LotDraftSchema.safeParse(raw);
        return {
          ...currentState,
          draft: parsed.success
            ? mergeDraft(DEFAULT_LOT_DRAFT, parsed.data)
            : currentState.draft,
        };
      },
    },
  ),
);
