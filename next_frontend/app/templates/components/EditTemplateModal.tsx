"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/UI/Button";

interface EditTemplateModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (name: string, description: string) => void;
  existingName?: string;
  existingDescription?: string;
}

export function EditTemplateModal({
  isOpen,
  onClose,
  onSave,
  existingName = "",
  existingDescription = "",
}: EditTemplateModalProps) {
  const [name, setName] = useState(existingName);
  const [description, setDescription] = useState(existingDescription);

  useEffect(() => {
    // When the modal opens, prefill with existing values
    if (isOpen) {
      setName(existingName);
      setDescription(existingDescription);
    }
  }, [isOpen, existingName, existingDescription]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-gray-200">
        {/* Header */}
        <div className="bg-white px-6 py-4 flex justify-between items-center border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="bg-blue-100 text-blue-600 rounded-lg p-2">
              <svg
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                />
              </svg>
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Edit Template</h2>
              <p className="text-gray-600 text-sm mt-1">
                Update template information
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
        <div className="p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Template Name *
            </label>
            <input
              type="text"
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter template name"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Description{" "}
              <span className="text-gray-400 text-xs font-normal">
                (optional)
              </span>
            </label>
            <textarea
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors resize-none"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter template description"
              rows={3}
            />
          </div>
        </div>

        {/* Action Buttons */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end space-x-3">
          <Button variant="secondary" onClick={onClose} className="px-6 py-2">
            Cancel
          </Button>
          <Button
            variant="primary"
            onClick={() => onSave(name.trim(), description.trim())}
            className="px-8 py-2"
          >
            Save Changes
          </Button>
        </div>
      </div>
    </div>
  );
}
