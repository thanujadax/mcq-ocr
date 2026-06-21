import React, { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCheck, faPlay } from "@fortawesome/free-solid-svg-icons";
import { FileUpload } from "../../../../components/UI/FileUpload";
import { useCreateMarking } from "../../../../hooks/useCreateMarking";
import { useToast } from "../../../../hooks/useToast";
import { useRouter } from "next/navigation";
import { MarkingJob } from "../../types/types";
import axiosInstance from "@/utils/axiosclient";

// Constants for file size limits
const ANSWER_SHEETS_MAX_SIZE = 500 * 1024 * 1024; // 500MB
const INDEX_LIST_MAX_SIZE = 5 * 1024 * 1024; // 5MB
const CHUNK_SIZE = 1024 * 1024; // 1MB chunks

interface AnswerSheetsStepProps {
  answerSheetsFile: File | null;
  error?: string;
  onFileChange: (file: File | null) => void;
}

export function AnswerSheetsStep({
  answerSheetsFile,
  error,
  onFileChange,
}: AnswerSheetsStepProps) {
  const [markingJob, setMarkingJob] = useCreateMarking();
  const { showToast } = useToast();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Added state for optional data file (CSV/XLSX)
  const [dataFile, setDataFile] = useState<File | null>(null);

  // Upload progress state
  const [uploadProgress, setUploadProgress] = useState<{
    isUploading: boolean;
    progress: number;
    fileName: string;
    type: "answer_sheets" | "index_list";
  }>({
    isUploading: false,
    progress: 0,
    fileName: "",
    type: "answer_sheets",
  });

  // Utility function to validate file size
  const validateFileSize = (
    file: File,
    maxSize: number,
    fileType: string
  ): boolean => {
    if (file.size > maxSize) {
      const maxSizeMB = Math.round(maxSize / (1024 * 1024));
      const fileSizeMB = Math.round(file.size / (1024 * 1024));
      showToast(
        `${fileType} file size (${fileSizeMB}MB) exceeds maximum allowed size (${maxSizeMB}MB)`,
        "error"
      );
      return false;
    }
    return true;
  };

  // Utility function to upload file using chunked method for large files
  const uploadFileChunked = async (
    file: File,
    fileType: string
  ): Promise<{ file_id: number }> => {
    const uploadId = Math.random().toString(36).substring(2, 15);
    const totalChunks = Math.ceil(file.size / CHUNK_SIZE);

    // Set initial progress
    setUploadProgress({
      isUploading: true,
      progress: 0,
      fileName: file.name,
      type: fileType === "answer_sheet" ? "answer_sheets" : "index_list",
    });

    // Upload chunks
    for (let chunkIndex = 0; chunkIndex < totalChunks; chunkIndex++) {
      const start = chunkIndex * CHUNK_SIZE;
      const end = Math.min(start + CHUNK_SIZE, file.size);
      const chunk = file.slice(start, end);

      const chunkFormData = new FormData();
      chunkFormData.append("file", chunk, `chunk_${chunkIndex}`);
      chunkFormData.append("upload_id", uploadId);
      chunkFormData.append("chunk_index", chunkIndex.toString());
      chunkFormData.append("total_chunks", totalChunks.toString());
      chunkFormData.append("original_name", file.name);
      chunkFormData.append("save_path", "");
      chunkFormData.append("file_type", fileType);

      await axiosInstance.post("/api/files/upload/large/chunk", chunkFormData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      // Update progress (90% for chunks, 10% for finalization)
      const chunkProgress = Math.round(((chunkIndex + 1) / totalChunks) * 90);
      setUploadProgress((prev) => ({
        ...prev,
        progress: chunkProgress,
      }));
    }

    // Finalize upload
    const finalizeFormData = new FormData();
    finalizeFormData.append("upload_id", uploadId);

    setUploadProgress((prev) => ({
      ...prev,
      progress: 95,
    }));

    const finalizeResponse = await axiosInstance.post(
      "/api/files/upload/large/finalize",
      finalizeFormData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );

    // Complete progress
    setUploadProgress((prev) => ({
      ...prev,
      progress: 100,
    }));

    // Reset progress after a short delay
    setTimeout(() => {
      setUploadProgress({
        isUploading: false,
        progress: 0,
        fileName: "",
        type: "answer_sheets",
      });
    }, 1000);

    return finalizeResponse.data as { file_id: number };
  };

  // Utility function to upload file (regular or chunked based on size)
  const uploadFile = async (
    file: File,
    fileType: string
  ): Promise<{ file_id: number }> => {
    const maxSize =
      fileType === "answer_sheet"
        ? ANSWER_SHEETS_MAX_SIZE
        : INDEX_LIST_MAX_SIZE;

    if (!validateFileSize(file, maxSize, fileType)) {
      throw new Error(`File size exceeds maximum allowed size`);
    }

    // Use chunked upload for files larger than 5MB
    if (file.size > 5 * 1024 * 1024) {
      return await uploadFileChunked(file, fileType);
    }

    // Use regular upload for smaller files
    const formData = new FormData();
    formData.append("file", file);
    formData.append("file_type", fileType);

    // Set progress for regular upload
    setUploadProgress({
      isUploading: true,
      progress: 50,
      fileName: file.name,
      type: fileType === "answer_sheet" ? "answer_sheets" : "index_list",
    });

    const uploadResponse = await axiosInstance.post(
      "/api/files/upload",
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      }
    );

    // Complete progress
    setUploadProgress((prev) => ({
      ...prev,
      progress: 100,
    }));

    // Reset progress after a short delay
    setTimeout(() => {
      setUploadProgress({
        isUploading: false,
        progress: 0,
        fileName: "",
        type: "answer_sheets",
      });
    }, 1000);

    return uploadResponse.data as { file_id: number };
  };

  // Handle file change with validation
  const handleAnswerSheetsChange = (file: File | null) => {
    if (
      file &&
      !validateFileSize(file, ANSWER_SHEETS_MAX_SIZE, "Answer sheets")
    ) {
      return; // Don't set the file if validation fails
    }
    onFileChange(file);
  };

  const handleDataFileChange = (file: File | null) => {
    if (file && !validateFileSize(file, INDEX_LIST_MAX_SIZE, "Index list")) {
      return; // Don't set the file if validation fails
    }
    setDataFile(file);
  };

  const validateStep = (): boolean => {
    return answerSheetsFile !== null;
  };

  const handleSubmit = async () => {
    if (!validateStep() || !markingJob.id || !answerSheetsFile) {
      showToast("Missing required data", "error");
      return;
    }

    setIsSubmitting(true);

    try {
      // Upload answer sheets file using new utility
      showToast("Uploading answer sheets...", "info");
      const uploadData = await uploadFile(answerSheetsFile, "answer_sheet");

      setMarkingJob((prev: MarkingJob) => ({
        ...prev,
        answer_sheets_folder_id: uploadData.file_id,
      }));

      showToast("Answer sheets uploaded successfully", "success");

      // Attempt to upload optional data file (CSV/XLSX) — do not block the main flow if this fails
      if (dataFile) {
        try {
          showToast("Uploading index list file...", "info");
          const dataUploadData = await uploadFile(dataFile, "data_file");

          showToast("Index Number data file uploaded", "success");
          console.log(
            "Index Number data file uploaded with ID:",
            dataUploadData.file_id
          );

          const fileAttachResponse = await axiosInstance.post(
            `/api/markings/${markingJob.id}/attach-index-list`,
            { index_list_file_id: dataUploadData.file_id }
          );

          // Check status, not .ok
          if (
            fileAttachResponse.status < 200 ||
            fileAttachResponse.status >= 300
          ) {
            showToast("Failed to attach index number data file", "error");
          } else {
            console.log("Index list attached successfully!");
            showToast("Index list attached successfully", "success");
          }
        } catch (e) {
          // Non-fatal: inform user but continue
          showToast(
            e instanceof Error
              ? e.message
              : "Error uploading index number data file",
            "error"
          );
        }
      }

      // Attach answer sheets to marking job
      const attachResponse = await axiosInstance.post(
        `/api/markings/${markingJob.id}/attach-answer-sheets`,
        { answer_sheets_folder_id: uploadData.file_id }
      );

      if (attachResponse.status !== 200) {
        throw new Error("Failed to attach answer sheets");
      }

      // Start the marking process
      const startResponse = await axiosInstance.post(
        `/api/markings/${markingJob.id}/start-marking`
      );

      const startData = startResponse.data;
      console.log("Marking process started successfully:", startData);

      showToast("Marking process started successfully", "success");

      // Redirect to marking jobs page
      router.push("/marking-jobs");
    } catch (err) {
      console.error("Error starting marking process:", err);
      showToast(
        err instanceof Error ? err.message : "Failed to start marking process",
        "error"
      );
    } finally {
      setIsSubmitting(false);
    }
  };
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          Answer Sheets
        </h3>
        <p className="text-sm text-gray-600">
          Upload a ZIP file containing all the answer sheets you want to mark
          automatically.
        </p>
      </div>

      <div className="max-w-2xl mx-auto space-y-6">
        <div className="bg-white rounded-lg border border-gray-100 shadow-sm p-6">
          <h4 className="text-base font-semibold text-gray-900 mb-4">
            Upload Answer Sheets
          </h4>
          <FileUpload
            label="Upload Answer Sheets *"
            hint="Upload a ZIP file containing all answer sheets to be marked (max 500MB)"
            accept=".zip"
            maxFiles={1}
            maxSize={ANSWER_SHEETS_MAX_SIZE} // 500MB
            onFilesChange={(files) =>
              handleAnswerSheetsChange(files[0] || null)
            }
            error={error}
          />
        </div>

        {/* Index List File Upload Section */}
        <div className="bg-white rounded-lg border border-gray-100 shadow-sm p-6">
          <h4 className="text-base font-semibold text-gray-900 mb-4">
            Index List File
          </h4>
          <FileUpload
            label="Upload Data File (CSV or XLSX)"
            hint="Upload a file containing all available student index numbers under 'Index No' column (max 5MB)"
            accept=".csv,.xlsx"
            maxFiles={1}
            maxSize={INDEX_LIST_MAX_SIZE} // 5MB
            onFilesChange={(files) => handleDataFileChange(files[0] || null)}
            error={undefined}
          />
          {dataFile && (
            <p className="mt-2 text-sm text-gray-600">
              Selected: {dataFile.name}
            </p>
          )}
        </div>

        {/* Upload Progress Bar */}
        {uploadProgress.isUploading && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
              </div>
              <div className="ml-3 flex-1">
                <h3 className="text-sm font-medium text-blue-800">
                  Uploading{" "}
                  {uploadProgress.type === "answer_sheets"
                    ? "Answer Sheets"
                    : "Index List"}
                </h3>
                <p className="mt-1 text-sm text-blue-700">
                  {uploadProgress.fileName} - {uploadProgress.progress}%
                </p>
                <div className="mt-2 w-full bg-blue-200 rounded-full h-2">
                  <div
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300 ease-out"
                    style={{ width: `${uploadProgress.progress}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </div>
        )}

        {answerSheetsFile && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <FontAwesomeIcon
                  icon={faCheck}
                  className="h-5 w-5 text-green-400"
                />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-green-800">
                  Ready to Start Marking
                </h3>
                <p className="mt-2 text-sm text-green-700">
                  File &quot;{answerSheetsFile.name}&quot; has been uploaded.
                  All files are ready - click &quot;Start Marking&quot; to begin
                  the automatic grading process.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Start Marking Button */}
        {answerSheetsFile && (
          <div className="flex justify-end mt-8">
            <button
              onClick={handleSubmit}
              disabled={isSubmitting || !validateStep()}
              className="inline-flex items-center px-6 py-3 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <FontAwesomeIcon icon={faPlay} className="mr-2 h-4 w-4" />
              {isSubmitting ? "Starting Marking..." : "Start Marking Process"}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
