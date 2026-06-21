import React from "react";
import { Table, TableColumn } from "../../../components/UI/Table";
import { User, UserRoles } from "../types/types";
import { StatusBadge, RoleBadge } from "./StatusBadge";
import { UserActions } from "./UserActions";

interface UsersTableProps {
  users: User[];
  currentUserRole: UserRoles;
  onVerifyUser: (userId: number) => void;
  onToggleRole: (userId: number, newRole: UserRoles) => void;
  onDeleteUser: (userId: number) => void;
}

export function UsersTable({
  users,
  currentUserRole,
  onVerifyUser,
  onToggleRole,
  onDeleteUser,
}: UsersTableProps) {
  const columns: TableColumn<User>[] = [
    {
      header: "Name",
      accessor: (user: User) => (
        <div className="flex items-center space-x-3">
          <div className="flex-shrink-0">
            <div className="h-10 w-10 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 flex items-center justify-center text-white font-medium text-sm">
              {`${user.first_name?.charAt(0) || ""}${
                user.last_name?.charAt(0) || ""
              }`}
            </div>
          </div>
          <div>
            <p className="text-sm font-medium text-slate-900">
              {`${user.first_name} ${user.last_name}`}
            </p>
            <p className="text-xs text-slate-500">ID: {user.id}</p>
          </div>
        </div>
      ),
      sortable: true,
    },
    {
      header: "Email",
      accessor: "email",
      sortable: true,
    },
    {
      header: "Faculty",
      accessor: (user: User) => user.faculty?.name || "N/A",
      sortable: true,
    },
    {
      header: "Role",
      accessor: (user: User) => <RoleBadge role={user.role} />,
      sortable: true,
    },
    {
      header: "Status",
      accessor: (user: User) => <StatusBadge status={user.verify_status} />,
      sortable: true,
    },
    {
      header: "Created",
      accessor: (user: User) => {
        if (!user.created_at) return "N/A";
        const date = new Date(user.created_at);
        return date.toLocaleDateString();
      },
      sortable: true,
    },
    {
      header: "Actions",
      accessor: (user: User) => (
        <UserActions
          user={user}
          currentUserRole={currentUserRole}
          onVerifyUser={onVerifyUser}
          onToggleRole={onToggleRole}
          onDeleteUser={onDeleteUser}
        />
      ),
    },
  ];

  return (
    <div className="bg-white rounded-2xl overflow-hidden border border-gray-100 h-[600px] flex flex-col">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-100 flex-shrink-0">
        <h3 className="text-lg font-semibold text-gray-900">Users</h3>
        <p className="text-sm text-gray-600 mt-1">
          Manage users, roles, and verification status
        </p>
      </div>

      <div className="flex-1 flex flex-col">
        <div className="flex-1 min-h-96 overflow-hidden">
          <Table
            columns={columns}
            data={users}
            keyField="id"
            pagination={true}
            itemsPerPage={5}
            searchable={false}
            searchPlaceholder="Search users..."
            emptyMessage="No users found"
          />
        </div>
      </div>
    </div>
  );
}
