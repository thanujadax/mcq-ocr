import React, { useState, useEffect, useCallback } from "react";
import { AnswerSheetViewer } from "@/components/UI/AnswerSheetViewer";
import { Button } from "@/components/UI/Button";
import {
  PencilIcon,
  CheckIcon,
  XMarkIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  DocumentTextIcon,
  HashtagIcon,
  TrophyIcon,
  ClipboardDocumentListIcon,
} from "@heroicons/react/24/outline";
import { Bubble, StudentResult } from "@/app/marking-jobs/types/types";
import { _updateCounts } from "@/app/utils/results";

interface AnswerSheetModalProps {
  isOpen: boolean;
  onClose: () => void;
  result: StudentResult;
  updateResult: (result: StudentResult) => void;
  markingScheme: Bubble[][];
}

const AnswerSheetModal = ({
  isOpen,
  onClose,
  result,
  updateResult,
  markingScheme,
}: AnswerSheetModalProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [confirmResolveOpen, setConfirmResolveOpen] = useState(false);
  const [localResult, setLocalResult] = useState<StudentResult>(() => {
    // Initialize with a deep clone to avoid reference issues
    return {
      ...result,
      labeled_points: result.labeled_points?.map((question) =>
        question.map((bubble) => ({ ...bubble }))
      ),
      correct: [...(result.correct || [])],
      incorrect: [...(result.incorrect || [])],
      more_than_one_marked: [...(result.more_than_one_marked || [])],
      not_marked: [...(result.not_marked || [])],
      // columnwise_total: [...(result.columnwise_total || [])],
    };
  });

  const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL;
  if (!BACKEND_URL) {
    throw new Error("NEXT_PUBLIC_BACKEND_URL is not set.");
  }

  // Update localResult when result prop changes
  useEffect(() => {
    const deepClonedResult = {
      ...result,
      labeled_points: result.labeled_points?.map((question) =>
        question.map((bubble) => ({ ...bubble }))
      ),
      correct: [...(result.correct || [])],
      incorrect: [...(result.incorrect || [])],
      more_than_one_marked: [...(result.more_than_one_marked || [])],
      not_marked: [...(result.not_marked || [])],
      // columnwise_total: [...(result.columnwise_total || [])],
    };
    setLocalResult(deepClonedResult);
    setIsEditing(false);
  }, [result]);

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleSave = () => {
    const wasResolvedBeforeEdit = result.is_resolved;
    updateResult(localResult);
    setIsEditing(false);
    // If the row was flagged and the user hasn't already marked it resolved
    // (either before or during this edit), prompt them to do so now.
    if (localResult.flag && !wasResolvedBeforeEdit && !localResult.is_resolved) {
      setConfirmResolveOpen(true);
    }
  };

  const handleConfirmResolve = () => {
    const resolved = { ...localResult, is_resolved: true };
    setLocalResult(resolved);
    updateResult(resolved);
    setConfirmResolveOpen(false);
  };

  const handleCancel = useCallback(() => {
    // Deep clone the result to ensure we reset to the original state
    const deepClonedResult = {
      ...result,
      labeled_points: result.labeled_points?.map((question) =>
        question.map((bubble) => ({ ...bubble }))
      ),
      correct: [...(result.correct || [])],
      incorrect: [...(result.incorrect || [])],
      more_than_one_marked: [...(result.more_than_one_marked || [])],
      not_marked: [...(result.not_marked || [])],
      // columnwise_total: [...(result.columnwise_total || [])],
    };
    setLocalResult(deepClonedResult);
    setIsEditing(false);
  }, [result]);

  // Handle ESC key press
  useEffect(() => {
    const handleEsc = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        if (isEditing) {
          handleCancel();
        } else {
          onClose();
        }
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
  }, [isOpen, isEditing, handleCancel, onClose]);

  const answerSheetPath = result.answer_sheet_path
    ? `${BACKEND_URL}/api/files/download?method=path&path=${result.answer_sheet_path}`
    : "";

  if (!isOpen) return null;

  function handleBubbleToggle(
    questionIndex: number,
    optionIndex: number
  ): void {
    // Create a deep copy to avoid mutating the original state
    let newLocalResult = {
      ...localResult,
      labeled_points: localResult.labeled_points?.map((question) =>
        question.map((bubble) => ({ ...bubble }))
      ),
      correct: [...(localResult.correct || [])],
      incorrect: [...(localResult.incorrect || [])],
      more_than_one_marked: [...(localResult.more_than_one_marked || [])],
      not_marked: [...(localResult.not_marked || [])],
      // columnwise_total: [...(localResult.columnwise_total || [])],
    };

    newLocalResult.labeled_points![questionIndex][optionIndex].marked =
      !newLocalResult.labeled_points![questionIndex][optionIndex].marked;

    newLocalResult = _updateCounts(
      newLocalResult,
      questionIndex,
      markingScheme[questionIndex]
    );

    setLocalResult(newLocalResult);
  }

  if (!isOpen) return null;

  return (
    <>
    <div className="fixed inset-0 z-50 bg-gray-900/50 backdrop-blur-sm flex items-center justify-center p-0 transition-opacity h-screen w-screen">
      <div className="w-[90vw] h-[90vh] max-w-none bg-white rounded-2xl shadow-2xl transform transition-all flex flex-col m-10 min-h-0 border border-gray-200">
        {/* Header */}
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between flex-shrink-0 bg-gradient-to-r from-blue-50 to-blue-100 rounded-t-2xl">
          <div className="flex items-center space-x-3">
            <div className="bg-blue-500 p-2 rounded-xl">
              <DocumentTextIcon className="h-5 w-5 text-white" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">
                Answer Sheet
              </h3>
              <p className="text-sm text-gray-600">
                Index: {localResult.index_number}
              </p>
            </div>
          </div>
          <button
            type="button"
            className="p-2 rounded-xl text-gray-400 hover:text-gray-600 hover:bg-white/50 transition-colors"
            onClick={() => {
              onClose();
            }}
            aria-label="Close"
          >
            <XMarkIcon className="h-6 w-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 p-6 overflow-hidden min-h-0">
          <div className="grid grid-cols-5 gap-6 h-full min-h-0">
            {/* Left Column - Answer Sheet Viewer */}
            <div className="col-span-3 h-full min-h-0">
              <div className="bg-gray-50 border border-gray-200 rounded-2xl p-4 h-full overflow-auto">
                {localResult.answer_sheet_path ? (
                  <div className="min-w-max">
                    <AnswerSheetViewer
                      imageUrl={answerSheetPath}
                      bubbleData={localResult.labeled_points || []}
                      onBubbleToggle={handleBubbleToggle}
                      showBubbles={true}
                      isInteractive={isEditing}
                      width={1200}
                      height={1600}
                      isMarkingScheme={false}
                      markingScheme={markingScheme}
                    />
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-500">
                    <div className="text-center">
                      <DocumentTextIcon className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                      <p>No answer sheet image available</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Right Column - Answer Sheet Data */}
            <div className="col-span-2 h-full flex flex-col min-h-0">
              <div className="bg-white border border-gray-200 rounded-2xl flex-1 overflow-hidden min-h-0 shadow-sm flex flex-col">
                {/* Fixed Header with Edit Button */}
                <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-blue-100 flex-shrink-0">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="bg-blue-500 p-2 rounded-xl">
                        <ClipboardDocumentListIcon className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">
                          Answer Data
                        </h3>
                        <p className="text-sm text-gray-600">
                          Student information and results
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {isEditing ? (
                        <>
                          <Button
                            onClick={handleSave}
                            size="sm"
                            variant="primary"
                            className="inline-flex items-center"
                          >
                            <CheckIcon className="h-4 w-4 mr-2" />
                            Save
                          </Button>
                          <Button
                            onClick={handleCancel}
                            size="sm"
                            variant="secondary"
                            className="inline-flex items-center"
                          >
                            <XMarkIcon className="h-4 w-4 mr-2" />
                            Cancel
                          </Button>
                        </>
                      ) : (
                        <Button
                          onClick={handleEdit}
                          size="sm"
                          variant="primary"
                          className="inline-flex items-center"
                        >
                          <PencilIcon className="h-4 w-4 mr-2" />
                          Edit
                        </Button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Scrollable Content */}
                <div className="p-6 overflow-y-auto flex-1 min-h-0">
                  <div className="space-y-6">
                    {/* Index Number - Editable Field */}
                    <div className="bg-white border border-gray-200 rounded-2xl p-4">
                      <div className="flex items-center space-x-3 mb-3">
                        <div className="bg-blue-100 p-2 rounded-xl">
                          <HashtagIcon className="h-4 w-4 text-blue-600" />
                        </div>
                        <label className="text-sm font-semibold text-gray-900">
                          Index Number
                        </label>
                      </div>
                      <input
                        type="text"
                        value={localResult.index_number}
                        onChange={(e) =>
                          setLocalResult({
                            ...localResult,
                            index_number: e.target.value,
                          })
                        }
                        disabled={!isEditing}
                        className={`w-full px-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors ${
                          !isEditing ? "bg-gray-50 text-gray-600" : "bg-white"
                        }`}
                        placeholder="Enter index number"
                      />
                    </div>

                    {/* Status Section */}
                    <div className="bg-white border border-gray-200 rounded-2xl p-4">
                      <div className="flex items-center space-x-3 mb-3">
                        <div className="bg-amber-100 p-2 rounded-xl">
                          <ExclamationTriangleIcon className="h-4 w-4 text-amber-600" />
                        </div>
                        <label className="text-sm font-semibold text-gray-900">
                          Flag Status
                        </label>
                      </div>
                      <div className="flex items-center">
                        <span
                          className={`inline-flex items-center px-4 py-2 rounded-xl text-sm font-medium ${
                            localResult.flag
                              ? "bg-amber-100 text-amber-800 border border-amber-200"
                              : "bg-green-100 text-green-800 border border-green-200"
                          }`}
                        >
                          {localResult.flag ? (
                            <>
                              <ExclamationTriangleIcon className="h-4 w-4 mr-2" />
                              Flagged
                            </>
                          ) : (
                            <>
                              <CheckCircleIcon className="h-4 w-4 mr-2" />
                              Not Flagged
                            </>
                          )}
                        </span>
                      </div>
                      {localResult.flag_reason && (
                        <div className="mt-3">
                          <p className="text-xs font-medium text-gray-700 mb-2">
                            Flag Reason
                          </p>
                          <div className="px-4 py-3 bg-amber-50 border border-amber-200 rounded-xl text-sm text-amber-800">
                            {localResult.flag_reason}
                          </div>
                        </div>
                      )}
                      {localResult.flag && (
                        <div className="mt-3">
                          <p className="text-xs font-medium text-gray-700 mb-2">
                            Resolution
                          </p>
                          {isEditing ? (
                            <label className="inline-flex items-center text-sm text-gray-700 cursor-pointer select-none">
                              <input
                                type="checkbox"
                                className="h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500 cursor-pointer"
                                checked={localResult.is_resolved}
                                onChange={(e) =>
                                  setLocalResult({
                                    ...localResult,
                                    is_resolved: e.target.checked,
                                  })
                                }
                              />
                              <span className="ml-2">
                                Mark this row as resolved
                              </span>
                            </label>
                          ) : (
                            <span
                              className={`inline-flex items-center px-3 py-1 rounded-xl text-xs font-medium border ${
                                localResult.is_resolved
                                  ? "bg-green-100 text-green-800 border-green-200"
                                  : "bg-gray-100 text-gray-700 border-gray-200"
                              }`}
                            >
                              {localResult.is_resolved ? (
                                <>
                                  <CheckCircleIcon className="h-3 w-3 mr-1" />
                                  Resolved
                                </>
                              ) : (
                                "Not yet resolved"
                              )}
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Score Section */}
                    <div className="bg-white border border-gray-200 rounded-2xl p-4">
                      <div className="flex items-center space-x-3 mb-3">
                        <div className="bg-green-100 p-2 rounded-xl">
                          <TrophyIcon className="h-4 w-4 text-green-600" />
                        </div>
                        <label className="text-sm font-semibold text-gray-900">
                          Final Score
                        </label>
                      </div>
                      <div className="text-3xl font-bold text-green-600">
                        {localResult.score}
                      </div>
                      <p className="text-sm text-gray-500 mt-1">
                        out of{" "}
                        {localResult.correct.length +
                          localResult.incorrect.length +
                          localResult.more_than_one_marked.length +
                          localResult.not_marked.length}{" "}
                        questions
                      </p>
                    </div>

                    {/* Statistics Grid */}
                    <div className="grid grid-cols-2 gap-4">
                      {/* Correct Answers */}
                      <div className="bg-gradient-to-r from-green-50 to-green-100 border border-green-200 rounded-2xl p-4">
                        <div className="flex items-center space-x-2 mb-2">
                          <CheckCircleIcon className="h-5 w-5 text-green-600" />
                          <span className="text-sm font-medium text-green-900">
                            Correct
                          </span>
                        </div>
                        <div className="text-2xl font-bold text-green-600">
                          {localResult.correct.length}
                        </div>
                      </div>

                      {/* Incorrect Answers */}
                      <div className="bg-gradient-to-r from-red-50 to-red-100 border border-red-200 rounded-2xl p-4">
                        <div className="flex items-center space-x-2 mb-2">
                          <XMarkIcon className="h-5 w-5 text-red-600" />
                          <span className="text-sm font-medium text-red-900">
                            Incorrect
                          </span>
                        </div>
                        <div className="text-2xl font-bold text-red-600">
                          {localResult.incorrect.length}
                        </div>
                      </div>

                      {/* Duplicated */}
                      <div className="bg-gradient-to-r from-amber-50 to-amber-100 border border-amber-200 rounded-2xl p-4">
                        <div className="flex items-center space-x-2 mb-2">
                          <ExclamationTriangleIcon className="h-5 w-5 text-amber-600" />
                          <span className="text-sm font-medium text-amber-900">
                            Duplicated
                          </span>
                        </div>
                        <div className="text-2xl font-bold text-amber-600">
                          {localResult.more_than_one_marked.length}
                        </div>
                      </div>

                      {/* Not Marked */}
                      <div className="bg-gradient-to-r from-gray-50 to-gray-100 border border-gray-200 rounded-2xl p-4">
                        <div className="flex items-center space-x-2 mb-2">
                          <DocumentTextIcon className="h-5 w-5 text-gray-600" />
                          <span className="text-sm font-medium text-gray-900">
                            Not Marked
                          </span>
                        </div>
                        <div className="text-2xl font-bold text-gray-600">
                          {localResult.not_marked.length}
                        </div>
                      </div>
                    </div>

                    {/* Additional Information */}
                    <div className="bg-white border border-gray-200 rounded-2xl p-4">
                      <div className="flex items-center space-x-3 mb-4">
                        <div className="bg-blue-100 p-2 rounded-xl">
                          <ClipboardDocumentListIcon className="h-4 w-4 text-blue-600" />
                        </div>
                        <label className="text-sm font-semibold text-gray-900">
                          Additional Details
                        </label>
                      </div>
                      <div className="grid grid-cols-1 gap-3">
                        <div className="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0">
                          <span className="text-sm text-gray-600">
                            Row Number
                          </span>
                          <span className="text-sm font-medium text-gray-900">
                            {localResult.row_number}
                          </span>
                        </div>
                        <div className="flex justify-between items-center py-2 border-b border-gray-100 last:border-b-0">
                          <span className="text-sm text-gray-600">
                            Total Questions
                          </span>
                          <span className="text-sm font-medium text-gray-900">
                            {localResult.correct.length +
                              localResult.incorrect.length +
                              localResult.more_than_one_marked.length +
                              localResult.not_marked.length}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

      {confirmResolveOpen && (
        <div className="fixed inset-0 z-[60] bg-gray-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center space-x-3 bg-gradient-to-r from-green-50 to-green-100 rounded-t-2xl">
              <div className="bg-green-500 p-2 rounded-xl">
                <CheckCircleIcon className="h-5 w-5 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-gray-900">
                Mark as Resolved?
              </h3>
            </div>
            <div className="px-6 py-5 space-y-3">
              <p className="text-sm text-gray-700">
                You just edited a flagged row. If you fixed the issue, mark it
                as resolved so it shows up as Resolved in the results list.
              </p>
              {localResult.flag_reason && (
                <p className="text-xs text-gray-500">
                  Original flag: {localResult.flag_reason}
                </p>
              )}
            </div>
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end gap-2 bg-gray-50 rounded-b-2xl">
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setConfirmResolveOpen(false)}
              >
                Not now
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleConfirmResolve}
                className="inline-flex items-center"
              >
                <CheckIcon className="h-4 w-4 mr-2" />
                Mark resolved
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default AnswerSheetModal;
