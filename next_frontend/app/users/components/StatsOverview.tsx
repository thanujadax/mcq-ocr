import React from "react";
import {
  UserGroupIcon,
  CheckCircleIcon,
  ExclamationCircleIcon,
  ShieldCheckIcon,
  UserIcon,
} from "@heroicons/react/24/outline";
import { User, UserRoles, VerifyStatus } from "../types/types";

interface StatsOverviewProps {
  users: User[];
}

export function StatsOverview({ users }: StatsOverviewProps) {
  const totalUsers = users.length;
  const verifiedUsers = users.filter(
    (user) => user.verify_status === VerifyStatus.ADMINVERIFIED
  ).length;
  const unverifiedUsers = users.filter(
    (user) => user.verify_status !== VerifyStatus.ADMINVERIFIED
  ).length;
  const facultyAdmins = users.filter(
    (user) => user.role === UserRoles.FACULTYADMIN
  ).length;
  const basicUsers = users.filter(
    (user) => user.role === UserRoles.BASIC
  ).length;

  const stats = [
    {
      name: "Total Users",
      value: totalUsers.toString(),
      icon: <UserGroupIcon className="h-6 w-6" />,
      iconColor: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      name: "Verified",
      value: verifiedUsers.toString(),
      icon: <CheckCircleIcon className="h-6 w-6" />,
      iconColor: "text-green-600",
      bgColor: "bg-green-50",
    },
    {
      name: "Pending Verification",
      value: unverifiedUsers.toString(),
      icon: <ExclamationCircleIcon className="h-6 w-6" />,
      iconColor: "text-yellow-600",
      bgColor: "bg-yellow-50",
    },
    {
      name: "Faculty Admins",
      value: facultyAdmins.toString(),
      icon: <ShieldCheckIcon className="h-6 w-6" />,
      iconColor: "text-purple-600",
      bgColor: "bg-purple-50",
    },
    {
      name: "Basic Users",
      value: basicUsers.toString(),
      icon: <UserIcon className="h-6 w-6" />,
      iconColor: "text-gray-600",
      bgColor: "bg-gray-50",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6 mb-6">
      {stats.map((stat, index) => (
        <div
          key={index}
          className="bg-white rounded-2xl p-6 border border-gray-100 hover:shadow-xl transition-all duration-300"
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500 mb-1">
                {stat.name}
              </p>
              <div className="flex items-baseline">
                <p className="text-2xl font-semibold text-gray-900">
                  {stat.value}
                </p>
              </div>
            </div>
            <div className={`p-3 rounded-full ${stat.bgColor}`}>
              <div className={stat.iconColor}>{stat.icon}</div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
