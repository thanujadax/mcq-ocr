import React from "react";
import { Select } from "../../../components/UI/Select";
import { FunnelIcon, MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import { StatusFilterOption } from "../types/types";

interface FiltersSectionProps {
  totalJobs: number;
  statusFilter: string;
  searchQuery: string;
  onStatusFilterChange: (status: string) => void;
  onSearchChange: (query: string) => void;
}

const statusFilterOptions: StatusFilterOption[] = [
  { value: "all", label: "All Statuses" },
  { value: "initialized", label: "Initialized" },
  { value: "marking_scheme_configured", label: "Scheme Configured" },
  { value: "marking_scheme_verified", label: "Scheme Verified" },
  { value: "answer_sheets_attached", label: "Sheets Attached" },
  { value: "queued", label: "Queued" },
  { value: "processing", label: "Processing" },
  { value: "completed", label: "Completed" },
  { value: "failed", label: "Failed" },
  { value: "cancelled", label: "Cancelled" },
];

export function FiltersSection({
  totalJobs,
  statusFilter,
  searchQuery,
  onStatusFilterChange,
  onSearchChange,
}: FiltersSectionProps) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
        {/* Search Bar */}
        <div className="flex-1 max-w-md">
          <div className="relative">
            <input
              type="text"
              placeholder="Search marking jobs..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full px-4 py-3 pl-11 text-sm border border-gray-200 rounded-xl bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
            />
            <div className="absolute inset-y-0 left-0 flex items-center pl-3">
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <span className="font-medium">{totalJobs} Jobs Total</span>
          </div>

          <div className="flex items-center space-x-2">
            <FunnelIcon className="h-5 w-5 text-gray-400" />
            <Select
              value={statusFilter}
              onChange={(e) => onStatusFilterChange(e.target.value)}
              options={statusFilterOptions}
              className="w-48"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
