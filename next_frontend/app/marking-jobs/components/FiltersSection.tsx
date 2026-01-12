import React from "react";
import { Select } from "../../../components/UI/Select";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faClipboardCheck } from "@fortawesome/free-solid-svg-icons";
import { StatusFilterOption } from "./types";

interface FiltersSectionProps {
  totalJobs: number;
  statusFilter: string;
  onStatusFilterChange: (status: string) => void;
}

const statusFilterOptions: StatusFilterOption[] = [
  { value: "all", label: "All Statuses" },
  { value: "pending", label: "Pending" },
  { value: "processing", label: "Processing" },
  { value: "in-progress", label: "In Progress" },
  { value: "review-required", label: "Review Required" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
];

export function FiltersSection({
  totalJobs,
  statusFilter,
  onStatusFilterChange,
}: FiltersSectionProps) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0 sm:space-x-4">
      <div className="flex items-center space-x-2">
        <FontAwesomeIcon
          icon={faClipboardCheck}
          className="h-5 w-5 text-gray-400"
        />
        <span className="text-gray-700 font-medium">
          Total Jobs: {totalJobs}
        </span>
      </div>
      <div className="w-full sm:w-64">
        <Select
          value={statusFilter}
          onChange={(e) => onStatusFilterChange(e.target.value)}
          options={statusFilterOptions}
        />
      </div>
    </div>
  );
}
