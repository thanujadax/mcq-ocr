import { Card } from "@/components/UI/Card";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import React from "react";
import {
  faFileText,
  faTrash,
  faEdit,
  faEllipsisH,
  faCalendar,
  faCheckCircle,
  faTh,
  faProjectDiagram,
  faUser,
} from "@fortawesome/free-solid-svg-icons";
import { Template, ConfigType } from "@/models/template";
import { Button } from "@/components/UI/Button";

interface TemplateCardProps {
  template: Template;
  viewTemplate: (template: Template) => void;
  confirmDelete: (id: number) => void;
}

const getConfigIcon = (configType: ConfigType) => {
  switch (configType) {
    case "grid_based":
      return (
        <FontAwesomeIcon
          icon={faTh}
          className="h-6 w-6 text-blue-600"
        />
      );
    case "clustering_based":
      return (
        <FontAwesomeIcon 
          icon={faProjectDiagram} 
          className="h-6 w-6 text-purple-600" 
        />
      );
    default:
      return (
        <FontAwesomeIcon icon={faFileText} className="h-6 w-6 text-gray-600" />
      );
  }
};

const getStatusColor = (status: string) => {
  switch (status) {
    case "ready":
      return "bg-green-100 text-green-800";
    case "processing":
      return "bg-blue-100 text-blue-800";
    case "queued":
      return "bg-yellow-100 text-yellow-800";
    case "failed":
      return "bg-red-100 text-red-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
};

const formatDate = (isoString: string) => {
  return new Date(isoString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric'
  });
};

const TemplateCard = ({ template, viewTemplate, confirmDelete }: TemplateCardProps) => {
  return (
    <Card key={template.id} className="hover:shadow-md transition-shadow">
      <div className="flex justify-between">
        <div className="flex items-center">
          <div
            className={`p-2 rounded-md ${
              template.config_type === "grid_based" ? "bg-blue-50" : "bg-purple-50"
            }`}
          >
            {getConfigIcon(template.config_type)}
          </div>
          <div className="ml-3">
            <h3 className="text-lg font-medium text-gray-900">
              {template.name}
            </h3>
            <p className="text-sm text-gray-500 capitalize">
              {template.config_type.replace('_', ' ')}
            </p>
          </div>
        </div>
        <div className="relative">
          <div className="dropdown inline-block relative">
            <button className="p-1 rounded-full hover:bg-gray-100">
              <FontAwesomeIcon
                icon={faEllipsisH}
                className="h-5 w-5 text-gray-500"
              />
            </button>
          </div>
        </div>
      </div>

      {template.description && (
        <div className="mt-3">
          <p className="text-sm text-gray-600 line-clamp-2">
            {template.description}
          </p>
        </div>
      )}

      <div className="mt-4 space-y-2">
        <div className="flex items-center text-sm text-gray-500">
          <FontAwesomeIcon icon={faCalendar} className="h-4 w-4 mr-2" />
          Created: {formatDate(template.created_at)}
        </div>
        <div className="flex items-center text-sm text-gray-500">
          <FontAwesomeIcon icon={faCheckCircle} className="h-4 w-4 mr-2" />
          Questions: {template.num_questions}
        </div>
        <div className="flex items-center text-sm text-gray-500">
          <FontAwesomeIcon icon={faCheckCircle} className="h-4 w-4 mr-2" />
          Options per Q: {template.options_per_question}
        </div>
        <div className="flex items-center text-sm text-gray-500">
          <FontAwesomeIcon icon={faUser} className="h-4 w-4 mr-2" />
          Created by: User #{template.created_by}
        </div>
        <div className="flex items-center">
          <span
            className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(template.status)}`}
          >
            {template.status.charAt(0).toUpperCase() + template.status.slice(1)}
          </span>
        </div>
      </div>

      <div className="mt-4 flex space-x-2">
        <Button
          variant="outline"
          size="sm"
          icon={<FontAwesomeIcon icon={faFileText} className="h-4 w-4" />}
          onClick={() => viewTemplate(template)}
        >
          View
        </Button>
        <Button
          variant="outline"
          size="sm"
          icon={<FontAwesomeIcon icon={faEdit} className="h-4 w-4" />}
        >
          Edit
        </Button>
        <Button
          variant="outline"
          size="sm"
          icon={<FontAwesomeIcon icon={faTrash} className="h-4 w-4" />}
          onClick={() => confirmDelete(template.id)}
        >
          Delete
        </Button>
      </div>
    </Card>
  );
};

export default TemplateCard;