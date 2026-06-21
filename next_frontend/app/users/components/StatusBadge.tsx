import React from "react";
import {
  CheckCircleIcon,
  ExclamationTriangleIcon,
  XCircleIcon,
  ShieldCheckIcon,
  UserIcon,
} from "@heroicons/react/24/solid";
import { UserRoles, VerifyStatus } from "../types/types";

interface StatusBadgeProps {
  status: VerifyStatus;
}

interface RoleBadgeProps {
  role: UserRoles;
}

export function StatusBadge({ status }: StatusBadgeProps) {
  const getStatusStyle = (status: VerifyStatus) => {
    switch (status) {
      case VerifyStatus.ADMINVERIFIED:
        return "bg-green-100 text-green-800 border-green-200";
      case VerifyStatus.EMAILVERIFIED:
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case VerifyStatus.NONE:
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getStatusText = (status: VerifyStatus) => {
    switch (status) {
      case VerifyStatus.ADMINVERIFIED:
        return "Admin Verified";
      case VerifyStatus.EMAILVERIFIED:
        return "Email Verified";
      case VerifyStatus.NONE:
        return "Unverified";
      default:
        return "Unknown";
    }
  };

  const getStatusIcon = (status: VerifyStatus) => {
    switch (status) {
      case VerifyStatus.ADMINVERIFIED:
        return <CheckCircleIcon className="h-3 w-3 mr-1" />;
      case VerifyStatus.EMAILVERIFIED:
        return <ExclamationTriangleIcon className="h-3 w-3 mr-1" />;
      case VerifyStatus.NONE:
        return <XCircleIcon className="h-3 w-3 mr-1" />;
      default:
        return null;
    }
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getStatusStyle(
        status
      )}`}
    >
      {getStatusIcon(status)}
      {getStatusText(status)}
    </span>
  );
}

export function RoleBadge({ role }: RoleBadgeProps) {
  const getRoleStyle = (role: UserRoles) => {
    switch (role) {
      case UserRoles.SUPERADMIN:
        return "bg-red-100 text-red-800 border-red-200";
      case UserRoles.FACULTYADMIN:
        return "bg-purple-100 text-purple-800 border-purple-200";
      case UserRoles.BASIC:
        return "bg-blue-100 text-blue-800 border-blue-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getRoleIcon = (role: UserRoles) => {
    switch (role) {
      case UserRoles.SUPERADMIN:
        return <ShieldCheckIcon className="h-3 w-3 mr-1" />;
      case UserRoles.FACULTYADMIN:
        return <ShieldCheckIcon className="h-3 w-3 mr-1" />;
      case UserRoles.BASIC:
        return <UserIcon className="h-3 w-3 mr-1" />;
      default:
        return null;
    }
  };

  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getRoleStyle(
        role
      )}`}
    >
      {getRoleIcon(role)}
      {role}
    </span>
  );
}
