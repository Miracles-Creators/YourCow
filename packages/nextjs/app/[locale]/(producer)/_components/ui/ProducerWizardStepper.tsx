import { cn } from "~~/lib/utils/cn";

interface ProducerWizardStepperProps {
  steps: string[];
  currentStep: number;
  className?: string;
}

export function ProducerWizardStepper({
  steps,
  currentStep,
  className,
}: ProducerWizardStepperProps) {
  return (
    <ol
      className={cn(
        "flex flex-wrap items-center gap-3 text-sm text-vaca-neutral-gray-500",
        className,
      )}
      aria-label="Create lot steps"
    >
      {steps.map((step, index) => {
        const isCurrent = index === currentStep;
        const isComplete = index < currentStep;

        return (
          <li key={step} className="flex items-center gap-2">
            <span
              className={cn(
                "flex h-7 w-7 items-center justify-center rounded-full border text-xs font-semibold",
                isCurrent && "border-vaca-green bg-vaca-green text-white",
                isComplete &&
                  "border-vaca-green bg-vaca-green/10 text-vaca-green",
                !isCurrent && !isComplete && "border-vaca-neutral-gray-200",
              )}
              aria-current={isCurrent ? "step" : undefined}
            >
              {index + 1}
            </span>
            <span
              className={cn(
                "font-medium",
                isCurrent ? "text-vaca-green" : "text-vaca-neutral-gray-500",
              )}
            >
              {step}
            </span>
          </li>
        );
      })}
    </ol>
  );
}
