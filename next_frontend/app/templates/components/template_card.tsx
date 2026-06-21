import React from "react";
import {
  DocumentTextIcon,
  TrashIcon,
  PencilIcon,
  CalendarIcon,
  Squares2X2Icon,
  ShareIcon,
  EyeIcon,
} from "@heroicons/react/24/outline";
import { Template, ConfigType } from "@/models/template";
import { Button } from "@/components/UI/Button";

interface TemplateCardProps {
  template: Template;
  viewTemplate: (template: Template) => void;
  confirmDelete: (id: number) => void;
  editTemplate: (id: number) => void;
}

const getConfigIcon = (configType: ConfigType) => {
  switch (configType) {
    case "grid_based":
      return <Squares2X2Icon className="h-7 w-7 text-blue-600" />;
    case "cluster_based":
      return <ShareIcon className="h-7 w-7 text-purple-600" />;
    default:
      return <DocumentTextIcon className="h-7 w-7 text-gray-600" />;
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case "ready":
    case "completed":
      return "bg-emerald-100 text-emerald-800 border border-emerald-200";
    case "processing":
      return "bg-blue-100 text-blue-800 border border-blue-200";
    case "queued":
      return "bg-amber-100 text-amber-800 border border-amber-200";
    case "failed":
      return "bg-rose-100 text-rose-800 border border-rose-200";
    default:
      return "bg-slate-100 text-slate-800 border border-slate-200";
  }
};

const formatDate = (isoString: string) => {
  return new Date(isoString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
};

const TemplateCard = ({
  template,
  viewTemplate,
  editTemplate,
  confirmDelete,
}: TemplateCardProps) => {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-all duration-200">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div
            className={`p-2 rounded-lg ${
              template.config_type === "grid_based"
                ? "bg-blue-50"
                : "bg-purple-50"
            }`}
          >
            {getConfigIcon(template.config_type)}
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">
              {template.name}
            </h3>
            <p className="text-sm text-gray-500 capitalize">
              {template.config_type.replace("_", " ")}
            </p>
          </div>
        </div>
        <span
          className={`px-2.5 py-1 rounded-full text-xs font-medium ${getStatusColor(
            template.status
          )}`}
        >
          {template.status.charAt(0).toUpperCase() + template.status.slice(1)}
        </span>
      </div>

      {/* Description */}
      {template.description && (
        <div className="mb-4">
          <p className="text-sm text-gray-600 line-clamp-2">
            {template.description}
          </p>
        </div>
      )}

      {/* Stats */}
      <div className="mb-4 space-y-2">
        <div className="flex items-center text-sm text-gray-500">
          <DocumentTextIcon className="h-4 w-4 mr-2" />
          Questions: {template.num_questions}
        </div>
        <div className="flex items-center text-sm text-gray-500">
          <Squares2X2Icon className="h-4 w-4 mr-2" />
          Options per Q: {template.num_of_options_per_question}
        </div>
        <div className="flex items-center text-sm text-gray-500">
          <CalendarIcon className="h-4 w-4 mr-2" />
          Created {formatDate(template.created_at)}
        </div>
      </div>

      {/* Actions */}
      <div className="flex space-x-2">
        <Button
          variant="outline"
          size="sm"
          icon={<EyeIcon className="h-4 w-4" />}
          onClick={() => viewTemplate(template)}
        >
          View
        </Button>
        <Button
          variant="outline"
          size="sm"
          icon={<PencilIcon className="h-4 w-4" />}
          onClick={() => editTemplate(template.id)}
        >
          Edit
        </Button>
        <Button
          variant="outline"
          size="sm"
          icon={<TrashIcon className="h-4 w-4" />}
          onClick={() => confirmDelete(template.id)}
        >
          Delete
        </Button>
      </div>
    </div>
  );
};

export default TemplateCard;
