import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { IconDefinition } from "@fortawesome/free-solid-svg-icons";
import { faCheck } from "@fortawesome/free-solid-svg-icons";

interface Step {
  id: number;
  title: string;
  description: string;
  icon: IconDefinition;
}

interface ProgressStepsProps {
  steps: Step[];
  currentStep: number;
}

export function ProgressSteps({ steps, currentStep }: ProgressStepsProps) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <nav aria-label="Progress">
        <ol className="flex items-center justify-between w-full">
          {steps.map((step, stepIdx) => {
            const isCompleted = currentStep > step.id;
            const isCurrent = currentStep === step.id;
            const isUpcoming = currentStep < step.id;

            return (
              <li key={step.id} className="flex-1">
                <div className="flex flex-col items-center">
                  {/* Step circle */}
                  <div
                    className={`relative w-14 h-14 flex items-center justify-center rounded-full border-2 transition-all duration-200 ${
                      isCompleted
                        ? "bg-blue-600 border-blue-600 shadow-lg"
                        : isCurrent
                        ? "bg-white border-blue-600 ring-4 ring-blue-100 shadow-md"
                        : "bg-white border-gray-300"
                    }`}
                  >
                    {isCompleted ? (
                      <FontAwesomeIcon
                        icon={faCheck}
                        className="w-6 h-6 text-white"
                      />
                    ) : (
                      <FontAwesomeIcon
                        icon={step.icon}
                        className={`w-6 h-6 ${
                          isCurrent ? "text-blue-600" : "text-gray-400"
                        }`}
                      />
                    )}
                  </div>

                  {/* Step text */}
                  <div className="mt-4 text-center max-w-36">
                    <p
                      className={`text-sm font-medium ${
                        isCompleted
                          ? "text-blue-600"
                          : isCurrent
                          ? "text-gray-900"
                          : "text-gray-500"
                      }`}
                    >
                      {step.title}
                    </p>
                    <p className="text-xs text-gray-500 mt-1 leading-relaxed">
                      {step.description}
                    </p>
                  </div>

                  {/* Progress line (hidden on last item) */}
                  {stepIdx < steps.length - 1 && (
                    <div className="absolute top-7 left-1/2 transform translate-x-1/2 w-full flex justify-center">
                      <div
                        className={`h-0.5 w-24 mt-0 ${
                          isCompleted ||
                          (isCurrent && stepIdx < currentStep - 1)
                            ? "bg-blue-600"
                            : "bg-gray-200"
                        }`}
                      />
                    </div>
                  )}
                </div>
              </li>
            );
          })}
        </ol>
      </nav>
    </div>
  );
}
