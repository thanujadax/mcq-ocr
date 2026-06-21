import React, { useState } from "react";
import {
  EllipsisVerticalIcon,
  ShieldCheckIcon,
  UserMinusIcon,
  TrashIcon,
  CheckCircleIcon,
} from "@heroicons/react/24/outline";
import { User, UserRoles, VerifyStatus } from "../types/types";
import { Button } from "../../../components/UI/Button";

interface UserActionsProps {
  user: User;
  currentUserRole: UserRoles;
  onVerifyUser: (userId: number) => void;
  onToggleRole: (userId: number, newRole: UserRoles) => void;
  onDeleteUser: (userId: number) => void;
}

export function UserActions({
  user,
  currentUserRole,
  onVerifyUser,
  onToggleRole,
  onDeleteUser,
}: UserActionsProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const canVerify = user.verify_status !== VerifyStatus.ADMINVERIFIED;
  const canChangeRole =
    currentUserRole === UserRoles.SUPERADMIN ||
    (currentUserRole === UserRoles.FACULTYADMIN &&
      user.role !== UserRoles.SUPERADMIN);
  const canDelete =
    currentUserRole === UserRoles.SUPERADMIN ||
    (currentUserRole === UserRoles.FACULTYADMIN &&
      user.role !== UserRoles.SUPERADMIN);

  const handleToggleRole = () => {
    const newRole =
      user.role === UserRoles.FACULTYADMIN
        ? UserRoles.BASIC
        : UserRoles.FACULTYADMIN;
    onToggleRole(user.id, newRole);
    setIsMenuOpen(false);
  };

  const handleVerify = () => {
    onVerifyUser(user.id);
  };

  const handleDelete = () => {
    onDeleteUser(user.id);
    setIsMenuOpen(false);
  };

  return (
    <div className="flex items-center justify-end space-x-2">
      {/* Verify Button - only show if not verified */}
      {canVerify && (
        <Button
          variant="outline"
          size="sm"
          icon={<CheckCircleIcon className="h-4 w-4" />}
          onClick={handleVerify}
          className="text-green-600 border-green-200 hover:bg-green-50"
          title="Verify User"
        >
          Verify
        </Button>
      )}

      {/* Three dots menu */}
      <div className="relative">
        <Button
          variant="outline"
          size="sm"
          icon={<EllipsisVerticalIcon className="h-4 w-4" />}
          onClick={() => setIsMenuOpen(!isMenuOpen)}
          className="px-2"
          title="More Actions"
        />

        {isMenuOpen && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 z-10"
              onClick={() => setIsMenuOpen(false)}
            />

            {/* Menu */}
            <div className="absolute left-0 mt-2 w-48 bg-white rounded-md shadow-lg z-20 border border-gray-100 overflow-visible transform -translate-x-full">
              <div className="py-1">
                {canChangeRole && user.role !== UserRoles.SUPERADMIN && (
                  <button
                    onClick={handleToggleRole}
                    className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                  >
                    {user.role === UserRoles.FACULTYADMIN ? (
                      <UserMinusIcon className="h-4 w-4 mr-3" />
                    ) : (
                      <ShieldCheckIcon className="h-4 w-4 mr-3" />
                    )}
                    {user.role === UserRoles.FACULTYADMIN
                      ? "Remove Faculty Admin"
                      : "Make Faculty Admin"}
                  </button>
                )}

                {canDelete && (
                  <button
                    onClick={handleDelete}
                    className="flex items-center w-full px-4 py-2 text-sm text-red-700 hover:bg-red-50"
                  >
                    <TrashIcon className="h-4 w-4 mr-3" />
                    Delete User
                  </button>
                )}

                {!canChangeRole && !canDelete && (
                  <div className="px-4 py-2 text-sm text-gray-500">
                    No actions available
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
