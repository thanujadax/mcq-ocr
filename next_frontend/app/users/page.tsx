"use client";

import { useState } from "react";
import { Table } from "../../components/UI/Table";
import { Button } from "../../components/UI/Button";
import { Modal } from "../../components/UI/Modal";
import { Input } from "../../components/UI/Input";
import { Select } from "../../components/UI/Select";
import { VerificationModal } from "../../components/Modals/VerificationModal";
import { useToast } from "../../hooks/useToast";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faPlus,
  faUser,
  faTrash,
  faEdit,
  faEnvelope,
  faPhone,
  faUserPlus,
  faCheck,
  faTimes,
  faUserCircle,
  faKey,
  faShield,
  faExclamationTriangle,
} from "@fortawesome/free-solid-svg-icons";
interface User {
  id: number;
  name: string;
  email: string;
  role: "admin" | "teacher" | "assistant";
  department: string;
  status: "active" | "inactive";
  lastLogin: string;
  permissions?: string[];
}
export default function Users() {
  const [selectedUser, setSelectedUser] = useState<number | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isPermissionsModalOpen, setIsPermissionsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const { showToast } = useToast();
  const [newUser, setNewUser] = useState({
    name: "",
    email: "",
    role: "teacher",
    department: "math",
    status: "active",
    phone: "",
  });
  const users: User[] = [
    {
      id: 1,
      name: "John Smith",
      email: "john.smith@example.com",
      role: "admin",
      department: "IT",
      status: "active",
      lastLogin: "2023-04-14",
      permissions: [
        "manage_users",
        "manage_templates",
        "manage_jobs",
        "view_reports",
      ],
    },
    {
      id: 2,
      name: "Sarah Johnson",
      email: "sarah.johnson@example.com",
      role: "teacher",
      department: "Math",
      status: "active",
      lastLogin: "2023-04-13",
      permissions: ["manage_templates", "manage_jobs"],
    },
    {
      id: 3,
      name: "Michael Brown",
      email: "michael.brown@example.com",
      role: "teacher",
      department: "Science",
      status: "active",
      lastLogin: "2023-04-12",
      permissions: ["manage_templates", "manage_jobs"],
    },
    {
      id: 4,
      name: "Emily Davis",
      email: "emily.davis@example.com",
      role: "teacher",
      department: "English",
      status: "inactive",
      lastLogin: "2023-03-25",
      permissions: ["manage_templates"],
    },
    {
      id: 5,
      name: "David Wilson",
      email: "david.wilson@example.com",
      role: "teacher",
      department: "History",
      status: "active",
      lastLogin: "2023-04-14",
      permissions: ["manage_templates", "manage_jobs"],
    },
    {
      id: 6,
      name: "Jennifer Garcia",
      email: "jennifer.garcia@example.com",
      role: "admin",
      department: "IT",
      status: "active",
      lastLogin: "2023-04-10",
      permissions: [
        "manage_users",
        "manage_templates",
        "manage_jobs",
        "view_reports",
      ],
    },
    {
      id: 7,
      name: "Robert Martinez",
      email: "robert.martinez@example.com",
      role: "teacher",
      department: "Math",
      status: "active",
      lastLogin: "2023-04-11",
      permissions: ["manage_templates", "manage_jobs"],
    },
    {
      id: 8,
      name: "Lisa Rodriguez",
      email: "lisa.rodriguez@example.com",
      role: "teacher",
      department: "Science",
      status: "inactive",
      lastLogin: "2023-03-18",
      permissions: ["manage_templates"],
    },
    {
      id: 9,
      name: "Daniel Lee",
      email: "daniel.lee@example.com",
      role: "assistant",
      department: "Art",
      status: "active",
      lastLogin: "2023-04-09",
      permissions: ["manage_jobs"],
    },
    {
      id: 10,
      name: "Karen White",
      email: "karen.white@example.com",
      role: "assistant",
      department: "Music",
      status: "active",
      lastLogin: "2023-04-08",
      permissions: ["manage_jobs"],
    },
  ];
  const handleDeleteUser = () => {
    // In a real app, this would make an API call to delete the user
    console.log(`Deleting user with ID: ${selectedUser}`);
    showToast("User deleted successfully", "success");
    setIsDeleteModalOpen(false);
    setSelectedUser(null);
  };
  const confirmDelete = (id: number) => {
    setSelectedUser(id);
    setIsDeleteModalOpen(true);
  };
  const handleAddUser = () => {
    // Validate email format
    if (!/\S+@\S+\.\S+/.test(newUser.email)) {
      showToast("Please enter a valid email address", "error");
      return;
    }
    // In a real app, this would make an API call to add the user
    console.log("Adding new user:", newUser);
    showToast("User added successfully", "success");
    setIsAddModalOpen(false);
    // Reset form
    setNewUser({
      name: "",
      email: "",
      role: "teacher",
      department: "math",
      status: "active",
      phone: "",
    });
  };
  const openEditModal = (user: User) => {
    setEditingUser(user);
    setIsEditModalOpen(true);
  };
  const openPermissionsModal = (user: User) => {
    setEditingUser(user);
    setIsPermissionsModalOpen(true);
  };
  const handleEditUser = () => {
    // In a real app, this would make an API call to update the user
    console.log("Updating user:", editingUser);
    showToast("User updated successfully", "success");
    setIsEditModalOpen(false);
    setEditingUser(null);
  };
  const handleUpdatePermissions = () => {
    // In a real app, this would make an API call to update the user permissions
    console.log("Updating permissions for user:", editingUser);
    showToast("User permissions updated successfully", "success");
    setIsPermissionsModalOpen(false);
    setEditingUser(null);
  };
  const handleResetPassword = (userId: number) => {
    // In a real app, this would make an API call to reset the user's password
    console.log(`Resetting password for user with ID: ${userId}`);
    showToast("Password reset link sent to user", "success");
  };
  const getStatusBadge = (status: string) => {
    return status === "active" ? (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
        <FontAwesomeIcon icon={faCheck} className="h-3 w-3 mr-1" />
        Active
      </span>
    ) : (
      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
        <FontAwesomeIcon icon={faTimes} className="h-3 w-3 mr-1" />
        Inactive
      </span>
    );
  };
  const getRoleBadge = (role: string) => {
    switch (role) {
      case "admin":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800">
            Administrator
          </span>
        );
      case "teacher":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
            Teacher
          </span>
        );
      case "assistant":
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
            Assistant
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
            {role}
          </span>
        );
    }
  };
  const columns = [
    { header: "Name", accessor: "name" as keyof User, sortable: true },
    { header: "Email", accessor: "email" as keyof User, sortable: true },
    {
      header: "Role",
      accessor: (user: User) => getRoleBadge(user.role),
      sortable: true,
    },
    {
      header: "Department",
      accessor: "department" as keyof User,
      sortable: true,
    },
    {
      header: "Last Login",
      accessor: "lastLogin" as keyof User,
      sortable: true,
    },
    {
      header: "Status",
      accessor: (user: User) => getStatusBadge(user.status),
      sortable: true,
    },
    {
      header: "Actions",
      accessor: (user: User) => (
        <div className="flex space-x-2">
          <Button
            variant="outline"
            size="sm"
            icon={<FontAwesomeIcon icon={faEdit} className="h-4 w-4" />}
            aria-label="Edit user"
            onClick={() => openEditModal(user)}
          >
            Edit
          </Button>
          <Button
            variant="outline"
            size="sm"
            icon={<FontAwesomeIcon icon={faShield} className="h-4 w-4" />}
            aria-label="Manage permissions"
            onClick={() => openPermissionsModal(user)}
          >
            Permissions
          </Button>
          <Button
            variant="outline"
            size="sm"
            icon={<FontAwesomeIcon icon={faTrash} className="h-4 w-4" />}
            aria-label="Delete user"
            onClick={() => confirmDelete(user.id)}
          >
            Delete
          </Button>
        </div>
      ),
    },
  ];
  const addUserFooter = (
    <>
      <Button variant="outline" onClick={() => setIsAddModalOpen(false)}>
        Cancel
      </Button>
      <Button
        variant="primary"
        onClick={handleAddUser}
        icon={<FontAwesomeIcon icon={faUserPlus} className="h-4 w-4" />}
      >
        Add User
      </Button>
    </>
  );
  const editUserFooter = (
    <>
      <Button variant="outline" onClick={() => setIsEditModalOpen(false)}>
        Cancel
      </Button>
      <Button
        variant="primary"
        onClick={handleEditUser}
        icon={<FontAwesomeIcon icon={faEdit} className="h-4 w-4" />}
      >
        Update User
      </Button>
    </>
  );
  const permissionsFooter = (
    <>
      <Button
        variant="outline"
        onClick={() => setIsPermissionsModalOpen(false)}
      >
        Cancel
      </Button>
      <Button
        variant="primary"
        onClick={handleUpdatePermissions}
        icon={<FontAwesomeIcon icon={faShield} className="h-4 w-4" />}
      >
        Update Permissions
      </Button>
    </>
  );
  const permissionsList = [
    {
      id: "manage_users",
      name: "Manage Users",
      description: "Add, edit, and delete users",
    },
    {
      id: "manage_templates",
      name: "Manage Templates",
      description: "Create, edit, and delete templates",
    },
    {
      id: "manage_jobs",
      name: "Manage Marking Jobs",
      description: "Create and process marking jobs",
    },
    {
      id: "view_reports",
      name: "View Reports",
      description: "Access and download reports",
    },
    {
      id: "admin_settings",
      name: "Admin Settings",
      description: "Change system settings",
    },
  ];
  return (
    <>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-900">Users</h2>
          <Button
            variant="primary"
            icon={<FontAwesomeIcon icon={faPlus} className="h-4 w-4" />}
            onClick={() => setIsAddModalOpen(true)}
          >
            Add User
          </Button>
        </div>
        <div className="bg-white p-4 rounded-md shadow-sm mb-4">
          <p className="text-sm text-gray-600">
            Manage users and their permissions. Administrators can add, edit,
            delete users and control their access to system features.
          </p>
        </div>
        <div className="flex items-center space-x-2 text-gray-700">
          <FontAwesomeIcon icon={faUser} className="h-5 w-5 text-gray-400" />
          <span className="font-medium">Total Users: {users.length}</span>
          <span className="mx-2">|</span>
          <span className="text-green-600 font-medium">
            Active: {users.filter((u) => u.status === "active").length}
          </span>
          <span className="mx-2">|</span>
          <span className="text-gray-500 font-medium">
            Inactive: {users.filter((u) => u.status === "inactive").length}
          </span>
        </div>
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <Table
            columns={columns}
            data={users}
            keyField="id"
            pagination={true}
            itemsPerPage={5}
            searchable={true}
            searchPlaceholder="Search users by name or email..."
            emptyMessage="No users found"
          />
        </div>
        {/* Add User Modal */}
        <Modal
          isOpen={isAddModalOpen}
          onClose={() => setIsAddModalOpen(false)}
          title="Add New User"
          size="lg"
          footer={addUserFooter}
        >
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
            <Input
              label="Full Name"
              value={newUser.name}
              onChange={(e) =>
                setNewUser({
                  ...newUser,
                  name: e.target.value,
                })
              }
              placeholder="Enter full name"
              leftIcon={
                <FontAwesomeIcon
                  icon={faUser}
                  className="h-5 w-5 text-gray-400"
                />
              }
              required
            />
            <Input
              label="Email Address"
              type="email"
              value={newUser.email}
              onChange={(e) =>
                setNewUser({
                  ...newUser,
                  email: e.target.value,
                })
              }
              placeholder="Enter email address"
              leftIcon={
                <FontAwesomeIcon
                  icon={faEnvelope}
                  className="h-5 w-5 text-gray-400"
                />
              }
              required
            />
            <Select
              label="Role"
              value={newUser.role}
              onChange={(e) =>
                setNewUser({
                  ...newUser,
                  role: e.target.value as "admin" | "teacher" | "assistant",
                })
              }
              options={[
                {
                  value: "admin",
                  label: "Administrator",
                },
                {
                  value: "teacher",
                  label: "Teacher",
                },
                {
                  value: "assistant",
                  label: "Teaching Assistant",
                },
              ]}
            />
            <Select
              label="Department"
              value={newUser.department}
              onChange={(e) =>
                setNewUser({
                  ...newUser,
                  department: e.target.value,
                })
              }
              options={[
                {
                  value: "math",
                  label: "Mathematics",
                },
                {
                  value: "science",
                  label: "Science",
                },
                {
                  value: "english",
                  label: "English",
                },
                {
                  value: "history",
                  label: "History",
                },
                {
                  value: "art",
                  label: "Art",
                },
                {
                  value: "music",
                  label: "Music",
                },
                {
                  value: "it",
                  label: "IT",
                },
              ]}
            />
            <Select
              label="Status"
              value={newUser.status}
              onChange={(e) =>
                setNewUser({
                  ...newUser,
                  status: e.target.value as "active" | "inactive",
                })
              }
              options={[
                {
                  value: "active",
                  label: "Active",
                },
                {
                  value: "inactive",
                  label: "Inactive",
                },
              ]}
            />
            <Input
              label="Phone Number (Optional)"
              type="tel"
              value={newUser.phone}
              onChange={(e) =>
                setNewUser({
                  ...newUser,
                  phone: e.target.value,
                })
              }
              placeholder="Enter phone number"
              leftIcon={
                <FontAwesomeIcon
                  icon={faPhone}
                  className="h-5 w-5 text-gray-400"
                />
              }
            />
          </div>
          <div className="mt-6">
            <h4 className="text-sm font-medium text-gray-900 mb-2">
              Send Welcome Email
            </h4>
            <div className="flex items-center">
              <input
                id="send-welcome-email"
                name="send-welcome-email"
                type="checkbox"
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                defaultChecked
              />
              <label
                htmlFor="send-welcome-email"
                className="ml-2 block text-sm text-gray-700"
              >
                Send welcome email with login instructions
              </label>
            </div>
          </div>
        </Modal>
        {/* Edit User Modal */}
        <Modal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          title="Edit User"
          size="lg"
          footer={editUserFooter}
        >
          {editingUser && (
            <div className="space-y-6">
              <div className="flex items-center space-x-4">
                <div className="h-12 w-12 rounded-full bg-gray-200 flex items-center justify-center">
                  <FontAwesomeIcon
                    icon={faUserCircle}
                    className="h-8 w-8 text-gray-500"
                  />
                </div>
                <div>
                  <h3 className="text-lg font-medium text-gray-900">
                    {editingUser.name}
                  </h3>
                  <p className="text-sm text-gray-500">{editingUser.email}</p>
                </div>
              </div>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                <Input
                  label="Full Name"
                  value={editingUser.name}
                  onChange={(e) =>
                    setEditingUser({
                      ...editingUser,
                      name: e.target.value,
                    })
                  }
                  placeholder="Enter full name"
                  required
                />
                <Input
                  label="Email Address"
                  type="email"
                  value={editingUser.email}
                  onChange={(e) =>
                    setEditingUser({
                      ...editingUser,
                      email: e.target.value,
                    })
                  }
                  placeholder="Enter email address"
                  leftIcon={
                    <FontAwesomeIcon
                      icon={faEnvelope}
                      className="h-5 w-5 text-gray-400"
                    />
                  }
                  required
                />
                <Select
                  label="Role"
                  value={editingUser.role}
                  onChange={(e) =>
                    setEditingUser({
                      ...editingUser,
                      role: e.target.value as "admin" | "teacher" | "assistant",
                    })
                  }
                  options={[
                    {
                      value: "admin",
                      label: "Administrator",
                    },
                    {
                      value: "teacher",
                      label: "Teacher",
                    },
                    {
                      value: "assistant",
                      label: "Teaching Assistant",
                    },
                  ]}
                />
                <Select
                  label="Department"
                  value={editingUser.department}
                  onChange={(e) =>
                    setEditingUser({
                      ...editingUser,
                      department: e.target.value,
                    })
                  }
                  options={[
                    {
                      value: "math",
                      label: "Mathematics",
                    },
                    {
                      value: "science",
                      label: "Science",
                    },
                    {
                      value: "english",
                      label: "English",
                    },
                    {
                      value: "history",
                      label: "History",
                    },
                    {
                      value: "art",
                      label: "Art",
                    },
                    {
                      value: "music",
                      label: "Music",
                    },
                    {
                      value: "it",
                      label: "IT",
                    },
                  ]}
                />
                <Select
                  label="Status"
                  value={editingUser.status}
                  onChange={(e) =>
                    setEditingUser({
                      ...editingUser,
                      status: e.target.value as "active" | "inactive",
                    })
                  }
                  options={[
                    {
                      value: "active",
                      label: "Active",
                    },
                    {
                      value: "inactive",
                      label: "Inactive",
                    },
                  ]}
                />
              </div>
              <div className="border-t border-gray-200 pt-4">
                <h4 className="text-sm font-medium text-gray-900 mb-2">
                  Password Management
                </h4>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleResetPassword(editingUser.id)}
                  icon={<FontAwesomeIcon icon={faKey} className="h-4 w-4" />}
                >
                  Send Password Reset Link
                </Button>
              </div>
            </div>
          )}
        </Modal>
        {/* Permissions Modal */}
        <Modal
          isOpen={isPermissionsModalOpen}
          onClose={() => setIsPermissionsModalOpen(false)}
          title={`Manage Permissions: ${editingUser?.name}`}
          size="lg"
          footer={permissionsFooter}
        >
          {editingUser && (
            <div className="space-y-6">
              <div className="bg-gray-50 p-4 rounded-md">
                <div className="flex items-center">
                  <FontAwesomeIcon
                    icon={faShield}
                    className="h-5 w-5 text-blue-500 mr-2"
                  />
                  <span className="text-sm text-gray-700">
                    {getRoleBadge(editingUser.role)}
                    <span className="ml-2">
                      {editingUser.role === "admin"
                        ? "Administrators have full access to all system features."
                        : editingUser.role === "teacher"
                        ? "Teachers can manage their own templates and marking jobs."
                        : "Assistants have limited access to help with marking jobs."}
                    </span>
                  </span>
                </div>
              </div>
              <div className="space-y-4">
                <h4 className="text-sm font-medium text-gray-900">
                  Permissions
                </h4>
                {permissionsList.map((permission) => {
                  const hasPermission = editingUser.permissions?.includes(
                    permission.id
                  );
                  return (
                    <div key={permission.id} className="flex items-start">
                      <div className="flex items-center h-5">
                        <input
                          id={`permission-${permission.id}`}
                          name={`permission-${permission.id}`}
                          type="checkbox"
                          className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded"
                          defaultChecked={hasPermission}
                          disabled={
                            editingUser.role === "admin" &&
                            permission.id === "manage_users"
                          }
                        />
                      </div>
                      <div className="ml-3 text-sm">
                        <label
                          htmlFor={`permission-${permission.id}`}
                          className="font-medium text-gray-700"
                        >
                          {permission.name}
                        </label>
                        <p className="text-gray-500">
                          {permission.description}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
              <div className="bg-amber-50 border border-amber-200 rounded-md p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <FontAwesomeIcon
                      icon={faExclamationTriangle}
                      className="h-5 w-5 text-amber-400"
                    />
                  </div>
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-amber-800">
                      Permission Changes
                    </h3>
                    <p className="mt-2 text-sm text-amber-700">
                      Changing permissions will immediately affect what this
                      user can access in the system. Administrator users always
                      have access to all features.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </Modal>
        {/* Delete Confirmation Modal */}
        <VerificationModal
          isOpen={isDeleteModalOpen}
          onClose={() => setIsDeleteModalOpen(false)}
          onConfirm={handleDeleteUser}
          title="Delete User"
          message="Are you sure you want to delete this user? This action cannot be undone."
          confirmText="Delete"
          type="warning"
        />
      </div>
    </>
  );
}
