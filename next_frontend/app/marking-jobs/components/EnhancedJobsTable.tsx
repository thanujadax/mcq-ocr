import React from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faEye,
  faEdit,
  faTrash,
  faPause,
  faEllipsisH,
} from "@fortawesome/free-solid-svg-icons";
import { MarkingJobBasic } from "../types/types";
import { StatusBadge } from "./StatusBadge";
import { ProgressBar } from "./ProgressBar";
import { Pagination } from "./Pagination";

interface EnhancedJobsTableProps {
  jobs: MarkingJobBasic[];
  currentPage: number;
  totalPages: number;
  itemsPerPage: number;
  totalItems: number;
  onPageChange: (page: number) => void;
  onItemsPerPageChange: (itemsPerPage: number) => void;
  onStopJob: (jobId: number) => void;
  onEditJob: (job: MarkingJobBasic) => void;
  onViewResults: (job: MarkingJobBasic) => void;
  onDeleteJob: (jobId: number) => void;
}

export const JobsTable: React.FC<EnhancedJobsTableProps> = ({
  jobs,
  currentPage,
  totalPages,
  itemsPerPage,
  totalItems,
  onPageChange,
  onItemsPerPageChange,
  onStopJob,
  onEditJob,
  onViewResults,
  onDeleteJob,
}) => {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
      {/* Header */}
      <div className="px-6 py-4 border-b border-slate-200">
        <h3 className="text-lg font-semibold text-slate-900">Marking Jobs</h3>
        <p className="text-sm text-slate-600 mt-1">
          Manage and monitor your marking jobs
        </p>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-slate-50">
            <tr>
              <th className="text-left py-3 px-6 text-xs font-medium text-slate-500 uppercase tracking-wider">
                Job Name
              </th>
              <th className="text-left py-3 px-6 text-xs font-medium text-slate-500 uppercase tracking-wider">
                Template
              </th>
              <th className="text-left py-3 px-6 text-xs font-medium text-slate-500 uppercase tracking-wider">
                Status
              </th>
              <th className="text-left py-3 px-6 text-xs font-medium text-slate-500 uppercase tracking-wider">
                Progress
              </th>
              <th className="text-left py-3 px-6 text-xs font-medium text-slate-500 uppercase tracking-wider">
                Created
              </th>
              <th className="text-center py-3 px-6 text-xs font-medium text-slate-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {jobs.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-12">
                  <div className="text-slate-400">
                    <FontAwesomeIcon
                      icon={faEllipsisH}
                      className="text-2xl mb-2"
                    />
                    <p>No marking jobs found</p>
                  </div>
                </td>
              </tr>
            ) : (
              jobs.map((job) => (
                <tr
                  key={job.id}
                  className="hover:bg-slate-50 transition-colors"
                >
                  <td className="py-4 px-6">
                    <div>
                      <p className="text-sm font-medium text-slate-900">
                        {job.name}
                      </p>
                      <p className="text-xs text-slate-500">ID: {job.id}</p>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <span className="text-sm text-slate-700">
                      {job.template_name}
                    </span>
                  </td>
                  <td className="py-4 px-6">
                    <StatusBadge status={job.status} />
                  </td>
                  <td className="py-4 px-6">
                    <ProgressBar job={job} />
                  </td>
                  <td className="py-4 px-6">
                    <span className="text-sm text-slate-600">
                      {formatDate(job.created_at)}
                    </span>
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex items-center justify-center space-x-2">
                      <button
                        onClick={() => onViewResults(job)}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="View Results"
                      >
                        <FontAwesomeIcon icon={faEye} className="text-sm" />
                      </button>
                      <button
                        onClick={() => onEditJob(job)}
                        className="p-2 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                        title="Edit Job"
                      >
                        <FontAwesomeIcon icon={faEdit} className="text-sm" />
                      </button>
                      {job.status === "processing" && (
                        <button
                          onClick={() => onStopJob(job.id)}
                          className="p-2 text-orange-600 hover:bg-orange-50 rounded-lg transition-colors"
                          title="Stop Job"
                        >
                          <FontAwesomeIcon icon={faPause} className="text-sm" />
                        </button>
                      )}
                      <button
                        onClick={() => onDeleteJob(job.id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="Delete Job"
                      >
                        <FontAwesomeIcon icon={faTrash} className="text-sm" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="px-6 py-4 border-t border-slate-200">
        <Pagination
          currentPage={currentPage}
          totalPages={totalPages}
          itemsPerPage={itemsPerPage}
          totalItems={totalItems}
          onPageChange={onPageChange}
          onItemsPerPageChange={onItemsPerPageChange}
        />
      </div>
    </div>
  );
};
