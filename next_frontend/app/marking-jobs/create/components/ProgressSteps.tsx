import React from "react";
import { CheckIcon, LockClosedIcon } from "@heroicons/react/24/outline";
import { MarkingJobStatus } from "../../types/types";
import { ComponentType, SVGProps } from "react";

type HeroIcon = ComponentType<SVGProps<SVGSVGElement>>;

interface Step {
  id: number;
  title: string;
  description: string;
  icon: HeroIcon;
}

interface ProgressStepsProps {
  steps: Step[];
  currentStep: number;
  jobStatus?: MarkingJobStatus | null;
  isStepAccessible?: (
    stepNumber: number,
    status: MarkingJobStatus | null
  ) => boolean;
}

export function ProgressSteps({
  steps,
  currentStep,
  jobStatus = null,
  isStepAccessible = () => true,
}: ProgressStepsProps) {
  return (
    <div className="bg-white border border-gray-200 rounded-2xl shadow-sm p-6">
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Progress</h3>
        <p className="text-sm text-gray-600 mt-1">
          Step {currentStep} of {steps.length}
        </p>
      </div>

      <nav aria-label="Progress">
        <ol className="flex items-center justify-between w-full relative">
          {/* Connection line */}
          <div className="absolute top-6 left-8 right-8 h-px bg-gray-200"></div>
          <div
            className="absolute top-6 left-8 h-px bg-blue-600 transition-all duration-300"
            style={{
              width: `calc(${
                ((currentStep - 1) / (steps.length - 1)) * 100
              }% - 2rem)`,
            }}
          ></div>

          {steps.map((step) => {
            const isCompleted = currentStep > step.id;
            const isCurrent = currentStep === step.id;
            const isAccessible = isStepAccessible(step.id, jobStatus);

            return (
              <li key={step.id} className="flex-1 relative">
                <div className="flex flex-col items-center">
                  {/* Step circle */}
                  <div
                    className={`w-12 h-12 flex items-center justify-center rounded-full border-2 transition-all duration-200 ${
                      isCompleted
                        ? "bg-blue-600 border-blue-600"
                        : isCurrent
                        ? "bg-white border-blue-600"
                        : !isAccessible
                        ? "bg-gray-100 border-gray-200"
                        : "bg-white border-gray-300"
                    }`}
                  >
                    {isCompleted ? (
                      <CheckIcon className="w-4 h-4 text-white" />
                    ) : !isAccessible ? (
                      <LockClosedIcon className="w-4 h-4 text-gray-400" />
                    ) : (
                      <step.icon
                        className={`w-4 h-4 ${
                          isCurrent ? "text-blue-600" : "text-gray-400"
                        }`}
                      />
                    )}
                  </div>

                  {/* Step content */}
                  <div className="mt-3 text-center max-w-28">
                    <p
                      className={`text-sm font-medium ${
                        isCompleted
                          ? "text-blue-600"
                          : isCurrent
                          ? "text-gray-900"
                          : !isAccessible
                          ? "text-gray-400"
                          : "text-gray-500"
                      }`}
                    >
                      {step.title}
                    </p>
                    <p
                      className={`text-xs mt-1 ${
                        !isAccessible ? "text-gray-400" : "text-gray-500"
                      }`}
                    >
                      {!isAccessible ? "Locked" : step.description}
                    </p>
                  </div>
                </div>
              </li>
            );
          })}
        </ol>
      </nav>
    </div>
  );
}
