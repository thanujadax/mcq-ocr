import React from "react";
import { Button } from "../../../components/UI/Button";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlus } from "@fortawesome/free-solid-svg-icons";

interface PageHeaderProps {
  onCreateNew: () => void;
}

export function PageHeader({ onCreateNew }: PageHeaderProps) {
  return (
    <div className="flex justify-between items-center">
      <h2 className="text-xl font-semibold text-gray-900">Marking Jobs</h2>
      <Button
        variant="primary"
        icon={<FontAwesomeIcon icon={faPlus} className="h-4 w-4" />}
        onClick={onCreateNew}
      >
        New Marking Job
      </Button>
    </div>
  );
}
