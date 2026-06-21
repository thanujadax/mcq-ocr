import React from "react";
import { Button } from "../../../components/UI/Button";
import { PlusIcon } from "@heroicons/react/24/outline";

interface PageHeaderProps {
  onCreateNew: () => void;
}

export function PageHeader({ onCreateNew }: PageHeaderProps) {
  return (
    <div className="mb-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Marking Jobs
          </h1>
          <p className="text-gray-600">
            Manage and monitor your MCQ grading tasks
          </p>
        </div>
        <Button
          onClick={onCreateNew}
          className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 shadow-lg hover:shadow-xl transition-all duration-200"
        >
          <div className="flex items-center space-x-2">
            <PlusIcon className="h-4 w-4" />
            <span>New Marking Job</span>
          </div>
        </Button>
      </div>
    </div>
  );
}
