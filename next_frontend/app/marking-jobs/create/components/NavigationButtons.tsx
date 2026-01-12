import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowLeft,
  faArrowRight,
  faPlay,
} from "@fortawesome/free-solid-svg-icons";
import { Button } from "../../../../components/UI/Button";

interface NavigationButtonsProps {
  currentStep: number;
  totalSteps: number;
  isSubmitting: boolean;
  onPrevStep: () => void;
  onNextStep: () => void;
  onSubmit: () => void;
  hideNext?: boolean;
}

export function NavigationButtons({
  currentStep,
  totalSteps,
  isSubmitting,
  onPrevStep,
  onNextStep,
  onSubmit,
  hideNext = false,
}: NavigationButtonsProps) {
  return (
    <div className="px-6 py-4 bg-gray-50 rounded-b-lg flex justify-between">
      <Button
        variant="outline"
        onClick={onPrevStep}
        disabled={currentStep === 1}
        icon={<FontAwesomeIcon icon={faArrowLeft} className="h-4 w-4" />}
      >
        Back
      </Button>

      <div className="flex space-x-3">
        {currentStep < totalSteps && !hideNext ? (
          <Button
            variant="primary"
            onClick={onNextStep}
            icon={<FontAwesomeIcon icon={faArrowRight} className="h-4 w-4" />}
            iconPosition="right"
          >
            Next
          </Button>
        ) : currentStep === totalSteps ? (
          <Button
            variant="primary"
            onClick={onSubmit}
            disabled={isSubmitting}
            isLoading={isSubmitting}
            icon={<FontAwesomeIcon icon={faPlay} className="h-4 w-4" />}
          >
            {isSubmitting ? "Starting Marking..." : "Start Marking"}
          </Button>
        ) : null}
      </div>
    </div>
  );
}
