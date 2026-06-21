"use client";
import React, { useEffect, useState } from "react";
import Grid_based_viewer from "../components/Grid_based_viewer";
import Cluster_based_viewer from "../components/Cluster_based_viewer";
import { useToast } from "../../../hooks/useToast";
import axiosInstance from "@/utils/axiosclient";

interface TemplateBubbleViewerProps {
  templateId: string | null;
  configId: string | null;
  configtype: string | null;
  jobId: number | null;
  onClose: () => void;
}

const TemplateBubbleViewer: React.FC<TemplateBubbleViewerProps> = ({
  templateId,
  configId,
  configtype,
  jobId,
  onClose,
}) => {
  const { showToast } = useToast();
  const [templateImage, setTemplateImage] = useState<string | null>(null);
  const [configData, setConfigData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [retryCount, setRetryCount] = useState(0);

  useEffect(() => {
    // Skip if already loaded
    if (templateImage && configData) {
      return;
    }

    const MAX_RETRIES = 3;
    const RETRY_DELAY = 1000; // 1 second between retries

    /**
     * Fetch with retry logic for handling NFS propagation delays
     */
    const fetchWithRetry = async (
      url: string,
      retries: number = MAX_RETRIES
    ): Promise<{ blob: () => Promise<Blob>; json: () => Promise<unknown> }> => {
      for (let attempt = 1; attempt <= retries; attempt++) {
        try {
          const response = await axiosInstance.get(url, {
            responseType: "blob",
          });

          // Success - reset retry count display
          if (attempt > 1) {
            console.log(
              `✓ File fetched successfully after ${attempt} attempts`
            );
          }
          return {
            blob: () => Promise.resolve(response.data as Blob),
            json: async () => {
              if (response.data instanceof Blob) {
                const text = await response.data.text();
                return JSON.parse(text);
              }
              return response.data;
            },
          };
        } catch (error: unknown) {
          const axiosError = error as { response?: { status?: number } };
          // Handle 404 with retry
          if (axiosError.response?.status === 404 && attempt < retries) {
            console.warn(
              `File not found (attempt ${attempt}/${retries}). ` +
                `Retrying in ${RETRY_DELAY}ms... This may be due to NFS propagation delay.`
            );
            setRetryCount(attempt);
            await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY));
            continue;
          }

          // Network or fetch error
          if (attempt === retries) {
            throw error;
          }

          console.warn(
            `Fetch failed (attempt ${attempt}/${retries}):`,
            error instanceof Error ? error.message : "Unknown error",
            `\nRetrying in ${RETRY_DELAY}ms...`
          );
          setRetryCount(attempt);
          await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY));
        }
      }

      throw new Error(`Failed to fetch after ${retries} attempts`);
    };

    const fetchFiles = async () => {
      if (!templateId || !configId || !configtype) {
        console.error("Missing required props:", {
          templateId,
          configId,
          configtype,
        });
        showToast("Missing required template information", "error");
        onClose();
        return;
      }

      try {
        setLoading(true);
        setRetryCount(0);

        const BACKEND_URL =
          process.env.NEXT_PUBLIC_BACKEND_URL || "https://edumark.vihangamunasinghe.com";

        // Fetch template image with retry
        console.log(`Fetching template image (ID: ${templateId})...`);
        const templateResponse = await fetchWithRetry(
          `${BACKEND_URL}/api/files/download?method=file_id&file_id=${templateId}`
        );

        const templateBlob = await templateResponse.blob();

        // Validate blob
        if (templateBlob.size === 0) {
          throw new Error("Template image is empty");
        }

        const templateUrl = URL.createObjectURL(templateBlob);
        setTemplateImage(templateUrl);
        console.log("✓ Template image loaded successfully");

        // Fetch config file with retry
        console.log(`Fetching config file (ID: ${configId})...`);
        const configResponse = await fetchWithRetry(
          `${BACKEND_URL}/api/files/download?method=file_id&file_id=${configId}`
        );

        const configJson = await configResponse.json();

        // Validate config data
        if (!configJson || typeof configJson !== "object") {
          throw new Error("Invalid configuration data received");
        }

        setConfigData(configJson);
        console.log("✓ Configuration loaded successfully");

        setLoading(false);
        setRetryCount(0);
      } catch (error) {
        console.error("Error fetching template files:", error);

        const errorMessage =
          error instanceof Error ? error.message : "Unknown error occurred";

        showToast(
          `Failed to load template files: ${errorMessage}. Please try again.`,
          "error"
        );

        // Clean up and close
        setLoading(false);
        onClose();
      }
    };

    fetchFiles();

    // Cleanup function to revoke object URLs
    return () => {
      if (templateImage) {
        URL.revokeObjectURL(templateImage);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [templateId, configId, configtype]);

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-7xl h-[90vh] overflow-hidden border border-gray-200">
        {/* Header */}
        <div className="bg-white px-6 py-4 flex justify-between items-center border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-2 rounded-lg">
              <svg
                className="h-5 w-5 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                Template Configuration Viewer
              </h2>
              <p className="text-gray-600 text-sm mt-1">
                Configure and preview your template bubbles
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg p-2 transition-colors"
          >
            <svg
              className="h-5 w-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="h-[calc(90vh-80px)]">
          {loading ? (
            <div className="flex flex-col items-center justify-center h-full space-y-4">
              <div className="relative">
                <div className="animate-spin rounded-full h-12 w-12 border-3 border-blue-200"></div>
                <div className="animate-spin rounded-full h-12 w-12 border-3 border-blue-500 border-t-transparent absolute inset-0"></div>
              </div>
              <div className="text-center">
                <p className="text-gray-700 font-medium">
                  Loading template files...
                </p>
                <p className="text-gray-500 text-sm mt-1">
                  Please wait while we prepare your template
                </p>
              </div>
              {retryCount > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-2">
                  <p className="text-sm text-amber-700 font-medium">
                    Retrying... (Attempt {retryCount}/3)
                  </p>
                  <p className="text-xs text-amber-600 mt-1">
                    Files may need a moment to be available
                  </p>
                </div>
              )}
            </div>
          ) : (
            <>
              {configtype === "grid_based" ? (
                <Grid_based_viewer
                  templateImage={templateImage}
                  configData={configData}
                  configId={configId}
                  jobId={jobId}
                  onClose={onClose}
                />
              ) : (
                <Cluster_based_viewer
                  templateImage={templateImage}
                  configData={configData}
                  configId={configId}
                  jobId={jobId}
                  onClose={onClose}
                />
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default TemplateBubbleViewer;
