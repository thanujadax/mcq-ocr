import React, { useEffect, useState } from "react";
import Image from "next/image";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCheck, faCog } from "@fortawesome/free-solid-svg-icons";
import { FileUpload } from "../../../../components/UI/FileUpload";
import { Card } from "../../../../components/UI/Card";
import { useCreateMarking } from "../../../../hooks/useCreateMarking";
import { useToast } from "../../../../hooks/useToast";
import { Bubble, MarkingJob, MarkingJobStatus } from "../../types/types";
import AnswersCorrectionModal from "@/app/marking-jobs/create/components/MarkingSchemeCorrectionModal";
import { convertBubbleDataToMarkingSchemeConfig } from "../../../utils/results";
import { connectWebSocketWithPromise } from "@/utils/websocketClient";
import axiosInstance from "@/utils/axiosclient";

interface MarkingSchemeStepProps {
  markingSchemeFile: File | null;
  error?: string;
  onFileChange: (file: File | null) => void;
  onNext: () => void;
}

export function MarkingSchemeStep({
  markingSchemeFile,
  error,
  onFileChange,
  onNext,
}: MarkingSchemeStepProps) {
  const [markingJob, setMarkingJob] = useCreateMarking();
  const { showToast } = useToast();
  const [previewImageUrl, setPreviewImageUrl] = useState<string>("");
  const [isConfiguring, setIsConfiguring] = useState(false);
  const [isAnswersCorrectionModalOpen, setIsAnswersCorrectionModalOpen] =
    useState(false);
  const [answersCorrectionModalConfig, setAnswersCorrectionModalConfig] =
    useState<{
      imageUrl: string;
      markingConfigId: number;
    }>({
      imageUrl: "",
      markingConfigId: 0,
    });

  useEffect(() => {
    const backendUrl =
      process.env.NEXT_PUBLIC_BACKEND_URL || "https://edumark.vihangamunasinghe.com";
    const imageUrl = markingJob.marking_scheme_id
      ? `${backendUrl}/api/files/download?method=file_id&file_id=${markingJob.marking_scheme_id}`
      : markingSchemeFile
      ? URL.createObjectURL(markingSchemeFile)
      : "";
    setPreviewImageUrl(imageUrl);
  }, [markingJob.marking_scheme_id, markingSchemeFile]);

  const handleMarkingSchemeUploadAndConfigure = async () => {
    if (
      !markingJob.id ||
      (!markingJob.marking_scheme_id && !markingSchemeFile)
    ) {
      showToast("Missing marking job ID or file", "error");
      return;
    }

    setIsConfiguring(true);
    try {
      let marking_file_id = markingJob.marking_scheme_id;
      if (markingSchemeFile) {
        // Upload marking scheme file
        const marking_file_formData = new FormData();
        marking_file_formData.append("file", markingSchemeFile);
        marking_file_formData.append("file_type", "marking_scheme");

        const uploadResponse = await axiosInstance.post(
          "/api/files/upload",
          marking_file_formData,
          {
            headers: {
              "Content-Type": "multipart/form-data",
            },
          }
        );

        const uploadData = uploadResponse.data as {
          id: number;
          file_id: number;
        };
        setMarkingJob((prev: MarkingJob) => ({
          ...prev,
          marking_scheme_id: uploadData.id,
        }));
        marking_file_id = uploadData.file_id;
        console.log("Marking scheme file uploaded successfully:", uploadData);
        showToast("Marking scheme file uploaded successfully", "success");
      }

      if (marking_file_id) {
        await configureMarkingSchemeViaWebSocket(
          markingJob.id,
          marking_file_id
        );
      } else {
        throw new Error("No marking scheme file ID available");
      }
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

  const configureMarkingSchemeViaWebSocket = async (
    markingJobId: number,
    markingSchemeId: number
  ) => {
    interface WebSocketResponse {
      status: string;
      message?: string;
    }

    try {
      await connectWebSocketWithPromise(
        `/api/markings/${markingJobId}/configure-marking-scheme`,
        {
          initialMessage: { marking_scheme_id: markingSchemeId },
          successCondition: (data: unknown) => {
            const response = data as WebSocketResponse;
            return response.status === "completed";
          },
          errorCondition: (data: unknown) => {
            const response = data as WebSocketResponse;
            return response.status === "error";
          },
          onOpen: () => {
            console.log("WebSocket connected for marking scheme configuration");
          },
        }
      );

      console.log("Marking scheme configuration job completed");
      showToast("Marking scheme configuration job completed", "success");
      setIsConfiguring(false);

      // Refresh marking job data
      const markingJobResponse = await axiosInstance.get(
        `/api/markings/${markingJobId}`
      );
      const markingJob = markingJobResponse.data as MarkingJob;
      setMarkingJob(markingJob);
    } catch (error) {
      console.error("Error in marking scheme configuration:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Configuration failed";
      showToast(errorMessage, "error");
      setIsConfiguring(false);
      throw error; // Re-throw to be handled by the calling function
    }
  };

  const handleMarkingSchemeVerify = async () => {
    if (!markingJob.marking_config_id || !markingJob.marking_scheme_id) {
      showToast("Missing marking config ID or marking scheme ID", "error");
      return;
    }

    const backendUrl =
      process.env.NEXT_PUBLIC_BACKEND_URL || "https://edumark.vihangamunasinghe.com";
    const markingSchemeImageUrl = markingJob.marking_scheme_id
      ? `${backendUrl}/api/files/download?method=file_id&file_id=${markingJob.marking_scheme_id}`
      : "";

    if (!markingSchemeImageUrl) {
      showToast("Missing marking scheme image URL", "error");
      return;
    }

    // Set the URLs and open modal - let modal handle data loading
    setAnswersCorrectionModalConfig({
      imageUrl: markingSchemeImageUrl,
      markingConfigId: markingJob.marking_config_id,
    });

    setIsAnswersCorrectionModalOpen(true);
  };

  const handleAnswersVerifyConfirm = async (
    isUpdated: boolean,
    updatedBubbleData: Bubble[][]
  ) => {
    try {
      let markingSchemeConfig = null;
      if (isUpdated) {
        // Convert bubble data back to marking scheme config format
        markingSchemeConfig =
          convertBubbleDataToMarkingSchemeConfig(updatedBubbleData);
      }
      // Send to backend
      const response = await axiosInstance.post(
        `/api/markings/${markingJob.id}/update-marking-scheme-config`,
        {
          isUpdated: isUpdated,
          marking_scheme_config: markingSchemeConfig,
        }
      );

      showToast("Marking scheme verifid successfully", "success");
      const response_data: MarkingJob = response.data as MarkingJob;
      setMarkingJob(response_data);
      onNext();
    } catch (error) {
      console.error("Error updating marking scheme config:", error);
      showToast("Failed to update marking scheme configuration", "error");
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Marking Scheme
        </h3>
        <p className="text-sm text-gray-600">
          Upload your marking scheme image that will be used as the answer key
          for automatic grading.
        </p>
      </div>

      {/* Error Summary */}
      {error && (
        <div className="bg-red-50 border border-red-100 rounded-lg p-4">
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
        <div className="bg-amber-50 border border-amber-100 rounded-lg p-4">
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

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Left Column - File Upload */}
        <div className="space-y-6">
          <Card className="h-fit">
            <div className="space-y-6">
              <div>
                <h4 className="text-base font-semibold text-gray-900 mb-4">
                  Upload Marking Scheme
                </h4>

                <div className="space-y-4">
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
                    <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
                      <div className="flex items-start">
                        <div className="flex-shrink-0">
                          <FontAwesomeIcon
                            icon={faCheck}
                            className="h-5 w-5 text-blue-400"
                          />
                        </div>
                        <div className="ml-3">
                          <h5 className="text-sm font-medium text-blue-800">
                            Marking Scheme Selected
                          </h5>
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

                  {/* Configure Button */}
                  {(markingJob.marking_scheme_id || markingSchemeFile) &&
                    markingJob.id && (
                      <div className="pt-2">
                        <button
                          onClick={handleMarkingSchemeUploadAndConfigure}
                          disabled={isConfiguring}
                          className="w-full inline-flex justify-center items-center px-4 py-3 border border-transparent text-sm font-medium rounded-lg shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          <FontAwesomeIcon
                            icon={faCog}
                            className="mr-2 h-4 w-4"
                          />
                          {isConfiguring
                            ? "Configuring..."
                            : "Configure Marking Scheme"}
                        </button>
                      </div>
                    )}
                </div>
              </div>
            </div>
          </Card>

          {/* Verify Button - Only show after configuration */}
          {markingJob.status === MarkingJobStatus.MARKING_SCHEME_CONFIGURED && (
            <Card className="h-fit">
              <div className="space-y-4">
                <div>
                  <h4 className="text-base font-semibold text-gray-900 mb-2">
                    Verification
                  </h4>
                  <p className="text-sm text-gray-600">
                    Review and verify the marking scheme configuration before
                    proceeding.
                  </p>
                </div>

                <div className="bg-green-50 border border-green-100 rounded-lg p-4">
                  <div className="flex items-start">
                    <div className="flex-shrink-0">
                      <FontAwesomeIcon
                        icon={faCheck}
                        className="h-5 w-5 text-green-400"
                      />
                    </div>
                    <div className="ml-3">
                      <h5 className="text-sm font-medium text-green-800">
                        Configuration Complete
                      </h5>
                      <p className="mt-2 text-sm text-green-700">
                        Your marking scheme has been configured successfully.
                        You can now verify the settings.
                      </p>
                    </div>
                  </div>
                </div>

                <button
                  onClick={handleMarkingSchemeVerify}
                  className="w-full inline-flex justify-center items-center px-4 py-3 border border-green-600 text-sm font-medium rounded-lg shadow-sm text-green-600 bg-transparent hover:bg-green-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors"
                >
                  <FontAwesomeIcon icon={faCheck} className="mr-2 h-4 w-4" />
                  Verify Configuration
                </button>
              </div>
            </Card>
          )}
        </div>

        {/* Right Column - File Preview */}
        <div className="space-y-6">
          <Card
            title="Marking Scheme Preview"
            subtitle="Preview of uploaded marking scheme"
            className="h-fit"
          >
            <div className="space-y-4">
              {previewImageUrl !== "" ? (
                <div className="bg-gray-50 rounded-lg border border-gray-100 overflow-hidden">
                  <div className="relative flex justify-center items-center">
                    <Image
                      src={previewImageUrl}
                      alt="Marking Scheme Preview"
                      width={400}
                      height={500}
                      className="max-w-full max-h-96 object-contain"
                      unoptimized
                    />
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
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
                  <h5 className="text-base font-medium text-gray-900 mb-2">
                    No File Selected
                  </h5>
                  <p className="text-gray-500 text-sm">
                    Upload a marking scheme file to see its preview.
                  </p>
                </div>
              )}
            </div>
          </Card>
        </div>
      </div>

      <AnswersCorrectionModal
        isOpen={isAnswersCorrectionModalOpen}
        onClose={() => setIsAnswersCorrectionModalOpen(false)}
        imageUrl={answersCorrectionModalConfig.imageUrl}
        markingConfigId={answersCorrectionModalConfig.markingConfigId}
        onConfirm={handleAnswersVerifyConfirm}
      />
    </div>
  );
}
