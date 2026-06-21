"use client";

import { useEffect, useState, useCallback } from "react";
import { VerificationModal } from "../../components/Modals/VerificationModal";
import { useToast } from "../../hooks/useToast";
import { useAuth } from "../../hooks/useAuth";
import axiosInstance from "@/utils/axiosclient";

import { User, UserRoles, VerifyStatus } from "./types/types";
import { PageHeader } from "./components/PageHeader";
import { StatsOverview } from "./components/StatsOverview";
import { FiltersSection } from "./components/FiltersSection";
import { UsersTable } from "./components/UsersTable";
import { CreateUserModal } from "./components/CreateUserModal";

export default function Users() {
  const [selectedUser, setSelectedUser] = useState<number | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [verificationFilter, setVerificationFilter] = useState("all");
  const [roleFilter, setRoleFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  const { user: currentUser } = useAuth();
  const currentUserRole = (currentUser?.role as UserRoles) ?? UserRoles.BASIC;
  const canCreateUser =
    currentUserRole === UserRoles.SUPERADMIN ||
    currentUserRole === UserRoles.FACULTYADMIN;

  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<User[]>([]);
  const { showToast } = useToast();

  // Filter and sort users
  const filteredUsers = users
    .filter((user) => {
      // Filter by verification status
      const verificationMatch =
        verificationFilter === "all" ||
        user.verify_status === verificationFilter;

      // Filter by role
      const roleMatch = roleFilter === "all" || user.role === roleFilter;

      // Filter by search query (search in name and email)
      const searchMatch =
        searchQuery.trim() === "" ||
        `${user.first_name} ${user.last_name}`
          .toLowerCase()
          .includes(searchQuery.toLowerCase()) ||
        user.email.toLowerCase().includes(searchQuery.toLowerCase());

      return verificationMatch && roleMatch && searchMatch;
    })
    .sort((a, b) => {
      // Sort by verification status: unverified first, then faculty admins
      if (
        a.verify_status !== VerifyStatus.ADMINVERIFIED &&
        b.verify_status === VerifyStatus.ADMINVERIFIED
      ) {
        return -1;
      }
      if (
        a.verify_status === VerifyStatus.ADMINVERIFIED &&
        b.verify_status !== VerifyStatus.ADMINVERIFIED
      ) {
        return 1;
      }
      // If both have same verification status, sort by role: faculty admins first
      if (
        a.role === UserRoles.FACULTYADMIN &&
        b.role !== UserRoles.FACULTYADMIN
      ) {
        return -1;
      }
      if (
        a.role !== UserRoles.FACULTYADMIN &&
        b.role === UserRoles.FACULTYADMIN
      ) {
        return 1;
      }
      // Finally sort by name
      return `${a.first_name} ${a.last_name}`.localeCompare(
        `${b.first_name} ${b.last_name}`
      );
    });

  // Pagination calculations
  // The Table component handles pagination internally

  const handleVerificationFilterChange = (status: string) => {
    setVerificationFilter(status);
  };

  const handleRoleFilterChange = (role: string) => {
    setRoleFilter(role);
  };

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
  };

  const handleVerifyUser = async (userId: number) => {
    try {
      await axiosInstance.patch(`/api/users/${userId}/verify`);
      showToast("User verified successfully", "success");

      // Update local state
      setUsers((prevUsers) =>
        prevUsers.map((user) =>
          user.id === userId
            ? { ...user, verify_status: VerifyStatus.ADMINVERIFIED }
            : user
        )
      );
    } catch (error) {
      console.error("Failed to verify user:", error);
      showToast("Failed to verify user", "error");
    }
  };

  const handleToggleRole = async (userId: number, newRole: UserRoles) => {
    try {
      await axiosInstance.patch(`/api/users/${userId}/update-role`, {
        role: newRole,
      });
      showToast(`User role updated to ${newRole}`, "success");

      // Update local state
      setUsers((prevUsers) =>
        prevUsers.map((user) =>
          user.id === userId ? { ...user, role: newRole } : user
        )
      );
    } catch (error) {
      console.error("Failed to update user role:", error);
      showToast("Failed to update user role", "error");
    }
  };

  const handleDeleteUser = async () => {
    if (!selectedUser) return;

    try {
      await axiosInstance.delete(`/api/users/${selectedUser}`);
      showToast("User deleted successfully", "success");

      // Update local state
      setUsers((prevUsers) =>
        prevUsers.filter((user) => user.id !== selectedUser)
      );
      setIsDeleteModalOpen(false);
      setSelectedUser(null);
    } catch (error) {
      console.error("Failed to delete user:", error);
      showToast("Failed to delete user", "error");
    }
  };

  const confirmDelete = (userId: number) => {
    setSelectedUser(userId);
    setIsDeleteModalOpen(true);
  };

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const response = await axiosInstance.get("/api/users");
      const usersData: User[] = response.data as User[];
      setUsers(usersData);
    } catch (error) {
      console.error("Failed to fetch users:", error);
      showToast("Failed to load users", "error");
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  return (
    <div className="space-y-6 p-6">
      <PageHeader
        onCreateNew={canCreateUser ? () => setIsCreateModalOpen(true) : undefined}
      />

      <StatsOverview users={users} />

      <FiltersSection
        totalUsers={users.length}
        verificationFilter={verificationFilter}
        roleFilter={roleFilter}
        searchQuery={searchQuery}
        onVerificationFilterChange={handleVerificationFilterChange}
        onRoleFilterChange={handleRoleFilterChange}
        onSearchChange={handleSearchChange}
      />

      {loading ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-12 text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-500">Loading users...</p>
        </div>
      ) : (
        <UsersTable
          users={filteredUsers}
          currentUserRole={currentUserRole}
          onVerifyUser={handleVerifyUser}
          onToggleRole={handleToggleRole}
          onDeleteUser={confirmDelete}
        />
      )}

      <VerificationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteUser}
        title="Delete User"
        message="Are you sure you want to delete this user? This action cannot be undone."
        confirmText="Delete"
        type="warning"
      />

      {canCreateUser && (
        <CreateUserModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onCreated={() => {
            showToast("User created successfully", "success");
            fetchUsers();
          }}
        />
      )}
    </div>
  );
}
