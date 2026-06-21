"use client";

import React from "react";
import {
  UserGroupIcon,
  DocumentTextIcon,
  ClipboardDocumentCheckIcon,
  CheckCircleIcon,
} from "@heroicons/react/24/outline";

interface StatCard {
  name: string;
  value: string;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
}

interface StatsCardsProps {
  totalUsers: number;
  activeTemplates: number;
  completedJobs: number;
  completionRate: number;
  isVisible: boolean;
}

export function StatsCards({
  totalUsers,
  activeTemplates,
  completedJobs,
  completionRate,
  isVisible,
}: StatsCardsProps) {
  const stats: StatCard[] = [
    {
      name: "Total Users",
      value: totalUsers.toString(),
      icon: <UserGroupIcon className="h-7 w-7" />,
      color: "text-amber-600",
      bgColor: "bg-amber-50",
    },
    {
      name: "Active Templates",
      value: activeTemplates.toString(),
      icon: <DocumentTextIcon className="h-7 w-7" />,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      name: "Completed Jobs",
      value: completedJobs.toString(),
      icon: <ClipboardDocumentCheckIcon className="h-7 w-7" />,
      color: "text-pink-600",
      bgColor: "bg-pink-50",
    },
    {
      name: "Completion Rate",
      value: `${completionRate.toFixed(1)}%`,
      icon: <CheckCircleIcon className="h-7 w-7" />,
      color: "text-green-600",
      bgColor: "bg-green-50",
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
      {stats.map((stat, index) => (
        <div
          key={index}
          className={`bg-white rounded-2xl p-6 border border-gray-100 hover:shadow-xl transition-all duration-500 transform hover:-translate-y-1 ${
            isVisible ? "translate-y-0 opacity-100" : "translate-y-4 opacity-0"
          }`}
          style={{ transitionDelay: `${(index + 1) * 100}ms` }}
        >
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-600 mb-2">
                {stat.name}
              </p>
              <p className="text-3xl font-bold text-gray-900">{stat.value}</p>
            </div>
            <div
              className={`p-4 rounded-2xl ${stat.bgColor} transform transition-all duration-300 hover:scale-110 hover:rotate-3`}
            >
              <div className={stat.color}>{stat.icon}</div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
