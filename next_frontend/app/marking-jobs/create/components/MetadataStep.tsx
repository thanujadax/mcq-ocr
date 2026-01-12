import React, { useState, useEffect, useCallback } from "react";
import { Input } from "../../../../components/UI/Input";
import { Select } from "../../../../components/UI/Select";
import { Card } from "../../../../components/UI/Card";
import { Template } from "@/models/template";
import { MarkingJobForm, JobPriority } from "./types";
import ImageViewWithLoarding from "@/components/UI/ImageViewWithLoarding";
import { useCreateMarking } from "../../../../hooks/useCreateMarking";
import { useToast } from "../../../../hooks/useToast";

interface MetadataStepProps {
  formData: MarkingJobForm;
  errors: Partial<Record<keyof MarkingJobForm, string>>;
  onInputChange: (field: keyof MarkingJobForm, value: string | boolean) => void;
  onNext: () => void;
  isSubmitting: boolean;
}

export function MetadataStep({
  formData,
  errors,
  onInputChange,
  onNext,
  isSubmitting,
}: MetadataStepProps) {
  const BACKEND_URL =
    process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";
  const [markingJob, setMarkingJob] = useCreateMarking();
  const { showToast } = useToast();

  const [templates, setTemplates] = useState<Template[]>([]);
  const [loadingTemplates, setLoadingTemplates] = useState(false);
  const [templatesError, setTemplatesError] = useState<string | null>(null);

  const fetchTemplates = useCallback(async () => {
    try {
      setLoadingTemplates(true);
      setTemplatesError(null);

      const params = new URLSearchParams({
        skip: "0",
        limit: "20",
      });

      const response = await fetch(`${BACKEND_URL}/api/templates?${params}`, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch templates: ${response.statusText}`);
      }

      const data = await response.json();
      setTemplates(data);

      // Set default template if available
      if (data.length > 0) {
        onInputChange("template_id", data[0].id.toString());
      }
    } catch (err) {
      console.error("Error fetching templates:", err);
      setTemplatesError(
        err instanceof Error ? err.message : "Failed to fetch templates"
      );
      showToast("Failed to load templates", "error");
    } finally {
      setLoadingTemplates(false);
    }
  }, [showToast, onInputChange, BACKEND_URL]);

  useEffect(() => {
    fetchTemplates();
  }, []);

  const validateStep = (): boolean => {
    return formData.name.trim() !== "" && formData.template_id !== "";
  };

  const handleCreateJob = async () => {
    if (!validateStep()) {
      showToast("Please fill in all required fields", "error");
      return;
    }

    try {
      const marking_job_payload = {
        name: formData.name,
        description: formData.description,
        template_id: parseInt(formData.template_id, 10),
        save_intermediate_results: formData.save_intermediate_results,
        priority: formData.priority,
      };

      if (markingJob.id) {
        const response = await fetch(
          `${BACKEND_URL}/api/markings/${markingJob.id}`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(marking_job_payload),
          }
        );

        if (!response.ok) {
          throw new Error("Failed to update marking job");
        }

        const data = await response.json();
        setMarkingJob((prev) => ({ ...prev, ...data }));
        console.log("Marking job updated successfully:", data);
        showToast("Marking job updated successfully", "success");
      } else {
        const response = await fetch(`${BACKEND_URL}/api/markings`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(marking_job_payload),
        });

        if (!response.ok) {
          throw new Error("Failed to create marking job");
        }

        const data = await response.json();
        setMarkingJob((prev) => ({ ...prev, id: data.id }));
        console.log("Marking job created successfully:", data);
        showToast("Marking job created successfully", "success");
      }

      onNext();
    } catch (err) {
      console.error("Error creating marking job:", err);
      showToast(
        err instanceof Error ? err.message : "Failed to create marking job",
        "error"
      );
    }
  };

  const templateOptions = loadingTemplates
    ? [{ value: "", label: "Loading templates..." }]
    : templatesError
    ? [{ value: "", label: "Error loading templates" }]
    : templates.length === 0
    ? [{ value: "", label: "No templates available" }]
    : templates
        .filter((template) => template.status === "completed")
        .map((template) => ({
          value: template.id.toString(),
          label: `${template.name} (${template.num_questions} questions)`,
        }));

  return (
    <div className="space-y-8">
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Job Metadata</h3>
        <p className="text-sm text-gray-600 mb-6">
          Provide basic information about your marking job and select a
          template.
        </p>
      </div>

      <div className="max-w-6xl mx-auto">
        {/* Error Summary */}
        {(errors.name || errors.template_id) && (
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
                <h3 className="text-sm font-medium text-red-800">
                  Please fix the following errors:
                </h3>
                <div className="mt-2 text-sm text-red-700">
                  <ul className="list-disc pl-5 space-y-1">
                    {errors.name && <li>{errors.name}</li>}
                    {errors.template_id && <li>{errors.template_id}</li>}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          {/* Left Column */}
          <div className="space-y-6">
            {/* Metadata Card - Top Left */}
            <Card className="h-fit">
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 mb-6">
                    Job Information
                  </h3>

                  <div className="space-y-6">
                    <Input
                      label="Job Name"
                      placeholder="e.g., Math Quiz - Grade 10"
                      value={formData.name}
                      onChange={(e) => onInputChange("name", e.target.value)}
                      error={errors.name}
                      required
                    />

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Description
                      </label>
                      <textarea
                        className="block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                        rows={3}
                        placeholder="Optional description for this marking job"
                        value={formData.description}
                        onChange={(e) =>
                          onInputChange("description", e.target.value)
                        }
                      />
                    </div>

                    <Select
                      label="Priority"
                      value={formData.priority}
                      onChange={(e) =>
                        onInputChange("priority", e.target.value as JobPriority)
                      }
                      options={[
                        { value: "normal", label: "Normal" },
                        { value: "urgent", label: "Urgent" },
                      ]}
                      error={errors.priority}
                    />

                    <div className="flex items-start">
                      <div className="flex items-center h-5">
                        <input
                          type="checkbox"
                          id="save_intermediate_results"
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                          checked={formData.save_intermediate_results}
                          onChange={(e) =>
                            onInputChange(
                              "save_intermediate_results",
                              e.target.checked
                            )
                          }
                        />
                      </div>
                      <div className="ml-3">
                        <label
                          htmlFor="save_intermediate_results"
                          className="block text-sm font-medium text-gray-700"
                        >
                          Save intermediate results
                        </label>
                        <p className="text-sm text-gray-500 mt-1">
                          Store progress periodically during processing for
                          recovery if interrupted.
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            {/* Template Information Card - Bottom Left */}
            <Card
              title="Template Selection"
              subtitle="Choose a template for your marking job"
              className="h-fit"
            >
              <div className="space-y-6">
                <Select
                  label="Template"
                  value={formData.template_id}
                  onChange={(e) => onInputChange("template_id", e.target.value)}
                  options={templateOptions}
                  disabled={
                    loadingTemplates ||
                    !!templatesError ||
                    templates.length === 0
                  }
                  error={errors.template_id}
                  required
                />

                {/* Template Info Summary */}
                {formData.template_id &&
                  templates.length > 0 &&
                  (() => {
                    const selectedTemplate = templates.find(
                      (t) => t.id.toString() === formData.template_id
                    );
                    if (selectedTemplate) {
                      return (
                        <div className="bg-blue-50 rounded-lg p-4 border border-blue-200">
                          <div className="flex items-center justify-between mb-3">
                            <h5 className="font-medium text-gray-900">
                              {selectedTemplate.name}
                            </h5>
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              {selectedTemplate.status}
                            </span>
                          </div>
                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div className="flex justify-between">
                              <span className="text-gray-500">Questions:</span>
                              <span className="text-gray-900 font-medium">
                                {selectedTemplate.num_questions}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-gray-500">Options:</span>
                              <span className="text-gray-900 font-medium">
                                {selectedTemplate.options_per_question}
                              </span>
                            </div>
                          </div>
                          {selectedTemplate.description && (
                            <div className="mt-3 pt-3 border-t border-blue-200">
                              <h6 className="font-medium text-gray-900 mb-1">
                                Description
                              </h6>
                              <p className="text-sm text-gray-700">
                                {selectedTemplate.description}
                              </p>
                            </div>
                          )}
                        </div>
                      );
                    }
                    return null;
                  })()}
              </div>
            </Card>
          </div>

          {/* Right Column - Template Preview */}
          <div className="space-y-6">
            <Card
              title="Template Preview"
              subtitle="Preview of selected template"
              className="h-fit"
            >
              <div className="space-y-6">
                {formData.template_id && templates.length > 0 ? (
                  (() => {
                    const selectedTemplate = templates.find(
                      (t) => t.id.toString() === formData.template_id
                    );
                    if (selectedTemplate) {
                      const templateImageUrl = selectedTemplate.template_file_id
                        ? `${BACKEND_URL}/api/files/download?method=file_id&file_id=${selectedTemplate.template_file_id}`
                        : null;

                      return (
                        <div className="bg-gray-50 rounded-lg border border-gray-200 overflow-hidden">
                          {templateImageUrl ? (
                            <div className="relative flex justify-center items-center">
                              <ImageViewWithLoarding
                                request_url={templateImageUrl}
                                alt="Template Image"
                                width={450}
                                height={450}
                              />
                            </div>
                          ) : (
                            <div className="flex flex-col items-center justify-center py-8 text-gray-500">
                              <svg
                                className="w-8 h-8 mb-2"
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
                              <p className="text-sm">No image available</p>
                            </div>
                          )}
                        </div>
                      );
                    }
                    return null;
                  })()
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
                          d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 002 2v12a2 2 0 002 2z"
                        />
                      </svg>
                    </div>
                    <h5 className="text-lg font-medium text-gray-900 mb-2">
                      No Template Selected
                    </h5>
                    <p className="text-gray-500 text-sm">
                      Select a template above to see its preview.
                    </p>
                  </div>
                )}
              </div>
            </Card>

            {/* Initialize Job Button - Below Preview */}
            <div className="flex justify-right">
              <button
                onClick={handleCreateJob}
                disabled={isSubmitting || !validateStep()}
                className="inline-flex items-right px-8 py-3 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting
                  ? "Creating..."
                  : markingJob.id
                  ? "Update Job"
                  : "Initialize Job"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
