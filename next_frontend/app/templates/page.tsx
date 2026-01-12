"use client";

import { useState, useEffect } from "react";
import { Button } from "../../components/UI/Button";
import { VerificationModal } from "../../components/Modals/VerificationModal";
import { useToast } from "../../hooks/useToast";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus } from "@fortawesome/free-solid-svg-icons";
import { Template } from "@/models/template";
import TemplateCard from "./components/template_card";
import ViewTemplateModal from "./components/view-template-modal";
import { FormUploadModal } from "@/components/Modals/FormUploadModal";

const BACKEND_URL = process.env.BACKEND_URL || "http://localhost:8000/api";

const selectFormConfig = [
  {
    name: "config_type",
    label: "Config Type",
    options: [
      { value: "grid_based", label: "Grid Based" },
      { value: "clustering_based", label: "Cluster Based" },
    ],
    defaultValue: "grid_based",
  },
  {
    name: "save_intermediate_results",
    label: "Save Intermediate Results",
    options: [
      { value: "true", label: "Yes" },
      { value: "false", label: "No" },
    ],
    defaultValue: "false",
  },
];

const inputFormConfig = [
  {
    name: "name",
    label: "Name",
    type: "text",
    placeholder: "Enter name",
    required: true,
    defaultValue: "",
  },
  {
    name: "description",
    label: "Description",
    type: "text",
    placeholder: "Enter description",
    defaultValue: "",
  },
  {
    name: "num_of_columns",
    label: "Number of Columns",
    type: "number",
    placeholder: "3",
    defaultValue: "3",
  },
  {
    name: "num_of_rows_per_column",
    label: "Rows per Column",
    type: "number",
    placeholder: "30",
    defaultValue: "30",
  },
  {
    name: "num_of_options_per_question",
    label: "Options per Question",
    type: "number",
    placeholder: "5",
    defaultValue: "5",
  },
];

const fileFormConfig = [
  {
    name: "template_image", // required
    label: "Upload your template image",
    accept: ".jpg,.jpeg,.png", // correct key
    maxSize: 10 * 1024 * 1024, // correct key
    maxFiles: 1,
    required: true,
    fullWidth: true,
  },
];

export default function Templates() {
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<number | null>(null);
  const [viewingTemplate, setViewingTemplate] = useState<Template | null>(null);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { showToast } = useToast();

  // Fetch templates from API
  const fetchTemplates = async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        skip: "0",
        limit: "20",
      });

      const response = await fetch(`${BACKEND_URL}/templates?${params}`, {
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
    } catch (err) {
      console.error("Error fetching templates:", err);
      setError(
        err instanceof Error ? err.message : "Failed to fetch templates"
      );
      showToast("Failed to load templates", "error");
    } finally {
      setLoading(false);
    }
  };

  // Fetch templates on component mount
  useEffect(() => {
    fetchTemplates();
  }, []);

  const handleDeleteTemplate = () => {
    // In a real app, this would make an API call to delete the template
    console.log(`Deleting template with ID: ${selectedTemplate}`);
    showToast("Template deleted successfully", "success");
    setIsDeleteModalOpen(false);
    setSelectedTemplate(null);
    // Refresh the templates list after deletion
    fetchTemplates();
  };

  const viewTemplate = (template: Template) => {
    setViewingTemplate(template);
    setIsViewModalOpen(true);
  };

  const confirmDelete = (id: number) => {
    setSelectedTemplate(id);
    setIsDeleteModalOpen(true);
  };

  const handleUpload = async (formData: FormData) => {
    console.log("Uploading form:", formData);

    const file_formData = new FormData();
    const file = formData.get("template_image") as File;
    file_formData.append("file", file);
    file_formData.append("file_type", "template");
    const uploadResponse = await fetch(`${BACKEND_URL}/files/upload`, {
      method: "POST",
      body: file_formData,
    });

    if (!uploadResponse.ok) {
      console.error("Upload failed:", uploadResponse.statusText);
      showToast("File upload failed", "error");
      return;
    }

    const uploadData = await uploadResponse.json();
    console.log("Upload success:", uploadData);

    showToast("Template uploaded successfully", "success");
    const filePath = uploadData.path; // <-- key returned from backend

    const template_json_payload = JSON.stringify({
      name: formData.get("name"),
      description: formData.get("description"),
      config_type: formData.get("config_type"),
      template_path: filePath,
      save_intermediate_results:
        formData.get("save_intermediate_results") === "true",
      num_of_columns: parseInt(formData.get("num_of_columns") as string, 10),
      num_of_rows_per_column: parseInt(
        formData.get("num_of_rows_per_column") as string,
        10
      ),
      num_of_options_per_question: parseInt(
        formData.get("num_of_options_per_question") as string,
        10
      ),
    });

    const processResponse = await fetch(`${BACKEND_URL}/templates`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: template_json_payload,
    });
    if (!processResponse.ok) {
      console.error("Processing failed:", processResponse.statusText);
      showToast("Template processing failed", "error");
      return;
    }
    const processData = await processResponse.json();
    console.log("Processing success:", processData);
    setIsUploadModalOpen(false);

    // Refresh the templates list after successful upload
    fetchTemplates();
  };

  return (
    <>
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-900">My Templates</h2>
        <Button
          variant="primary"
          icon={<FontAwesomeIcon icon={faPlus} className="h-4 w-4" />}
          onClick={() => setIsUploadModalOpen(true)}
        >
          New Template
        </Button>
      </div>

      <div className="bg-white p-4 rounded-md shadow-sm mb-4">
        <p className="text-sm text-gray-600">
          Upload your MCQ templates or other grading templates. Supported
          formats include Excel (.xlsx), CSV, and PDF with structured format.
        </p>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex justify-center items-center py-8">
          <div className="text-gray-600">Loading templates...</div>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4 mb-4">
          <div className="text-red-800 text-sm">Error: {error}</div>
          <Button variant="secondary" onClick={fetchTemplates} className="mt-2">
            Retry
          </Button>
        </div>
      )}

      {/* Templates Grid */}
      {!loading && !error && (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {templates.length > 0 ? (
            templates.map((template) => (
              <TemplateCard
                key={template.id}
                template={template}
                viewTemplate={viewTemplate}
                confirmDelete={confirmDelete}
              />
            ))
          ) : (
            <div className="col-span-full text-center py-8">
              <div className="text-gray-500">No templates found</div>
              <Button
                variant="primary"
                onClick={() => setIsUploadModalOpen(true)}
                className="mt-4"
              >
                Create Your First Template
              </Button>
            </div>
          )}
        </div>
      )}

      {/* File Upload Modal */}
      <FormUploadModal
        isOpen={isUploadModalOpen}
        onClose={() => setIsUploadModalOpen(false)}
        onUpload={handleUpload}
        type="template"
        title="Upload MCQ Template"
        fileFormConfig={fileFormConfig}
        selectFormConfig={selectFormConfig}
        inputFormConfig={inputFormConfig}
      />

      {/* Delete Confirmation Modal */}
      <VerificationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteTemplate}
        title="Delete Template"
        message="Are you sure you want to delete this template? This action cannot be undone."
        confirmText="Delete"
        type="warning"
      />

      {/* View Template Modal */}
      {viewingTemplate && (
        <ViewTemplateModal
          isViewModalOpen={isViewModalOpen}
          setIsViewModalOpen={setIsViewModalOpen}
          viewingTemplate={viewingTemplate}
        />
      )}
    </>
  );
}
