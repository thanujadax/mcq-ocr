import React, { useState } from "react";
import Image from "next/image";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCheck, faCog } from "@fortawesome/free-solid-svg-icons";
import { FileUpload } from "../../../../components/UI/FileUpload";
import { Card } from "../../../../components/UI/Card";
import { useCreateMarking } from "../../../../hooks/useCreateMarking";
import { useToast } from "../../../../hooks/useToast";
import { Bubble, MarkingJobStatus } from "./types";
import AnswersCorrectionModal from "@/components/UI/AnswersCorrectionModal";

interface MarkingSchemeStepProps {
  markingSchemeFile: File | null;
  error?: string;
  onFileChange: (file: File | null) => void;
}

export function MarkingSchemeStep({
  markingSchemeFile,
  error,
  onFileChange,
}: MarkingSchemeStepProps) {
  const [markingJob, setMarkingJob] = useCreateMarking();
  const { showToast } = useToast();
  const [isConfiguring, setIsConfiguring] = useState(false);
  const [isAnswersCorrectionModalOpen, setIsAnswersCorrectionModalOpen] =
    useState(false);
  const [answersCorrectionModalData, setAnswersCorrectionModalData] = useState<{
    imageUrl: string;
    bubbleData: Bubble[][];
  }>({
    imageUrl: "",
    bubbleData: [],
  });

  const BACKEND_URL =
    process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";

  const handleMarkingSchemeUploadAndConfigure = async () => {
    if (!markingJob.id || !markingSchemeFile) {
      showToast("Missing marking job ID or file", "error");
      return;
    }

    setIsConfiguring(true);
    try {
      // Upload marking scheme file
      const marking_file_formData = new FormData();
      marking_file_formData.append("file", markingSchemeFile);
      marking_file_formData.append("file_type", "marking_scheme");

      const uploadResponse = await fetch(`${BACKEND_URL}/api/files/upload`, {
        method: "POST",
        body: marking_file_formData,
      });

      if (!uploadResponse.ok) {
        throw new Error("Failed to upload marking scheme file");
      }

      const uploadData = await uploadResponse.json();
      setMarkingJob((prev) => ({
        ...prev,
        marking_scheme_id: uploadData.id,
      }));
      console.log("Marking scheme file uploaded successfully:", uploadData);
      showToast("Marking scheme file uploaded successfully", "success");

      configureMarkingSchemeViaWebSocket(markingJob.id, uploadData.file_id);
    } catch (err) {
      console.error("Error uploading/configuring marking scheme:", err);
      showToast(
        err instanceof Error
          ? err.message
          : "Failed to upload/configure marking scheme",
        "error"
      );
    } finally {
      setIsConfiguring(false);
    }
  };

  const configureMarkingSchemeViaWebSocket = (
    markingJobId: number,
    markingSchemeId: number
  ): Promise<void> => {
    return new Promise((resolve, reject) => {
      // Extract host from BACKEND_URL
      const host = BACKEND_URL.replace("http://", "").replace("https://", "");
      const wsUrl = `ws://${host}/api/markings/${markingJobId}/configure-marking-scheme`;

      console.log("Connecting to WebSocket:", wsUrl);
      const ws = new WebSocket(wsUrl);

      ws.onopen = () => {
        console.log("WebSocket connected for marking scheme configuration");
        // Send the marking scheme configuration data
        const message = { marking_scheme_id: markingSchemeId };
        ws.send(JSON.stringify(message));
        console.log("Sent marking scheme configuration data:", message);
      };

      ws.onmessage = async (event) => {
        try {
          const data = JSON.parse(event.data);
          console.log("WebSocket message received:", data);

          if (data.status === "connected") {
            console.log("WebSocket connection established");
            return;
          }

          if (data.status === "queued") {
            console.log("Marking scheme configuration job queued");
            showToast("Marking scheme configuration job queued", "success");
            return;
          } else if (data.status === "error") {
            const errorMessage = data.message || "Configuration failed";
            ws.close();
            showToast(errorMessage, "error");
            reject();
          } else if (data.status === "completed") {
            console.log("Marking scheme configuration job completed");
            showToast("Marking scheme configuration job completed", "success");
            setIsConfiguring(false);
            ws.close();
            resolve();
            const markingJobData = await fetch(
              `${BACKEND_URL}/api/markings/${markingJobId}`
            );
            const markingJob = await markingJobData.json();
            setMarkingJob(markingJob);
          }
          setIsConfiguring(false);
        } catch (err) {
          console.error("Error parsing WebSocket message:", err);
          ws.close();
          reject(err);
          setIsConfiguring(false);
        }
      };

      ws.onerror = (error) => {
        console.error("WebSocket error:", error);
        ws.close();
        reject(new Error("WebSocket connection failed"));
      };

      ws.onclose = (event) => {
        console.log("WebSocket closed:", event.code, event.reason);
        if (event.code !== 1000 && event.code !== 1001) {
          // Not a normal closure or going away
          reject(
            new Error(
              `WebSocket closed unexpectedly: ${
                event.reason || "Unknown reason"
              }`
            )
          );
        }
      };

      // Set a timeout to prevent hanging
      setTimeout(() => {
        if (ws.readyState === WebSocket.OPEN) {
          console.log("WebSocket timeout reached, closing connection");
          ws.close();
          reject(new Error("WebSocket configuration timeout"));
        }
      }, 60000); // 60 second timeout
    });
  };

  const _getMarkingSchemeBubbleData = async () => {
    const markingSchemeConfig = await fetch(
      `${BACKEND_URL}/api/files/download?method=file_id&file_id=${markingJob.marking_config_id}`
    );
    const markingSchemeConfigDataJson = await markingSchemeConfig.json();
    console.log("Marking scheme config data:", markingSchemeConfigDataJson);
    if (!markingSchemeConfigDataJson["answers_with_coordinates"]) {
      showToast("Missing marking scheme bubble data", "error");
    }
    const answersWithCoordinates =
      markingSchemeConfigDataJson["answers_with_coordinates"];
    const bubbleData: Bubble[][] = [];
    const numQuestions = markingSchemeConfigDataJson["num_questions"];
    const numOptionsPerQuestion =
      markingSchemeConfigDataJson["options_per_question"];
    for (let questionIndex = 0; questionIndex < numQuestions; questionIndex++) {
      bubbleData.push([]);
      for (
        let optionIndex = 0;
        optionIndex < numOptionsPerQuestion;
        optionIndex++
      ) {
        const bubble =
          answersWithCoordinates[
            questionIndex * numOptionsPerQuestion + optionIndex
          ];
        bubbleData[questionIndex].push({
          marked: bubble[0],
          x: bubble[1][0],
          y: bubble[1][1],
        });
      }
    }
    return bubbleData;
  };

  const _convertBubbleDataToMarkingSchemeConfig = (bubbleData: Bubble[][]) => {
    const answersWithCoordinates: [boolean, [number, number]][] = [];

    // Flatten the 2D bubble data back to the original format
    for (
      let questionIndex = 0;
      questionIndex < bubbleData.length;
      questionIndex++
    ) {
      for (
        let optionIndex = 0;
        optionIndex < bubbleData[questionIndex].length;
        optionIndex++
      ) {
        const bubble = bubbleData[questionIndex][optionIndex];
        answersWithCoordinates.push([bubble.marked, [bubble.x, bubble.y]]);
      }
    }

    // Calculate metadata
    const numQuestions = bubbleData.length;
    const numOptionsPerQuestion =
      bubbleData.length > 0 ? bubbleData[0].length : 0;

    return {
      answers_with_coordinates: answersWithCoordinates,
      num_questions: numQuestions,
      options_per_question: numOptionsPerQuestion,
    };
  };

  const handleMarkingSchemeVerify = async () => {
    if (!markingJob.marking_config_id || !markingJob.marking_scheme_id) {
      showToast("Missing marking config ID or marking scheme ID", "error");
      return;
    }
    const markingSchemeImageUrl = markingJob.marking_scheme_id
      ? `${BACKEND_URL}/api/files/download?method=file_id&file_id=${markingJob.marking_scheme_id}`
      : null;
    if (!markingSchemeImageUrl) {
      showToast("Missing marking scheme image URL", "error");
      return;
    }
    const bubbleData = await _getMarkingSchemeBubbleData();
    if (!Array.isArray(bubbleData)) {
      showToast("Failed to load marking scheme bubble data", "error");
      return;
    }
    

    // Small delay to ensure the modal is opened
    setTimeout(() => {
      setAnswersCorrectionModalData({
        imageUrl: markingSchemeImageUrl,
        bubbleData,
      });
      setIsAnswersCorrectionModalOpen(true);
    }, 100);
  };

  const handleAnswersCorrectionModalConfirm = async (
    isUpdated: boolean,
    updatedBubbleData: Bubble[][]
  ) => {
    try {
      if (!isUpdated) {
        showToast("No changes made to marking scheme configuration", "success");
        return;
      }
      // Convert bubble data back to marking scheme config format
      const markingSchemeConfig =
        _convertBubbleDataToMarkingSchemeConfig(updatedBubbleData);

      // Send to backend
      const response = await fetch(
        `${BACKEND_URL}/api/markings/${markingJob.id}/update-marking-scheme-config`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ marking_scheme_config: markingSchemeConfig }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to update marking scheme config");
      }

      showToast("Marking scheme configuration updated successfully", "success");
    } catch (error) {
      console.error("Error updating marking scheme config:", error);
      showToast("Failed to update marking scheme configuration", "error");
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Marking Scheme
        </h3>
        <p className="text-sm text-gray-600 mb-6">
          Upload your marking scheme image that will be used as the answer key
          for automatic grading.
        </p>
      </div>

      <div className="max-w-6xl mx-auto">
        {/* Error Summary */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-red-400"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Error</h3>
                <p className="mt-2 text-sm text-red-700">{error}</p>
              </div>
            </div>
          </div>
        )}

        {/* Warning for incomplete previous step */}
        {!markingJob.id && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg
                  className="h-5 w-5 text-amber-400"
                  viewBox="0 0 20 20"
                  fill="currentColor"
                >
                  <path
                    fillRule="evenodd"
                    d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-amber-800">
                  Complete Previous Step
                </h3>
                <p className="mt-2 text-sm text-amber-700">
                  You need to complete the metadata step first before uploading
                  the marking scheme.
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          {/* Left Column - File Upload */}
          <div className="space-y-6">
            <Card className="h-fit">
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-6">
                    Upload Marking Scheme
                  </h3>

                  <div className="space-y-6">
                    <FileUpload
                      label="Upload Marking Scheme *"
                      hint="Upload an image file (JPG, JPEG, PNG) containing your marking scheme"
                      accept=".jpg,.jpeg,.png"
                      maxFiles={1}
                      maxSize={10 * 1024 * 1024} // 10MB
                      onFilesChange={(files) => onFileChange(files[0] || null)}
                      error={error}
                    />

                    {markingSchemeFile && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <div className="flex items-start">
                          <div className="flex-shrink-0">
                            <FontAwesomeIcon
                              icon={faCheck}
                              className="h-5 w-5 text-blue-400"
                            />
                          </div>
                          <div className="ml-3">
                            <h3 className="text-sm font-medium text-blue-800">
                              Marking Scheme Selected
                            </h3>
                            <p className="mt-2 text-sm text-blue-700">
                              File &quot;{markingSchemeFile.name}&quot; is ready
                              to be uploaded and configured.
                            </p>
                            <div className="mt-2 text-xs text-blue-600">
                              Size:{" "}
                              {(markingSchemeFile.size / (1024 * 1024)).toFixed(
                                2
                              )}{" "}
                              MB
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Right Column - File Preview */}
          <div className="space-y-6">
            <Card
              title="Marking Scheme Preview"
              subtitle="Preview of uploaded marking scheme"
              className="h-fit"
            >
              <div className="space-y-6">
                {markingSchemeFile ? (
                  <div className="bg-gray-50 rounded-lg border border-gray-200 overflow-hidden">
                    <div className="relative flex justify-center items-center">
                      <Image
                        src={URL.createObjectURL(markingSchemeFile)}
                        alt="Marking Scheme Preview"
                        width={400}
                        height={500}
                        className="max-w-full max-h-96 object-contain"
                        unoptimized
                      />
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
                      <svg
                        className="w-6 h-6 text-blue-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 002 2z"
                        />
                      </svg>
                    </div>
                    <h5 className="text-lg font-medium text-gray-900 mb-2">
                      No File Selected
                    </h5>
                    <p className="text-gray-500 text-sm">
                      Upload a marking scheme file to see its preview.
                    </p>
                  </div>
                )}
              </div>
            </Card>

            {/* Configure Button - Below Preview */}
            {markingSchemeFile && markingJob.id && (
              <div className="flex justify-between px-10">
                <button
                  onClick={handleMarkingSchemeUploadAndConfigure}
                  disabled={isConfiguring}
                  className="inline-flex items-center px-8 py-3 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <FontAwesomeIcon icon={faCog} className="mr-2 h-4 w-4" />
                  {isConfiguring ? "Configuring..." : "Configure"}
                </button>
                <button
                  onClick={handleMarkingSchemeVerify}
                  disabled={
                    markingJob.status !==
                    MarkingJobStatus.MARKING_SCHEME_CONFIGURED
                  }
                  className="inline-flex items-center px-8 py-3 border border-green-600 text-sm font-medium rounded-md shadow-sm text-green-600 bg-transparent hover:bg-green-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <FontAwesomeIcon icon={faCheck} className="mr-2 h-4 w-4" />
                  {isConfiguring ? "Verifying..." : "Verify"}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
      <AnswersCorrectionModal
        isOpen={isAnswersCorrectionModalOpen}
        onClose={() => setIsAnswersCorrectionModalOpen(false)}
        imageUrl={answersCorrectionModalData.imageUrl}
        bubbleData={answersCorrectionModalData.bubbleData}
        onConfirm={handleAnswersCorrectionModalConfirm}
      />
    </div>
  );
}
