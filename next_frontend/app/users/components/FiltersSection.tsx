import React from "react";
import { Select } from "../../../components/UI/Select";
import { FunnelIcon, MagnifyingGlassIcon } from "@heroicons/react/24/outline";
import { FilterOption } from "../types/types";

interface FiltersSectionProps {
  totalUsers: number;
  verificationFilter: string;
  roleFilter: string;
  searchQuery: string;
  onVerificationFilterChange: (status: string) => void;
  onRoleFilterChange: (role: string) => void;
  onSearchChange: (query: string) => void;
}

const verificationFilterOptions: FilterOption[] = [
  { value: "all", label: "All Verification Status" },
  { value: "admin_verified", label: "Admin Verified" },
  { value: "email_verified", label: "Email Verified" },
  { value: "none", label: "Unverified" },
];

const roleFilterOptions: FilterOption[] = [
  { value: "all", label: "All Roles" },
  { value: "Super User", label: "Super Admin" },
  { value: "Faculty Admin", label: "Faculty Admin" },
  { value: "Basic User", label: "Basic User" },
];

export function FiltersSection({
  totalUsers,
  verificationFilter,
  roleFilter,
  searchQuery,
  onVerificationFilterChange,
  onRoleFilterChange,
  onSearchChange,
}: FiltersSectionProps) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-6 mb-6">
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
        {/* Search Bar */}
        <div className="flex-1 max-w-md">
          <div className="relative">
            <input
              type="text"
              placeholder="Search users by name or email..."
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
        <div className="flex flex-col sm:flex-row items-start sm:items-center space-y-4 sm:space-y-0 sm:space-x-4">
          <div className="flex items-center space-x-2 text-sm text-gray-600">
            <span className="font-medium">{totalUsers} Users Total</span>
          </div>

          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <FunnelIcon className="h-5 w-5 text-gray-400" />
              <Select
                value={verificationFilter}
                onChange={(e) => onVerificationFilterChange(e.target.value)}
                options={verificationFilterOptions}
                className="w-48"
              />
            </div>

            <div className="flex items-center space-x-2">
              <Select
                value={roleFilter}
                onChange={(e) => onRoleFilterChange(e.target.value)}
                options={roleFilterOptions}
                className="w-40"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
