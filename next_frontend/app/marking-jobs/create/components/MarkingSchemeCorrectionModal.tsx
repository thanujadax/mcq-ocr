import React, { useState, useEffect, useCallback } from "react";
import { Button } from "../../../../components/UI/Button";
import { AnswerSheetViewer } from "../../../../components/UI/AnswerSheetViewer";
import { Bubble } from "../../types/types";
import { getMarkingSchemeBubbleData } from "../../../utils/results";

interface AnswersCorrectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  imageUrl: string;
  markingConfigId: number;
  confirmText?: string;
  onConfirm?: (isUpdated: boolean, updatedBubbleData: Bubble[][]) => void;
}

const AnswersCorrectionModal = ({
  isOpen,
  onClose,
  imageUrl,
  markingConfigId,
  confirmText,
  onConfirm: onConfirm,
}: AnswersCorrectionModalProps) => {
  const [localBubbleData, setLocalBubbleData] = useState<Bubble[][]>([]);
  const [originalBubbleData, setOriginalBubbleData] = useState<Bubble[][]>([]);
  const [showAllBubbles, setShowAllBubbles] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load bubble data when modal opens
  const loadBubbleData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const bubbleData = await getMarkingSchemeBubbleData(markingConfigId);

      if (!Array.isArray(bubbleData) || bubbleData.length === 0) {
        throw new Error("Failed to load marking scheme bubble data");
      }

      // Validate that bubble data has content
      const hasValidBubbles = bubbleData.some(
        (row) => Array.isArray(row) && row.length > 0
      );

      if (!hasValidBubbles) {
        throw new Error("No valid bubble data found");
      }

      setOriginalBubbleData(bubbleData);
      setLocalBubbleData(bubbleData);
    } catch (err) {
      console.error("Error loading bubble data:", err);
      setError(err instanceof Error ? err.message : "Failed to load data");
    } finally {
      setIsLoading(false);
    }
  }, [markingConfigId]);

  useEffect(() => {
    if (isOpen && markingConfigId) {
      loadBubbleData();
    }
  }, [isOpen, markingConfigId, loadBubbleData]);

  const handleBubbleToggle = (questionIndex: number, optionIndex: number) => {
    const newData = [...localBubbleData];
    newData[questionIndex][optionIndex].marked =
      !newData[questionIndex][optionIndex].marked;
    setLocalBubbleData(newData);
  };

  const handleSave = () => {
    let isUpdated = false;
    for (
      let questionIndex = 0;
      questionIndex < localBubbleData.length;
      questionIndex++
    ) {
      for (
        let optionIndex = 0;
        optionIndex < localBubbleData[questionIndex].length;
        optionIndex++
      ) {
        if (
          localBubbleData[questionIndex][optionIndex].marked !==
          originalBubbleData[questionIndex][optionIndex].marked
        ) {
          isUpdated = true;
          break;
        }
      }
    }
    onConfirm?.(isUpdated, localBubbleData);
    onClose();
  };

  const handleCancel = useCallback(() => {
    setLocalBubbleData(originalBubbleData); // Reset to original data
    onClose();
  }, [originalBubbleData, onClose]);

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
        {isLoading
          ? "Loading..."
          : error
          ? "Error loading data"
          : `${markedBubbles} of ${totalBubbles} bubbles marked`}
      </div>
      <div className="flex space-x-3">
        <Button variant="outline" onClick={handleCancel} disabled={isLoading}>
          Cancel
        </Button>
        <Button
          variant="primary"
          onClick={handleSave}
          disabled={isLoading}
          className="bg-green-600 hover:bg-green-700 focus:ring-green-500 text-white disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {confirmText || "Verify"}
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
            {!isLoading && (
              <button
                onClick={() => setShowAllBubbles(!showAllBubbles)}
                className="text-sm text-blue-600 hover:text-blue-800 transition-colors"
              >
                {showAllBubbles ? "Hide All Bubbles" : "Show All Bubbles"}
              </button>
            )}
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
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-16 space-y-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              <div className="text-center">
                <h4 className="text-lg font-medium text-gray-900">
                  Loading Marking Scheme
                </h4>
                <p className="text-gray-600 mt-1">
                  Please wait while we load the configuration...
                </p>
              </div>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-16 space-y-4">
              <div className="text-red-500 mb-4">
                <svg
                  className="h-12 w-12"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div className="text-center">
                <h4 className="text-lg font-medium text-gray-900">
                  Error Loading Data
                </h4>
                <p className="text-gray-600 mt-1">{error}</p>
              </div>
            </div>
          ) : imageUrl && localBubbleData.length > 0 ? (
            <AnswerSheetViewer
              imageUrl={imageUrl}
              bubbleData={localBubbleData}
              onBubbleToggle={handleBubbleToggle}
              showBubbles={showAllBubbles}
              isInteractive={true}
              width={1200}
              height={1600}
              isMarkingScheme={true}
            />
          ) : (
            <div className="flex flex-col items-center justify-center py-16 space-y-4">
              <div className="text-gray-400 mb-4">
                <svg
                  className="h-12 w-12"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
              <div className="text-center">
                <h4 className="text-lg font-medium text-gray-900">
                  No Data Available
                </h4>
                <p className="text-gray-600 mt-1">
                  No marking scheme data could be loaded.
                </p>
              </div>
            </div>
          )}
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
