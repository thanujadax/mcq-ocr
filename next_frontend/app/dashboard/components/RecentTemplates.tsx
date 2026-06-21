"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { DocumentTextIcon } from "@heroicons/react/24/outline";

interface Template {
  id: number;
  name: string;
  num_questions: number;
  config_type: string;
  status: string;
  created_at: string;
}

interface RecentTemplatesProps {
  templates: Template[];
  isVisible: boolean;
}

const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

export function RecentTemplates({
  templates,
  isVisible,
}: RecentTemplatesProps) {
  const router = useRouter();

  if (templates.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 p-8">
        <h3 className="text-xl font-semibold text-gray-900 mb-6">
          Recent Templates
        </h3>
        <div className="text-center py-12">
          <DocumentTextIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-lg">No templates yet</p>
          <p className="text-gray-400 text-sm mt-2">
            Your recent templates will appear here
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`bg-white rounded-2xl border border-gray-100 p-6 transition-all duration-700 ${
        isVisible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
      }`}
    >
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-semibold text-gray-900">
          Recent Templates
        </h3>
        <button
          onClick={() => router.push("/templates")}
          className="text-blue-600 hover:text-blue-700 text-sm font-medium hover:underline transition-colors"
        >
          View all
        </button>
      </div>

      <div className="space-y-4">
        {templates.map((template, index) => (
          <div
            key={template.id}
            onClick={() => router.push("/templates")}
            className={`group p-5 border border-gray-100 rounded-xl hover:bg-gray-50 transition-all duration-500 hover:shadow-lg hover:border-gray-200 transform cursor-pointer ${
              isVisible
                ? "translate-x-0 opacity-100"
                : "-translate-x-4 opacity-0"
            }`}
            style={{ transitionDelay: `${(index + 2) * 100}ms` }}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-4 flex-1">
                <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                  <DocumentTextIcon className="h-6 w-6 text-blue-600" />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors mb-1">
                    {template.name}
                  </p>
                  <p className="text-sm text-gray-500 mb-3">
                    {template.num_questions} questions
                  </p>
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-xs px-3 py-1 rounded-full font-medium ${
                        template.config_type === "grid_based"
                          ? "bg-purple-100 text-purple-800"
                          : "bg-orange-100 text-orange-800"
                      }`}
                    >
                      {template.config_type.replace("_", " ")}
                    </span>
                    <span
                      className={`text-xs px-3 py-1 rounded-full font-medium ${
                        template.status === "completed"
                          ? "bg-green-100 text-green-800"
                          : "bg-amber-100 text-amber-800"
                      }`}
                    >
                      {template.status}
                    </span>
                  </div>
                </div>
              </div>
            </div>
            <p className="text-xs text-gray-400 mt-4 ml-16">
              {formatDate(template.created_at)}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}
