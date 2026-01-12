import React, { useState, useEffect, useCallback } from "react";
import Image from "next/image";
import { Button } from "./Button";

interface BubbleData {
  marked: boolean;
  x: number;
  y: number;
}

interface AnswersCorrectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
  bubbleData: BubbleData[][];
  confirmText?: string;
  onConfirm?: (isUpdated: boolean, updatedBubbleData: BubbleData[][]) => void;
}

const AnswersCorrectionModal = ({
  isOpen,
  onClose,
  imageUrl,
  bubbleData,
  confirmText,
  onConfirm: onConfirm,
}: AnswersCorrectionModalProps) => {
  const [localBubbleData, setLocalBubbleData] =
    useState<BubbleData[][]>(bubbleData);
  const [showAllBubbles, setShowAllBubbles] = useState(true);

  const handleBubbleToggle = (questionIndex: number, optionIndex: number) => {
    const newData = [...localBubbleData];
    newData[questionIndex][optionIndex].marked =
      !newData[questionIndex][optionIndex].marked;
    setLocalBubbleData(newData);
  };

  const handleSave = () => {
    let isUpdated = false;
    for (let questionIndex = 0; questionIndex < localBubbleData.length; questionIndex++) {
      for (let optionIndex = 0; optionIndex < localBubbleData[questionIndex].length; optionIndex++) {
        if (localBubbleData[questionIndex][optionIndex].marked !== bubbleData[questionIndex][optionIndex].marked) {
          isUpdated = true;
          break;
        }
      }
    }
    onConfirm?.(isUpdated, localBubbleData);  
    onClose();
  };

  const handleCancel = useCallback(() => {
    setLocalBubbleData(bubbleData); // Reset to original data
    onClose();
  }, [bubbleData, onClose]);

  // Handle ESC key press
  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        handleCancel();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEsc);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEsc);
      document.body.style.overflow = "";
    };
  }, [isOpen, handleCancel]);

  // Calculate statistics
  const totalBubbles = localBubbleData.reduce(
    (total, question) => total + question.length,
    0
  );
  const markedBubbles = localBubbleData.reduce(
    (total, question) =>
      total + question.filter((bubble) => bubble.marked).length,
    0
  );

  const footer = (
    <div className="flex justify-between items-center">
      <div className="text-sm text-gray-600">
        {markedBubbles} of {totalBubbles} bubbles marked
      </div>
      <div className="flex space-x-3">
        <Button variant="outline" onClick={handleCancel}>
          Cancel
        </Button>
        <Button variant="primary" onClick={handleSave}>
          {confirmText || "Save Changes"}
        </Button>
      </div>
    </div>
  );

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-gray-500 bg-opacity-75 flex items-start justify-center p-4 transition-opacity">
      <div className="w-full max-w-none bg-white rounded-lg shadow-xl transform transition-all">
        {/* Header */}
        <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <h3 className="text-lg font-medium text-gray-900">
              Correct Answer Bubbles
            </h3>
            <button
              onClick={() => setShowAllBubbles(!showAllBubbles)}
              className="text-sm text-blue-600 hover:text-blue-800 transition-colors"
            >
              {showAllBubbles ? "Hide All Bubbles" : "Show All Bubbles"}
            </button>
          </div>
          <button
            type="button"
            className="text-gray-400 hover:text-gray-500 focus:outline-none"
            onClick={onClose}
            aria-label="Close"
          >
            <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path
                fillRule="evenodd"
                d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                clipRule="evenodd"
              />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div
          className="p-4 overflow-auto"
          style={{ maxHeight: "calc(100vh - 200px)" }}
        >
          <div className="flex justify-center">
            <div
              className="relative bg-gray-100 border border-gray-200 rounded-lg overflow-hidden"
              style={{ width: "1200px", height: "1600px" }}
            >
              {/* Background Image */}
              <Image
                src={imageUrl}
                alt="Answer sheet"
                width={1200}
                height={1600}
                className="w-full h-full"
                draggable={false}
                unoptimized
                priority
              />

              {/* Positioned Checkboxes */}
              {showAllBubbles &&
                localBubbleData.map((question, questionIndex) =>
                  question.map((bubble, optionIndex) => (
                    <div
                      key={`${questionIndex}-${optionIndex}`}
                      className="absolute z-10 cursor-pointer"
                      style={{
                        left: `${bubble.x - 10}px`,
                        top: `${bubble.y - 10}px`,
                        width: "15px",
                        height: "15px",
                      }}
                      onClick={() =>
                        handleBubbleToggle(questionIndex, optionIndex)
                      }
                    >
                      {/* Visible circle background */}
                      <div
                        className={`w-5 h-5 rounded-full border-2 transition-all duration-200 flex items-center justify-center ${
                          bubble.marked
                            ? "bg-green-600 border-green-600 scale-110"
                            : "bg-transparent text-transparent border-green-700 hover:border-green-500 hover:scale-105"
                        }`}
                      >
                        {/* Checkmark when selected */}
                        {bubble.marked && (
                          <svg
                            className="w-4 h-4 text-white"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                              clipRule="evenodd"
                            />
                          </svg>
                        )}
                      </div>

                      {/* Debug info - remove in production */}
                      <div className="absolute -bottom-6 left-0 text-xs bg-black/70 text-white px-1 rounded opacity-0 hover:opacity-100 transition-opacity pointer-events-none">
                        Q{questionIndex + 1}-{optionIndex + 1}
                      </div>
                    </div>
                  ))
                )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-4 py-3 bg-gray-50 border-t border-gray-200 flex justify-end space-x-2">
          {footer}
        </div>
      </div>
    </div>
  );
};

export default AnswersCorrectionModal;
