"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Template } from "@/models/template";
import { useToast } from "@/hooks/useToast";
import axiosInstance from "@/utils/axiosclient";

interface ViewTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  template: Template | null;
}

export default function ViewTemplateModal({
  isOpen,
  onClose,
  template,
}: ViewTemplateModalProps) {
  const { showToast } = useToast();
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [loadingImage, setLoadingImage] = useState(false);

  useEffect(() => {
    if (!isOpen || !template?.template_file_id) return;

    const fetchImage = async () => {
      setLoadingImage(true);
      try {
        const response = await axiosInstance.get(
          `/api/files/download?method=file_id&file_id=${template.template_file_id}`,
          { responseType: "blob" }
        );

        const blob = response.data as Blob;
        const url = URL.createObjectURL(blob);
        setImageUrl(url);
      } catch (err) {
        console.error(err);
        showToast("Failed to load template image", "error");
      } finally {
        setLoadingImage(false);
      }
    };

    fetchImage();
  }, [isOpen, showToast, template?.template_file_id]);

  if (!isOpen || !template) return null;

  // Format rows per column nicely if it's an array or string
  const formatRowsPerColumn = (
    rows: number[] | string | number | null | undefined
  ) => {
    if (!rows)
      return (
        <div className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-500">
          No data available
        </div>
      );
    const arr = Array.isArray(rows)
      ? rows
      : typeof rows === "string"
      ? rows.split(",").map((n) => n.trim())
      : [rows];

    return (
      <div className="space-y-2">
        {arr.map((r, idx) => (
          <div
            key={idx}
            className="bg-gradient-to-r from-purple-50 to-purple-100 border border-purple-200 rounded-xl px-4 py-3"
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-purple-900">
                Column {idx + 1}
              </span>
              <span className="inline-flex items-center px-2 py-1 rounded-lg text-xs font-semibold bg-purple-100 text-purple-800 border border-purple-200">
                {r} rows
              </span>
            </div>
          </div>
        ))}
      </div>
    );
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl h-[90vh] overflow-hidden border border-gray-200">
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
                Template Details
              </h2>
              <p className="text-gray-600 text-sm mt-1">
                View template configuration and preview
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
        <div className="flex h-[calc(90vh-140px)]">
          {/* Left Column - Template Details */}
          <div className="w-1/2 p-6 space-y-6 overflow-y-auto">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Template Name
                </label>
                <div className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900 font-medium">
                  {template.name}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Description
                </label>
                <div className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-700 min-h-[60px]">
                  {template.description || "No description provided"}
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Number of Questions
                </label>
                <div className="bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 rounded-xl px-4 py-3 text-blue-900 font-semibold">
                  {template.num_questions} questions
                </div>
              </div>

              {template.config_type === "cluster_based" && (
                <>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Number of Columns
                    </label>
                    <div className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900 font-medium">
                      {template.num_of_columns} columns
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Rows per Column
                    </label>
                    <div className="space-y-2">
                      {formatRowsPerColumn(template.num_of_rows_per_column)}
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Options per Question
                    </label>
                    <div className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900 font-medium">
                      {template.num_of_options_per_question} options
                    </div>
                  </div>
                </>
              )}

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-2">
                  Configuration Type
                </label>
                <div className="bg-gradient-to-r from-green-50 to-green-100 border border-green-200 rounded-xl px-4 py-3">
                  <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">
                    {template.config_type === "cluster_based"
                      ? "Cluster Based"
                      : "Grid Based"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column - Template Preview */}
          <div className="w-1/2 p-6 border-l border-gray-200 bg-gray-50">
            <div className="h-full flex flex-col">
              <div className="mb-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Template Preview
                </h3>
                <p className="text-sm text-gray-600">
                  Original template image used for configuration
                </p>
              </div>

              <div className="flex-1 flex items-center justify-center bg-white rounded-xl border-2 border-dashed border-gray-300 overflow-hidden">
                {loadingImage ? (
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent mx-auto mb-3"></div>
                    <p className="text-gray-600 font-medium">
                      Loading image...
                    </p>
                    <p className="text-gray-400 text-sm">Please wait</p>
                  </div>
                ) : imageUrl ? (
                  <div className="w-full h-full p-4">
                    <Image
                      src={imageUrl}
                      alt={`Template ${template.name}`}
                      width={800}
                      height={600}
                      className="w-full h-full object-contain rounded-lg border border-gray-200"
                      style={{
                        width: "auto",
                        height: "auto",
                        maxWidth: "100%",
                        maxHeight: "100%",
                      }}
                    />
                  </div>
                ) : (
                  <div className="text-center text-gray-400">
                    <svg
                      className="mx-auto h-12 w-12 mb-3"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1}
                        d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                      />
                    </svg>
                    <p className="font-medium">No image available</p>
                    <p className="text-sm">
                      Template image could not be loaded
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
      </div>
    </div>
  );
}
