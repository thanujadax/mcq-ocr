import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faArrowLeft, faArrowRight } from "@fortawesome/free-solid-svg-icons";
import { Button } from "../../../../components/UI/Button";

interface NavigationButtonsProps {
  currentStep: number;
  totalSteps: number;
  onPrevStep: () => void;
  onNextStep: () => void;
  hideNext?: boolean;
  disableNext?: boolean;
}

export function NavigationButtons({
  currentStep,
  totalSteps,
  onPrevStep,
  onNextStep,
  hideNext = false,
  disableNext = false,
}: NavigationButtonsProps) {
  return (
    <div className="flex justify-between">
      {currentStep != 1 ? (
        <Button
          variant="outline"
          onClick={onPrevStep}
          icon={<FontAwesomeIcon icon={faArrowLeft} className="h-4 w-4" />}
          className="border-gray-300 text-gray-700 hover:bg-gray-50"
        >
          Back
        </Button>
      ) : (
        <p></p>
      )}

      <div className="flex space-x-3">
        {currentStep < totalSteps && !hideNext ? (
          <Button
            variant="primary"
            onClick={onNextStep}
            disabled={disableNext}
            icon={<FontAwesomeIcon icon={faArrowRight} className="h-4 w-4" />}
            iconPosition="right"
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            Next
          </Button>
        ) : null}
      </div>
    </div>
  );
}
