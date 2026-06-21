"use client";

import { useState, useEffect, useCallback } from "react";
import { Button } from "../../components/UI/Button";
import { VerificationModal } from "../../components/Modals/VerificationModal";
import { useToast } from "../../hooks/useToast";
import {
  PlusIcon,
  DocumentTextIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon,
} from "@heroicons/react/24/outline";
import { Template } from "@/models/template";
import TemplateCard from "./components/template_card";
import { EditTemplateModal } from "./components/EditTemplateModal";
import ViewTemplateModal from "./components/ViewTemplateModal";
import axiosInstance from "@/utils/axiosclient";
import { useRouter } from "next/navigation";

export default function Templates() {
  const router = useRouter();
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<number | null>(null);
  const [viewingTemplate, setViewingTemplate] = useState<Template | null>(null);
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { showToast } = useToast();

  // Fetch templates from API
  const fetchTemplates = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const params = new URLSearchParams({
        skip: "0",
        limit: "20",
      });

      // Make sure the API endpoint matches your backend route
      const response = await axiosInstance.get(`/api/templates?${params}`);
      setTemplates(response.data as Template[]);
    } catch (err) {
      console.error("Error fetching templates:", err);
      setError(
        err instanceof Error ? err.message : "Failed to fetch templates"
      );
      showToast("Failed to load templates", "error");
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  // Fetch templates on component mount
  useEffect(() => {
    fetchTemplates();
  }, [fetchTemplates]);

  const handleDeleteTemplate = async () => {
    if (!selectedTemplate) return;

    try {
      await axiosInstance.delete(`/api/templates/${selectedTemplate}`);
      showToast("Template deleted successfully", "success");

      // Refresh template list
      await fetchTemplates();
    } catch (err) {
      console.error("Error deleting template:", err);
      showToast("Failed to delete template", "error");
    } finally {
      setIsDeleteModalOpen(false);
      setSelectedTemplate(null);
    }
  };

  const handleEditTemplateSave = async (name: string, description: string) => {
    if (!selectedTemplate) return;

    try {
      const payload = {
        name: name,
        description: description,
      };
      console.log("Sending payload:", payload);
      const response = await axiosInstance.put(
        `/api/templates/edit/${selectedTemplate}`,
        payload
      );

      showToast("Template updated successfully", "success");
      console.log(response);
      await fetchTemplates(); // refresh templates
      setIsEditModalOpen(false);
      setSelectedTemplate(null);
    } catch (err) {
      console.error("Error updating template:", err);
      showToast("Failed to update template", "error");
    }
  };

  const viewTemplate = (template: Template) => {
    setViewingTemplate(template);
    setIsViewModalOpen(true);
  };

  const confirmDelete = (id: number) => {
    setSelectedTemplate(id);
    setIsDeleteModalOpen(true);
  };

  const editTemplate = (id: number) => {
    setSelectedTemplate(id);
    setIsEditModalOpen(true);
  };
  return (
    <div className="space-y-6 p-6">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">My Templates</h1>
          <p className="text-gray-600 mt-2">
            Manage your MCQ templates and grading configurations
          </p>
        </div>
        <Button
          variant="primary"
          icon={<PlusIcon className="h-5 w-5" />}
          onClick={() => router.push("/templates/create")}
          className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 shadow-lg hover:shadow-xl transition-all duration-200"
        >
          New Template
        </Button>
      </div>

      {/* Info Card */}
      <div className="bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 p-6 rounded-2xl">
        <div className="flex items-start space-x-4">
          <div className="bg-blue-500 p-3 rounded-xl">
            <DocumentTextIcon className="h-6 w-6 text-white" />
          </div>
          <div>
            <h3 className="font-semibold text-blue-900 mb-2">
              Template Management
            </h3>
            <p className="text-blue-700 text-sm leading-relaxed">
              Upload your MCQ templates or other grading templates. Supported
              formats include JPEG, PNG. Create reusable templates for
              consistent evaluation.
            </p>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="flex flex-col items-center justify-center py-16">
          <div className="bg-blue-50 p-6 rounded-2xl mb-4">
            <ArrowPathIcon className="h-8 w-8 text-blue-600 animate-spin" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Loading templates
          </h3>
          <p className="text-gray-500">
            Please wait while we fetch your templates...
          </p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-6">
          <div className="flex items-start space-x-4">
            <div className="bg-red-500 p-3 rounded-xl">
              <ExclamationTriangleIcon className="h-6 w-6 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-red-900 mb-2">
                Error loading templates
              </h3>
              <p className="text-red-700 text-sm mb-4">{error}</p>
              <Button
                variant="secondary"
                onClick={fetchTemplates}
                icon={<ArrowPathIcon className="h-4 w-4" />}
                className="bg-white border-red-300 text-red-700 hover:bg-red-50"
              >
                Try Again
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Templates Grid */}
      {!loading && !error && (
        <div>
          {templates.length > 0 ? (
            <>
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">
                  Your Templates ({templates.length})
                </h2>
              </div>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {templates.map((template) => (
                  <TemplateCard
                    key={template.id}
                    template={template}
                    viewTemplate={viewTemplate}
                    confirmDelete={confirmDelete}
                    editTemplate={editTemplate}
                  />
                ))}
              </div>
            </>
          ) : (
            <div className="text-center py-16">
              <div className="bg-gray-50 p-8 rounded-2xl mb-6 max-w-md mx-auto">
                <DocumentTextIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  No templates yet
                </h3>
                <p className="text-gray-500 mb-6">
                  Get started by creating your first template for MCQ evaluation
                </p>
                <Button
                  variant="primary"
                  onClick={() => router.push("/templates/create")}
                  icon={<PlusIcon className="h-5 w-5" />}
                  className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
                >
                  Create Your First Template
                </Button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Modals */}
      <VerificationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteTemplate}
        title="Delete Template"
        message="Are you sure you want to delete this template? This action cannot be undone."
        confirmText="Delete"
        type="warning"
      />

      <EditTemplateModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSave={handleEditTemplateSave}
        existingName={
          templates.find((t) => t.id === selectedTemplate)?.name || ""
        }
        existingDescription={
          templates.find((t) => t.id === selectedTemplate)?.description || ""
        }
      />

      <ViewTemplateModal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        template={viewingTemplate}
      />
    </div>
  );
}
