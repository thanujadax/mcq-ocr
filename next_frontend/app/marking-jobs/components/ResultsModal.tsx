import React from "react";
import { Modal } from "../../../components/UI/Modal";
import { Button } from "../../../components/UI/Button";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faFileText, faFile } from "@fortawesome/free-solid-svg-icons";
import { MarkingJob } from "./types";

interface ResultsModalProps {
  isOpen: boolean;
  onClose: () => void;
  job: MarkingJob | null;
  onDownloadResults: (format: "csv" | "pdf") => void;
}

export function ResultsModal({
  isOpen,
  onClose,
  job,
  onDownloadResults,
}: ResultsModalProps) {
  const completionPercentage =
    job && job.submissions > 0
      ? Math.round((job.marked / job.submissions) * 100)
      : 0;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={`Results: ${job?.name}`}
      size="lg"
    >
      <div className="space-y-6">
        <div className="bg-gray-50 border border-gray-200 rounded-md p-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <h4 className="text-xs font-medium text-gray-500">
                Total Submissions
              </h4>
              <p className="mt-1 text-lg font-medium text-gray-900">
                {job?.submissions}
              </p>
            </div>
            <div>
              <h4 className="text-xs font-medium text-gray-500">Marked</h4>
              <p className="mt-1 text-lg font-medium text-gray-900">
                {job?.marked}
              </p>
            </div>
            <div>
              <h4 className="text-xs font-medium text-gray-500">Completion</h4>
              <p className="mt-1 text-lg font-medium text-green-600">
                {completionPercentage}%
              </p>
            </div>
          </div>
        </div>
        <div>
          <h3 className="text-sm font-medium text-gray-700 mb-3">Summary</h3>
          <div className="bg-white border border-gray-200 rounded-md overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Metric
                  </th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Value
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                <tr>
                  <td className="px-4 py-2 text-sm text-gray-900">
                    Average Score
                  </td>
                  <td className="px-4 py-2 text-sm text-gray-900">78.5%</td>
                </tr>
                <tr>
                  <td className="px-4 py-2 text-sm text-gray-900">
                    Highest Score
                  </td>
                  <td className="px-4 py-2 text-sm text-gray-900">98%</td>
                </tr>
                <tr>
                  <td className="px-4 py-2 text-sm text-gray-900">
                    Lowest Score
                  </td>
                  <td className="px-4 py-2 text-sm text-gray-900">45%</td>
                </tr>
                <tr>
                  <td className="px-4 py-2 text-sm text-gray-900">
                    Median Score
                  </td>
                  <td className="px-4 py-2 text-sm text-gray-900">82%</td>
                </tr>
                <tr>
                  <td className="px-4 py-2 text-sm text-gray-900">Pass Rate</td>
                  <td className="px-4 py-2 text-sm text-gray-900">87.5%</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
      <div className="mt-6 flex justify-end space-x-3">
        <Button
          variant="outline"
          onClick={() => onDownloadResults("csv")}
          icon={<FontAwesomeIcon icon={faFileText} className="h-4 w-4" />}
        >
          Download CSV
        </Button>
        <Button
          variant="outline"
          onClick={() => onDownloadResults("pdf")}
          icon={<FontAwesomeIcon icon={faFile} className="h-4 w-4" />}
        >
          Download PDF
        </Button>
        <Button variant="primary" onClick={onClose}>
          Close
        </Button>
      </div>
    </Modal>
  );
}
