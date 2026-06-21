"use client";

import { Input } from "@/components/UI/Input";
import { useState } from "react";
import { Button } from "@/components/UI/Button";
import axiosInstance from "@/utils/axiosclient";
import {
  DocumentTextIcon,
  CogIcon,
  ChevronRightIcon,
  ArrowDownTrayIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  SparklesIcon,
} from "@heroicons/react/24/outline";

type GenerationState = "idle" | "processing" | "success" | "error";

interface GenerateResponse {
  filename: string;
}

export default function GenerateTemplate() {
  const [title, setTitle] = useState("");
  const [numQuestions, setNumQuestions] = useState<number | "">("");
  const [numOptions, setNumOptions] = useState<number | "">("");
  const [maxQuestionsPerColumn, setMaxQuestionsPerColumn] =
    useState<number>(30);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [generationState, setGenerationState] =
    useState<GenerationState>("idle");
  const [errorMessage, setErrorMessage] = useState("");
  const [filename, setFileName] = useState("");

  const handleGenerate = async () => {
    // Basic validation
    if (!title.trim()) {
      setErrorMessage("Title is required");
      setGenerationState("error");
      return;
    }

    if (!numQuestions || numQuestions <= 0) {
      setErrorMessage("Number of questions must be greater than 0");
      setGenerationState("error");
      return;
    }

    if (!numOptions || numOptions <= 1) {
      setErrorMessage("Number of options must be greater than 1");
      setGenerationState("error");
      return;
    }

    setGenerationState("processing");
    setErrorMessage("");
    setFileName("");

    try {
      console.log("Generating template with:", {
        title,
        numQuestions,
        numOptions,
        maxQuestionsPerColumn,
      });

      const requestBody = new URLSearchParams();
      requestBody.append("title", title);
      requestBody.append("questions", numQuestions.toString());
      requestBody.append("options", numOptions.toString());
      requestBody.append("max_qpc", maxQuestionsPerColumn.toString());

      const response = await axiosInstance.post(
        "/api/custom_template/generate",
        requestBody,
        {
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
        }
      );

      setFileName((response.data as GenerateResponse).filename);
      setGenerationState("success");
    } catch (error: unknown) {
      let errorMessage = "An unexpected error occurred";
      if (error instanceof Error) {
        errorMessage = error.message;
      } else if (
        typeof error === "object" &&
        error !== null &&
        "response" in error
      ) {
        const axiosError = error as {
          response?: { data?: { message?: string } };
        };
        errorMessage = axiosError.response?.data?.message || errorMessage;
      }
      setErrorMessage(errorMessage);
      setGenerationState("error");
    }
  };

  const handleDownload = () => {
    if (!filename) return;
    const downloadUrl = `${axiosInstance.defaults.baseURL}/api/custom_template/file?file_name=${encodeURIComponent(
      filename
    )}&download=true`;
    window.open(downloadUrl, "_blank");
  };

  const resetGeneration = () => {
    setGenerationState("idle");
    setErrorMessage("");
    setFileName("");
  };

  return (
    <div className="space-y-6 p-6">
      {/* Header Section */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 mb-2">
          Generate Template
        </h1>
        <p className="text-gray-600">
          Create custom MCQ templates with your specifications
        </p>
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column - Form */}
        <div className="space-y-6">
          {/* Info Card */}
          <div className="bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 p-6 rounded-2xl">
            <div className="flex items-start space-x-4">
              <div className="bg-blue-500 p-3 rounded-xl">
                <SparklesIcon className="h-6 w-6 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-blue-900 mb-2">
                  Create Custom Templates
                </h3>
                <p className="text-blue-700 text-sm">
                  Generate MCQ templates tailored to your needs. Configure the
                  number of questions, options, and layout to create the perfect
                  answer sheet for your assessments.
                </p>
              </div>
            </div>
          </div>

          {/* Basic Configuration */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Basic Configuration
            </h3>
            <div className="space-y-4">
              <div>
                <label
                  htmlFor="title"
                  className="block text-sm font-medium text-gray-700 mb-1"
                >
                  Template Title
                </label>
                <Input
                  id="title"
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full"
                  placeholder="Enter template title (e.g., Mathematics Quiz)"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label
                    htmlFor="numQuestions"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Number of Questions
                  </label>
                  <Input
                    id="numQuestions"
                    type="number"
                    min="1"
                    max="200"
                    value={numQuestions}
                    onChange={(e) =>
                      setNumQuestions(
                        e.target.value === "" ? "" : Number(e.target.value)
                      )
                    }
                    className="w-full"
                    placeholder="e.g., 50"
                  />
                </div>

                <div>
                  <label
                    htmlFor="numOptions"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Options per Question
                  </label>
                  <Input
                    id="numOptions"
                    type="number"
                    min="2"
                    max="10"
                    value={numOptions}
                    onChange={(e) =>
                      setNumOptions(
                        e.target.value === "" ? "" : Number(e.target.value)
                      )
                    }
                    className="w-full"
                    placeholder="e.g., 4"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Advanced Options */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex items-center justify-between w-full text-left"
            >
              <h3 className="text-lg font-semibold text-gray-900">
                Advanced Options
              </h3>
              <div className="flex items-center space-x-2">
                <CogIcon className="h-5 w-5 text-gray-400" />
                <ChevronRightIcon
                  className={`h-4 w-4 text-gray-400 transition-transform duration-200 ${
                    showAdvanced ? "rotate-90" : ""
                  }`}
                />
              </div>
            </button>

            {showAdvanced && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <div>
                  <label
                    htmlFor="maxQuestionsPerColumn"
                    className="block text-sm font-medium text-gray-700 mb-1"
                  >
                    Max Questions per Column
                  </label>
                  <Input
                    id="maxQuestionsPerColumn"
                    type="number"
                    min="1"
                    max="50"
                    value={maxQuestionsPerColumn}
                    onChange={(e) =>
                      setMaxQuestionsPerColumn(Number(e.target.value))
                    }
                    className="w-full"
                    placeholder="e.g., 30"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Controls the layout density. Lower values create more
                    columns for better readability.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="bg-white rounded-2xl border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Generate Template
            </h3>
            <div className="flex flex-wrap gap-3">
              <Button
                onClick={handleGenerate}
                className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 shadow-lg hover:shadow-xl transition-all duration-200"
                disabled={generationState === "processing"}
              >
                <div className="flex items-center space-x-2">
                  {generationState === "processing" ? (
                    <ArrowPathIcon className="h-4 w-4 animate-spin" />
                  ) : (
                    <SparklesIcon className="h-4 w-4" />
                  )}
                  <span>
                    {generationState === "processing"
                      ? "Generating..."
                      : "Generate Template"}
                  </span>
                </div>
              </Button>

              {filename && (
                <>
                  <Button
                    onClick={handleDownload}
                    className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700"
                  >
                    <div className="flex items-center space-x-2">
                      <ArrowDownTrayIcon className="h-4 w-4" />
                      <span>Download PDF</span>
                    </div>
                  </Button>
                  <Button onClick={resetGeneration} variant="outline">
                    <div className="flex items-center space-x-2">
                      <ArrowPathIcon className="h-4 w-4" />
                      <span>Generate Another</span>
                    </div>
                  </Button>
                </>
              )}

              {generationState === "error" && (
                <Button onClick={resetGeneration} variant="outline">
                  <div className="flex items-center space-x-2">
                    <ArrowPathIcon className="h-4 w-4" />
                    <span>Try Again</span>
                  </div>
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Right Column - Preview */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Template Preview
          </h3>

          {generationState === "idle" && (
            <div className="flex flex-col items-center justify-center h-96 text-center">
              <div className="bg-gray-50 p-8 rounded-2xl mb-4">
                <DocumentTextIcon className="h-16 w-16 text-gray-300 mx-auto" />
              </div>
              <h4 className="text-lg font-medium text-gray-900 mb-2">
                Template Preview
              </h4>
              <p className="text-gray-500 max-w-sm">
                Generate your template to see the preview here.
              </p>
            </div>
          )}

          {generationState === "processing" && (
            <div className="flex items-center justify-center h-96">
              <div className="text-center">
                <ArrowPathIcon className="h-12 w-12 text-blue-500 animate-spin mx-auto mb-4" />
                <h4 className="text-lg font-medium text-gray-900 mb-2">
                  Generating Template
                </h4>
                <p className="text-gray-500">
                  Please wait while we create your template...
                </p>
              </div>
            </div>
          )}

          {generationState === "success" && filename && (
            <div className="space-y-4">
              {/* Success Header */}
              <div className="flex items-center justify-center bg-green-50 p-3 rounded-xl">
                <CheckCircleIcon className="h-6 w-6 text-green-500 mr-2" />
                <span className="text-green-700 font-medium">
                  Template Generated Successfully!
                </span>
              </div>

              {/* PDF Preview */}
              <div className="border-2 border-green-200 rounded-xl overflow-hidden">
                <div className="bg-gray-50 p-3 border-b border-green-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-semibold text-gray-900">{title}</h4>
                      <p className="text-sm text-gray-600">{filename}</p>
                    </div>
                    <div className="text-sm text-gray-600">
                      {numQuestions} questions • {numOptions} options
                    </div>
                  </div>
                </div>

                {/* Simple PDF Viewer */}
                <div className="relative bg-gray-100 rounded-lg overflow-hidden">
                  <object
                    data={`${axiosInstance.defaults.baseURL}/api/custom_template/file?file_name=${encodeURIComponent(
                      filename
                    )}#toolbar=0&navpanes=0&scrollbar=0`}
                    type="application/pdf"
                    className="w-full h-96 md:h-[500px]"
                    title="Template Preview"
                  >
                    <div className="flex flex-col items-center justify-center h-96 text-center p-8">
                      <DocumentTextIcon className="h-16 w-16 text-gray-400 mb-4" />
                      <h4 className="text-lg font-medium text-gray-900 mb-2">
                        PDF Preview Not Available
                      </h4>
                      <p className="text-gray-500 mb-4">
                        Your browser doesn&apos;t support PDF preview. Please
                        download the file to view it.
                      </p>
                      <Button
                        onClick={handleDownload}
                        className="bg-blue-500 hover:bg-blue-600"
                      >
                        <div className="flex items-center space-x-2">
                          <ArrowDownTrayIcon className="h-4 w-4" />
                          <span>Download PDF</span>
                        </div>
                      </Button>
                    </div>
                  </object>
                </div>

                <div className="bg-gray-50 p-3 border-t border-green-200 text-center">
                  <p className="text-sm text-gray-600">
                    Template preview • Ready for download
                  </p>
                </div>
              </div>
            </div>
          )}

          {generationState === "error" && (
            <div className="flex items-center justify-center h-96">
              <div className="text-center">
                <div className="bg-red-50 p-8 rounded-2xl mb-4">
                  <ExclamationTriangleIcon className="h-16 w-16 text-red-500 mx-auto" />
                </div>
                <h4 className="text-lg font-medium text-gray-900 mb-2">
                  Generation Failed
                </h4>
                <p className="text-gray-500">
                  {errorMessage || "Something went wrong. Please try again."}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
