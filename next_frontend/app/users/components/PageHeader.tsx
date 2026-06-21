import React from "react";
import { Button } from "../../../components/UI/Button";
import { UserPlusIcon } from "@heroicons/react/24/outline";

interface PageHeaderProps {
  onCreateNew?: () => void;
}

export function PageHeader({ onCreateNew }: PageHeaderProps) {
  return (
    <div className="mb-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">User Management</h1>
          <p className="text-gray-600 mt-1">
            Manage users, roles, and verification status
          </p>
        </div>
        {onCreateNew && (
          <Button
            variant="primary"
            onClick={onCreateNew}
            className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 shadow-lg hover:shadow-xl transition-all duration-300"
          >
            <div className="flex items-center gap-2">
              <UserPlusIcon className="h-5 w-5" />
              Add New User
            </div>
          </Button>
        )}
      </div>
    </div>
  );
}
