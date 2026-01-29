import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { z } from "zod";

const OnboardingRegisterSchema = z.object({
  fullName: z.string(),
  email: z.string(),
});

export type OnboardingRegister = z.infer<typeof OnboardingRegisterSchema>;

const DEFAULT_REGISTER: OnboardingRegister = {
  fullName: "",
  email: "",
};

type OnboardingState = {
  register: OnboardingRegister;
  updateRegister: (update: Partial<OnboardingRegister>) => void;
  resetOnboarding: () => void;
};

const mergeRegister = (
  base: OnboardingRegister,
  update: Partial<OnboardingRegister>,
): OnboardingRegister => ({
  ...base,
  ...update,
});

export const useOnboardingStore = create<OnboardingState>()(
  persist(
    (set) => ({
      register: DEFAULT_REGISTER,
      updateRegister: (update) =>
        set((state) => ({
          register: mergeRegister(state.register, update),
        })),
      resetOnboarding: () => set({ register: DEFAULT_REGISTER }),
    }),
    {
      name: "yc_onboarding",
      storage: createJSONStorage(() => localStorage),
      merge: (persistedState, currentState) => {
        const raw =
          (persistedState as { state?: OnboardingState })?.state?.register ??
          (persistedState as { register?: OnboardingRegister })?.register;
        const parsed = OnboardingRegisterSchema.safeParse(raw);
        return {
          ...currentState,
          register: parsed.success
            ? mergeRegister(DEFAULT_REGISTER, parsed.data)
            : currentState.register,
        };
      },
    },
  ),
);
