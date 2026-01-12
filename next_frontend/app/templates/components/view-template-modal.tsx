import React from 'react'
import { Button } from '@/components/UI/Button';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faDownload } from '@fortawesome/free-solid-svg-icons';
import { Template } from '@/models/template';

interface ViewTemplateModalProps {
  isViewModalOpen: boolean;
  setIsViewModalOpen: (isOpen: boolean) => void;
  viewingTemplate: Template;
}

const ViewTemplateModal = ({ isViewModalOpen, setIsViewModalOpen, viewingTemplate }: ViewTemplateModalProps) => {
  return (
    <div
      className={`fixed inset-0 z-50 overflow-y-auto ${
        isViewModalOpen ? "block" : "hidden"
      }`}
    >
      <div className="flex items-center justify-center min-h-screen p-4">
        <div
          className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
          onClick={() => setIsViewModalOpen(false)}
        ></div>
        <div className="bg-white rounded-lg overflow-hidden shadow-xl transform transition-all w-full max-w-2xl">
          <div className="px-4 py-3 border-b border-gray-200 flex items-center justify-between">
            <h3 className="text-lg font-medium text-gray-900">
              {viewingTemplate.name}
            </h3>
            <button
              type="button"
              className="text-gray-400 hover:text-gray-500 focus:outline-none"
              onClick={() => setIsViewModalOpen(false)}
            >
              <span className="sr-only">Close</span>
              <svg
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </div>
          <div className="p-6">
            <div className="grid grid-cols-1 gap-y-6 sm:grid-cols-2 gap-x-4">
              <div>
                <h4 className="text-sm font-medium text-gray-500">
                  Template Type
                </h4>
                <p className="mt-1 text-sm text-gray-900">
                  {viewingTemplate.type}
                </p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-500">Created</h4>
                <p className="mt-1 text-sm text-gray-900">
                  {viewingTemplate.created}
                </p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-500">Last Used</h4>
                <p className="mt-1 text-sm text-gray-900">
                  {viewingTemplate.lastUsed}
                </p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-gray-500">Status</h4>
                <p className="mt-1 text-sm text-gray-900">
                  {viewingTemplate.status}
                </p>
              </div>
              {viewingTemplate.questionCount && (
                <div>
                  <h4 className="text-sm font-medium text-gray-500">
                    Question Count
                  </h4>
                  <p className="mt-1 text-sm text-gray-900">
                    {viewingTemplate.questionCount}
                  </p>
                </div>
              )}
              {viewingTemplate.description && (
                <div className="sm:col-span-2">
                  <h4 className="text-sm font-medium text-gray-500">
                    Description
                  </h4>
                  <p className="mt-1 text-sm text-gray-900">
                    {viewingTemplate.description}
                  </p>
                </div>
              )}
            </div>
            {viewingTemplate.type === "MCQ" && (
              <div className="mt-6">
                <h4 className="text-sm font-medium text-gray-900 mb-3">
                  Question Preview
                </h4>
                <div className="border border-gray-200 rounded-md p-4 bg-gray-50">
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm font-medium text-gray-700">
                        Question 1: What is the capital of France?
                      </p>
                      <div className="mt-2 ml-4 space-y-2">
                        <p className="text-sm text-gray-600">A. London</p>
                        <p className="text-sm text-gray-600">B. Berlin</p>
                        <p className="text-sm text-gray-600">
                          C. Paris{" "}
                          <span className="text-green-600">(Correct)</span>
                        </p>
                        <p className="text-sm text-gray-600">D. Madrid</p>
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-700">
                        Question 2: What is 2 + 2?
                      </p>
                      <div className="mt-2 ml-4 space-y-2">
                        <p className="text-sm text-gray-600">A. 3</p>
                        <p className="text-sm text-gray-600">
                          B. 4 <span className="text-green-600">(Correct)</span>
                        </p>
                        <p className="text-sm text-gray-600">C. 5</p>
                        <p className="text-sm text-gray-600">D. 6</p>
                      </div>
                    </div>
                    <p className="text-sm text-gray-500 italic text-center">
                      ... more questions ...
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
          <div className="px-4 py-3 bg-gray-50 sm:px-6 flex justify-end">
            <Button
              variant="outline"
              onClick={() => setIsViewModalOpen(false)}
              className="mr-2"
            >
              Close
            </Button>
            <Button
              variant="primary"
              icon={<FontAwesomeIcon icon={faDownload} className="h-4 w-4" />}
            >
              Download Template
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ViewTemplateModal
