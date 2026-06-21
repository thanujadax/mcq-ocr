"use client";

import { useState, useEffect, useLayoutEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Button } from "../../../components/UI/Button";
import { ArrowLeftIcon, PhotoIcon } from "@heroicons/react/24/outline";
import Image from "next/image";
import { useToast } from "../../../hooks/useToast";
import TemplateBubbleViewer from "../view/TemplateBubbleViewer";
import axiosInstance from "@/utils/axiosclient";
import { connectWebSocketWithPromise } from "@/utils/websocketClient";

interface TemplateForm {
  name: string;
  description: string;
  configType: "grid_based" | "cluster_based";
  templateImage: File | null;
  numColumns?: number;
  rowsPerColumn?: number[];
  optionsPerQuestion?: number;
}

interface UploadResponse {
  file_id: number;
}

// Component that uses useSearchParams - wrapped in Suspense
function CreateTemplateContent() {
  const router = useRouter();
  const { showToast } = useToast();

  const [formData, setFormData] = useState<TemplateForm>({
    name: "",
    description: "",
    configType: "grid_based",
    templateImage: null,
  });
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [errors, setErrors] = useState<
    Partial<Record<keyof TemplateForm, string>>
  >({});
  const [showViewer, setShowViewer] = useState(false);
  const [templateId, setTemplateId] = useState<string | null>(null);
  const [configId, setConfigId] = useState<string | null>(null);
  const [configtype, setConfigType] = useState<string | null>(null);
  const [jobId, setJobId] = useState<number | null>(null);

  const searchParams = useSearchParams();
  useLayoutEffect(() => {
    // Reset to default values on component mount
    if (searchParams.get("reset") === "true") {
      setShowViewer(false);
      setErrors({});
      setTemplateId(null);
      setConfigId(null);
      setConfigType(null);
      setJobId(null);
    }
    router.replace("/templates/create");
  }, [searchParams, router]);
  // Handle image preview
  useEffect(() => {
    if (formData.templateImage) {
      const url = URL.createObjectURL(formData.templateImage);
      setPreviewUrl(url);
      return () => URL.revokeObjectURL(url);
    }
  }, [formData.templateImage]);

  // Reset cluster-based fields when configType changes
  useEffect(() => {
    if (formData.configType === "grid_based") {
      setFormData((prev) => ({
        ...prev,
        numColumns: undefined,
        rowsPerColumn: [],
        optionsPerQuestion: undefined,
      }));
    }
  }, [formData.configType]);

  const handleInputChange = (
    field: keyof TemplateForm,
    value: string | File | number | number[] | null
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
    if (errors[field]) {
      setErrors((prev) => ({
        ...prev,
        [field]: undefined,
      }));
    }
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      handleInputChange("templateImage", file);
    }
  };

  const handleRowsPerColumnChange = (columnIndex: number, value: string) => {
    const newRows = [...(formData.rowsPerColumn || [])];
    newRows[columnIndex] = parseInt(value) || 0;
    handleInputChange("rowsPerColumn", newRows);
  };

  // Validation logic
  const validateForm = (): boolean => {
    const newErrors: Partial<Record<keyof TemplateForm, string>> = {};

    if (!formData.name) newErrors.name = "Template name is required.";
    // Description is now optional - removed validation
    if (!formData.templateImage)
      newErrors.templateImage = "Template image is required.";

    if (formData.configType === "cluster_based") {
      if (!formData.numColumns || formData.numColumns <= 0)
        newErrors.numColumns = "Number of columns is required.";

      // Check if all rows per column are filled (no empty or zero values)
      if (
        !formData.rowsPerColumn ||
        formData.rowsPerColumn.length !== formData.numColumns
      ) {
        newErrors.rowsPerColumn = "Please fill all row counts for each column.";
      } else {
        // Check if any value is empty, zero, or invalid
        const hasEmptyOrInvalidRows = formData.rowsPerColumn.some(
          (rows) => !rows || rows <= 0 || isNaN(rows)
        );
        if (hasEmptyOrInvalidRows) {
          newErrors.rowsPerColumn =
            "All rows per column counts must be filled with valid numbers greater than 0.";
        }
      }

      if (!formData.optionsPerQuestion || formData.optionsPerQuestion <= 0)
        newErrors.optionsPerQuestion = "Options per question is required.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // WebSocket configuration using the authenticated WebSocket utility
  const configureTemplateViaWebSocket = async (jobId: number) => {
    interface WebSocketResponse {
      status: string;
      message?: string;
      data?: {
        template_file_id: number;
        configuration_file_id: number;
        config_type: string;
      };
    }

    try {
      const result = await connectWebSocketWithPromise<
        WebSocketResponse["data"]
      >(`/api/templates/${jobId}/configure`, {
        successCondition: (data: unknown) => {
          const response = data as WebSocketResponse;
          return response.status === "completed";
        },
        errorCondition: (data: unknown) => {
          const response = data as WebSocketResponse;
          return response.status === "error";
        },
        dataExtractor: (data: unknown) => {
          const response = data as WebSocketResponse;
          return response.data;
        },
      });

      if (result) {
        setTemplateId(String(result.template_file_id));
        setConfigId(String(result.configuration_file_id));
        setConfigType(String(result.config_type));
        setShowViewer(true);
      }
    } catch (error) {
      throw error; // Re-throw to be handled by the calling function
    }
  };

  const handleUpload = async () => {
    if (!validateForm()) {
      showToast("Please fill in all required fields.", "error");
      return;
    }

    try {
      const uploadFormData = new FormData();
      uploadFormData.append("file", formData.templateImage!);
      uploadFormData.append("file_type", "template");

      const uploadResponse = await axiosInstance.post(
        "/api/files/upload",
        uploadFormData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        }
      );

      const uploadData: UploadResponse = uploadResponse.data as UploadResponse;

      const templatePayload: Record<string, string | number | number[]> = {
        name: formData.name,
        description: formData.description,
        config_type: formData.configType,
        template_file_id: uploadData.file_id,
      };

      if (formData.configType === "cluster_based") {
        if (formData.numColumns)
          templatePayload.num_of_columns = formData.numColumns;
        if (formData.rowsPerColumn)
          templatePayload.num_of_rows_per_column = formData.rowsPerColumn;
        if (formData.optionsPerQuestion)
          templatePayload.num_of_options_per_question =
            formData.optionsPerQuestion;
      }

      const createResponse = await axiosInstance.post(
        "/api/templates",
        templatePayload
      );

      const { job_id } = createResponse.data as { job_id: number };
      if (typeof job_id === "number") {
        setJobId(job_id);
      } else if (typeof job_id === "string") {
        // Convert if it comes as string
        setJobId(parseInt(job_id, 10));
      } else {
        throw new Error("Invalid job_id format received");
      }
      // Start WebSocket configuration
      await configureTemplateViaWebSocket(Number(job_id));
      showToast("Template uploaded successfully!", "success");
    } catch (error) {
      console.error(error);
      showToast("Failed to upload template.", "error");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
      <div className="space-y-6 p-6">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Page Header - Modern design matching marking job create */}
          <div className="bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 rounded-2xl p-6">
            <div className="flex justify-between items-center">
              <div>
                <div className="flex items-center mb-3">
                  <Button
                    variant="secondary"
                    size="sm"
                    icon={<ArrowLeftIcon className="h-4 w-4" />}
                    onClick={() => router.push("/templates")}
                    className="inline-flex items-center mr-4"
                  >
                    Back to Templates
                  </Button>
                </div>
                <div className="flex items-center space-x-3">
                  <div className="bg-blue-500 p-2 rounded-xl">
                    <PhotoIcon className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900">
                      Create New Template
                    </h1>
                    <p className="text-gray-600 mt-1">
                      Configure your template settings and upload the template
                      image
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Main Content Card */}
          <div className="bg-white rounded-2xl shadow-xl border border-gray-100 overflow-hidden">
            {/* Two Column Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 p-8">
              {/* Left Column - Form */}
              <div className="space-y-8">
                {/* Basic Information Section */}
                <div className="space-y-6">
                  <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                    <span className="bg-blue-100 text-blue-600 rounded-lg p-2 mr-3">
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
                          d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                    </span>
                    Basic Information
                  </h2>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Template Name *
                      </label>
                      <input
                        type="text"
                        value={formData.name}
                        onChange={(e) =>
                          handleInputChange("name", e.target.value)
                        }
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                        placeholder="e.g., Math Quiz - Grade 10"
                      />
                      {errors.name && (
                        <p className="text-sm text-red-600 mt-2 flex items-center">
                          {errors.name}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Description{" "}
                        <span className="text-gray-400 text-xs font-normal">
                          (optional)
                        </span>
                      </label>
                      <textarea
                        value={formData.description}
                        onChange={(e) =>
                          handleInputChange("description", e.target.value)
                        }
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-none"
                        rows={3}
                        placeholder="Optional description for this marking job"
                      />
                      {errors.description && (
                        <p className="text-sm text-red-600 mt-2">
                          {errors.description}
                        </p>
                      )}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Configuration Type *
                      </label>
                      <select
                        value={formData.configType}
                        onChange={(e) =>
                          handleInputChange("configType", e.target.value)
                        }
                        className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                      >
                        <option value="grid_based">Grid Based</option>
                        <option value="cluster_based">Cluster Based</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Cluster Configuration Section */}
                {formData.configType === "cluster_based" && (
                  <div className="space-y-6">
                    <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                      <span className="bg-purple-100 text-purple-600 rounded-lg p-2 mr-3">
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
                            d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 9a2 2 0 00-2 2v2a2 2 0 002 2m0 0h14m-14 0v6m14-6v6"
                          />
                        </svg>
                      </span>
                      Cluster Configuration
                    </h2>

                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Number of Columns *
                        </label>
                        <input
                          type="number"
                          min={1}
                          onWheel={(e) => e.currentTarget.blur()}
                          value={formData.numColumns || ""}
                          onChange={(e) =>
                            handleInputChange(
                              "numColumns",
                              parseInt(e.target.value)
                            )
                          }
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                          placeholder="Enter number of columns"
                        />
                        {errors.numColumns && (
                          <p className="text-sm text-red-600 mt-2">
                            {errors.numColumns}
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Options per Question *
                        </label>
                        <input
                          type="number"
                          min={1}
                          onWheel={(e) => e.currentTarget.blur()}
                          value={formData.optionsPerQuestion || ""}
                          onChange={(e) =>
                            handleInputChange(
                              "optionsPerQuestion",
                              parseInt(e.target.value)
                            )
                          }
                          className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                          placeholder="Enter options per question"
                        />
                        {errors.optionsPerQuestion && (
                          <p className="text-sm text-red-600 mt-2">
                            {errors.optionsPerQuestion}
                          </p>
                        )}
                      </div>

                      {formData.numColumns && formData.numColumns > 0 && (
                        <div className="space-y-4">
                          <label className="block text-sm font-medium text-gray-700">
                            Rows per Column *
                          </label>
                          <div className="grid grid-cols-2 gap-3">
                            {Array.from({ length: formData.numColumns }).map(
                              (_, index) => (
                                <div key={index} className="space-y-1">
                                  <label className="block text-xs font-medium text-gray-500">
                                    Column {index + 1}
                                  </label>
                                  <input
                                    type="number"
                                    min={1}
                                    onWheel={(e) => e.currentTarget.blur()}
                                    value={
                                      formData.rowsPerColumn?.[index] || ""
                                    }
                                    onChange={(e) =>
                                      handleRowsPerColumnChange(
                                        index,
                                        e.target.value
                                      )
                                    }
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                                    placeholder="Rows"
                                  />
                                </div>
                              )
                            )}
                          </div>
                          {errors.rowsPerColumn && (
                            <p className="text-sm text-red-600 mt-2">
                              {errors.rowsPerColumn}
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Template Image Upload Section */}
                <div className="space-y-6">
                  <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                    <span className="bg-green-100 text-green-600 rounded-lg p-2 mr-3">
                      <PhotoIcon className="h-5 w-5" />
                    </span>
                    Template Image
                  </h2>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-4">
                      Upload Template Image *
                    </label>
                    <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer bg-gray-50 hover:bg-gray-100 transition-colors group">
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <PhotoIcon className="h-8 w-8 text-gray-400 group-hover:text-gray-500 transition-colors mb-2" />
                        <p className="text-sm text-gray-600">
                          <span className="font-semibold">Click to upload</span>{" "}
                          or drag and drop
                        </p>
                        <p className="text-xs text-gray-500">
                          PNG, JPG, JPEG (MAX. 10MB)
                        </p>
                      </div>
                      <input
                        type="file"
                        className="hidden"
                        accept="image/*"
                        onChange={handleImageUpload}
                      />
                    </label>
                    {errors.templateImage && (
                      <p className="text-sm text-red-600 mt-2">
                        {errors.templateImage}
                      </p>
                    )}
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
                  <Button
                    variant="secondary"
                    onClick={() => router.push("/templates")}
                    className="px-6 py-2"
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="primary"
                    onClick={handleUpload}
                    className="px-8 py-2"
                  >
                    Create Template
                  </Button>
                </div>
              </div>

              {/* Right Column - Preview */}
              <div className="space-y-6">
                <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                  <span className="bg-orange-100 text-orange-600 rounded-lg p-2 mr-3">
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
                        d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                      />
                    </svg>
                  </span>
                  Template Preview
                </h2>

                <div className="bg-gray-50 border-2 border-dashed border-gray-300 rounded-xl p-6 h-[600px] flex items-center justify-center">
                  {previewUrl ? (
                    <div className="relative w-full h-full">
                      <Image
                        src={previewUrl}
                        alt="Template preview"
                        fill
                        style={{ objectFit: "contain" }}
                        className="rounded-xl"
                      />
                    </div>
                  ) : (
                    <div className="text-center">
                      <svg
                        className="mx-auto h-12 w-12 text-gray-400"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                      <h3 className="mt-2 text-sm font-medium text-gray-900">
                        No template selected
                      </h3>
                      <p className="mt-1 text-sm text-gray-500">
                        Upload an image to see the preview
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {showViewer && templateId && configId && configtype && (
          <TemplateBubbleViewer
            configId={configId}
            templateId={templateId}
            configtype={configtype}
            jobId={jobId}
            onClose={() => setShowViewer(false)}
          />
        )}
      </div>
    </div>
  );
}

// Main component with Suspense boundary
export default function CreateTemplate() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <CreateTemplateContent />
    </Suspense>
  );
}
