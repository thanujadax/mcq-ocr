"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeftIcon,
  DocumentChartBarIcon,
  ExclamationTriangleIcon,
  ArrowPathIcon,
} from "@heroicons/react/24/outline";
import { Button } from "../../../../components/UI/Button";
import { useToast } from "../../../../hooks/useToast";
import axiosInstance from "@/utils/axiosclient";
import {
  JobInfo,
  ResultsData,
  StudentResult,
} from "@/app/marking-jobs/types/types";
import {
  _convertBlobToStudentResults,
  getMarkingSchemeBubbleData,
} from "../../../utils/results";
import AnswerSheetModal from "./components/AnswerSheetModal";
import { JobInfoSection } from "./components/JobInfoSection";
import { ResultsTable } from "./components/ResultsTable";

const ResultsPage = () => {
  const router = useRouter();
  const { showToast } = useToast();
  const { job_id } = useParams<{ job_id: string }>();
  const [loading, setLoading] = useState(true);
  const [resultsData, setResultsData] = useState<ResultsData | null>(null);
  const [selectedResult, setSelectedResult] = useState<StudentResult | null>(
    null
  );
  const [isAnswerSheetModalOpen, setIsAnswerSheetModalOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchResults = async () => {
      if (!job_id) return;

      try {
        setLoading(true);
        setError(null);

        // Fetch job info
        const jobResponse = await axiosInstance.get(
          `/api/markings/${job_id}/results`
        );
        const jobInfo: JobInfo = jobResponse.data as JobInfo;

        const backendUrl =
          process.env.NEXT_PUBLIC_BACKEND_URL ||
          "https://edumark.vihangamunasinghe.com";
        const resultsResponse = await fetch(
          `${backendUrl}/api/files/download?method=file_id&file_id=${jobInfo.result_sheet_file_id}`,
          {
            credentials: "include",
          }
        );
        if (!resultsResponse.ok) {
          throw new Error("Failed to fetch results");
        }
        const resultsBlob = await resultsResponse.blob();

        const results = await _convertBlobToStudentResults(resultsBlob);

        const markingScheme = await getMarkingSchemeBubbleData(
          jobInfo.marking_config_id
        );

        const resultsData: ResultsData = {
          job_info: jobInfo,
          marking_scheme: markingScheme,
          results: results,
          total_answer_sheets: results.length,
          processed_answer_sheets: results.length,
          failed_answer_sheets: 0,
        };

        setResultsData(resultsData);
      } catch (err) {
        console.error("Error fetching results:", err);
        setError(
          err instanceof Error ? err.message : "Failed to fetch results"
        );
        showToast("Failed to load results", "error");
      } finally {
        setLoading(false);
      }
    };

    fetchResults();
  }, [job_id, showToast]);

  const handleViewMarkedPaper = (result: StudentResult) => {
    setSelectedResult(result);
    setIsAnswerSheetModalOpen(true);
  };

  const handelOnDownloadResultsClicked = async () => {
    try {
      const response = await axiosInstance.get(
        `/api/markings/${resultsData?.job_info.id}/download-results`,
        {
          responseType: "blob",
          withCredentials: true,
          headers: {
            Accept:
              "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          },
        }
      );

      // Create blob URL for download
      const blob = new Blob([response.data as ArrayBuffer], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = window.URL.createObjectURL(blob);

      // Create a temporary link and trigger download
      const a = document.createElement("a");
      a.href = url;
      const fileName = resultsData?.job_info.name
        ? `${resultsData.job_info.name}_results.xlsx`
        : `results.xlsx`;
      a.download = `${fileName}`;
      document.body.appendChild(a);
      a.click();

      // Cleanup
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error downloading file:", error);
    }
  };

  const handelOnDownloadAuditClicked = async () => {
    try {
      const response = await axiosInstance.get(
        `/api/markings/${resultsData?.job_info.id}/download-audit`,
        {
          responseType: "blob",
          withCredentials: true,
          headers: {
            Accept: "application/zip",
          },
        }
      );

      // Create blob URL for download
      const blob = new Blob([response.data as ArrayBuffer], {
        type: "application/zip",
      });
      const url = window.URL.createObjectURL(blob);

      // Create a temporary link and trigger download
      const a = document.createElement("a");
      a.href = url;
      const fileName = resultsData?.job_info.name
        ? `${resultsData.job_info.name}_audit.zip`
        : `audit.zip`;
      a.download = `${fileName}`;
      document.body.appendChild(a);
      a.click();

      // Cleanup
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Error downloading file:", error);
    }
  };

  const handelUpdateResult = async (newResult: StudentResult) => {
    try {
      await axiosInstance.put(
        `/api/markings/${job_id}/update-result/${newResult.row_number}`,
        { result: newResult }
      );
      const index = resultsData?.results.findIndex(
        (result: StudentResult) => result.row_number === newResult.row_number
      );
      if (index !== undefined && index !== -1) {
        setResultsData({
          ...resultsData!,
          results: [
            ...resultsData!.results.slice(0, index),
            newResult,
            ...resultsData!.results.slice(index + 1),
          ],
        });
        setSelectedResult(newResult);
      }
    } catch (err) {
      console.error("Error updating result:", err);
      showToast("Failed to update result", "error");
    }
  };

  const handleGoBack = () => {
    router.push("/marking-jobs");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center bg-white rounded-2xl shadow-xl p-8 border border-gray-200">
          <div className="bg-blue-500 p-4 rounded-2xl w-16 h-16 mx-auto mb-4">
            <ArrowPathIcon className="h-8 w-8 animate-spin text-white" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Loading Results
          </h3>
          <p className="text-gray-600">
            Please wait while we fetch the marking results...
          </p>
        </div>
      </div>
    );
  }

  if (error || !resultsData) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-red-50 to-pink-100">
        <div className="text-center bg-white rounded-2xl shadow-xl p-8 border border-red-200 max-w-md">
          <div className="bg-red-500 p-4 rounded-2xl w-16 h-16 mx-auto mb-4">
            <ExclamationTriangleIcon className="h-8 w-8 text-white" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Error Loading Results
          </h3>
          <p className="text-gray-600 mb-6">{error || "No data available"}</p>
          <Button onClick={handleGoBack} className="inline-flex items-center">
            <ArrowLeftIcon className="h-4 w-4 mr-2" />
            Go Back to Marking Jobs
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 rounded-2xl p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <Button
              variant="secondary"
              icon={<ArrowLeftIcon className="h-4 w-4" />}
              onClick={handleGoBack}
              className="inline-flex items-center"
            >
              Back to Jobs
            </Button>
            <div className="flex items-center space-x-3">
              <div className="bg-blue-500 p-2 rounded-xl">
                <DocumentChartBarIcon className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Marking Results
                </h1>
                <p className="text-sm text-gray-600">
                  {resultsData.job_info.name}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Job Information Section */}
      <JobInfoSection jobInfo={resultsData.job_info} />

      {/* Results Table */}
      <ResultsTable
        results={resultsData.results}
        hasIntermedieteResults={resultsData.job_info.save_intermediate_results}
        onViewMarkedPaper={handleViewMarkedPaper}
        onDownloadResults={handelOnDownloadAuditClicked}
        onAuditResults={handelOnDownloadResultsClicked}
      />
      {selectedResult && (
        <AnswerSheetModal
          isOpen={isAnswerSheetModalOpen}
          onClose={() => {
            setIsAnswerSheetModalOpen(false);
            setSelectedResult(null);
          }}
          result={selectedResult}
          updateResult={handelUpdateResult}
          markingScheme={resultsData.marking_scheme}
        />
      )}
    </div>
  );
};

export default ResultsPage;
