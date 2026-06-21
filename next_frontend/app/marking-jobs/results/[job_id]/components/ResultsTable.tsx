import React from "react";
import { EyeIcon, ExclamationTriangleIcon, CheckCircleIcon } from "@heroicons/react/24/outline";
import { Table, TableColumn } from "@/components/UI/Table";
import { Button } from "@/components/UI/Button";
import { StudentResult } from "@/app/marking-jobs/types/types";

interface ResultsTableProps {
  results: StudentResult[];
  hasIntermedieteResults: boolean;
  onViewMarkedPaper: (result: StudentResult) => void;
  onDownloadResults: () => void;
  onAuditResults: () => void;
}

export function ResultsTable({
  results,
  hasIntermedieteResults,
  onViewMarkedPaper,
  onDownloadResults,
  onAuditResults
}: ResultsTableProps) {
  const formatArrayAsString = (arr: number[]) => {
    return arr.length > 0 ? arr.join(", ") : "-";
  };

  const getFlagBadge = (flag: boolean, flagReason: string, isResolved: boolean) => {
    if (!flag) return null;

    if (isResolved) {
      return (
        <span
          className="inline-flex items-center px-3 py-1 rounded-xl text-xs font-medium bg-green-100 text-green-800 border border-green-200"
          title={`Resolved (was: ${flagReason})`}
        >
          <CheckCircleIcon className="h-3 w-3 mr-1" />
          Resolved
        </span>
      );
    }

    return (
      <span
        className="inline-flex items-center px-3 py-1 rounded-xl text-xs font-medium bg-red-100 text-red-800 border border-red-200"
        title={flagReason}
      >
        <ExclamationTriangleIcon className="h-3 w-3 mr-1" />
        Flagged
      </span>
    );
  };

  const columns: TableColumn<StudentResult>[] = [
    {
      header: "Index No",
      accessor: "index_number",
      sortable: true,
    },
    {
      header: "Correct",
      accessor: (result: StudentResult) => (
        <span className="text-green-600 font-medium">
          {result.correct.length}
        </span>
      ),
      sortable: false,
    },
    {
      header: "Incorrect",
      accessor: (result: StudentResult) => (
        <span className="text-red-600 font-medium">
          {result.incorrect.length}
        </span>
      ),
      sortable: false,
    },
    {
      header: "More than one marked",
      accessor: (result: StudentResult) => (
        <span className="text-orange-600 font-medium">
          {result.more_than_one_marked.length}
        </span>
      ),
      sortable: false,
    },
    {
      header: "Not marked",
      accessor: (result: StudentResult) => (
        <span className="text-yellow-600 font-medium">
          {result.not_marked.length}
        </span>
      ),
      sortable: false,
    },
    // {
    //   header: "Columnwise Total",
    //   accessor: (result: StudentResult) => (
    //     <span className="text-gray-700 font-medium">
    //       {formatArrayAsString(result.columnwise_total)}
    //     </span>
    //   ),
    //   sortable: false,
    // },
    {
      header: "Score",
      accessor: (result: StudentResult) => (
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-sm font-medium bg-blue-100 text-blue-800">
          {result.score}
        </span>
      ),
      sortable: true,
    },
    {
      header: "Flag",
      accessor: (result: StudentResult) => (
        <div className="flex flex-col space-y-1">
          {getFlagBadge(result.flag, result.flag_reason, result.is_resolved)}
          {result.flag && result.flag_reason && (
            <span
              className="text-xs text-gray-500 max-w-xs truncate"
              title={result.flag_reason}
            >
              {result.flag_reason}
            </span>
          )}
        </div>
      ),
      sortable: false,
    },
    {
      header: "Actions",
      accessor: (result: StudentResult) => (
        <Button
          variant="secondary"
          size="sm"
          icon={<EyeIcon className="h-4 w-4" />}
          onClick={() => onViewMarkedPaper(result)}
          title="View marked paper"
          className="inline-flex items-center"
        >
          View Paper
        </Button>
      ),
      sortable: false,
    },
  ];

  return (
    <div className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm">
      <div className="px-6 py-4 border-b border-gray-200 bg-gradient-to-r from-blue-50 to-blue-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <h3 className="text-lg font-semibold text-gray-900">
              Student Results
            </h3>
            <span className="inline-flex items-center px-3 py-1 rounded-xl text-xs font-medium bg-blue-100 text-blue-800 border border-blue-200">
              {results.length} students
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant="primary"
              size="sm"
              className="inline-flex items-center"
              onClick={onAuditResults}
            >
              Download Results
            </Button>
            {hasIntermedieteResults && (
              <Button
                variant="primary"
                size="sm"
                className="inline-flex items-center"
                onClick={onDownloadResults}
              >
                Download Audit
              </Button>
            )}
          </div>
        </div>
      </div>
      <Table
        columns={columns}
        data={results}
        keyField="row_number"
        pagination={true}
        itemsPerPage={10}
        searchable={true}
        searchPlaceholder="Search by index number..."
        emptyMessage="No results found"
      />
    </div>
  );
}
