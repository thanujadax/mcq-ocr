"use client";

import React from "react";
import {
  ClockIcon,
  DocumentTextIcon,
  ClipboardDocumentCheckIcon,
  CheckCircleIcon,
} from "@heroicons/react/24/outline";

interface Activity {
  activity_type: string;
  description: string;
  related_id: number;
  timestamp: string;
}

interface UserActivitiesProps {
  activities: Activity[];
  isVisible: boolean;
}

const getActivityConfig = (activityType: string) => {
  switch (activityType) {
    case "template_created":
      return {
        color: "bg-blue-50",
        iconColor: "text-blue-600",
        icon: DocumentTextIcon,
      };
    case "marking_job_created":
      return {
        color: "bg-purple-50",
        iconColor: "text-purple-600",
        icon: ClipboardDocumentCheckIcon,
      };
    case "marking_job_completed":
      return {
        color: "bg-green-50",
        iconColor: "text-green-600",
        icon: CheckCircleIcon,
      };
    default:
      return {
        color: "bg-gray-50",
        iconColor: "text-gray-600",
        icon: ClockIcon,
      };
  }
};

const formatTimeAgo = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();
  const diffInMins = Math.floor(diffInMs / 60000);
  const diffInHours = Math.floor(diffInMs / 3600000);
  const diffInDays = Math.floor(diffInMs / 86400000);

  if (diffInMins < 60) return `${diffInMins}m ago`;
  if (diffInHours < 24) return `${diffInHours}h ago`;
  return `${diffInDays}d ago`;
};

export function UserActivities({ activities, isVisible }: UserActivitiesProps) {
  if (activities.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 p-8">
        <div className="flex items-center mb-6">
          <ClockIcon className="h-6 w-6 text-blue-600 mr-3" />
          <h3 className="text-xl font-semibold text-gray-900">
            Your Recent Activities
          </h3>
        </div>
        <div className="text-center py-12">
          <ClockIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <p className="text-gray-500 text-lg">No recent activities</p>
          <p className="text-gray-400 text-sm mt-2">
            Your activities will appear here as you use the system
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
      <div className="flex items-center mb-6">
        <ClockIcon className="h-6 w-6 text-blue-600 mr-3" />
        <h3 className="text-xl font-semibold text-gray-900">
          Your Recent Activities
        </h3>
      </div>

      <div className="space-y-4">
        {activities.map((activity, index) => {
          const config = getActivityConfig(activity.activity_type);
          const IconComponent = config.icon;

          return (
            <div
              key={index}
              className={`flex items-center justify-between transition-all duration-500 p-4 rounded-xl hover:bg-gray-50 transform group ${
                isVisible
                  ? "translate-x-0 opacity-100"
                  : "translate-x-4 opacity-0"
              }`}
              style={{ transitionDelay: `${index * 50}ms` }}
            >
              <div className="flex items-center space-x-4">
                <div
                  className={`w-12 h-12 rounded-xl ${config.color} flex items-center justify-center transition-all duration-300 group-hover:scale-110`}
                >
                  <IconComponent className={`h-6 w-6 ${config.iconColor}`} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-gray-900 mb-1">
                    {activity.description}
                  </p>
                  <p className="text-xs text-gray-500">
                    ID: {activity.related_id}
                  </p>
                </div>
              </div>
              <span className="text-sm text-gray-400 font-medium">
                {formatTimeAgo(activity.timestamp)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
