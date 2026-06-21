import React, { useState } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faEdit,
  faTrash,
  faEllipsisH,
  faPlus,
} from "@fortawesome/free-solid-svg-icons";
import axiosInstance from "../../../utils/axiosclient";
import { Button } from "../../../components/UI/Button";
import { VerificationModal } from "../../../components/Modals/VerificationModal";
import { FacultyFormModal } from "./FacultyFormModal";

export interface Faculty {
  id: number;
  name: string;
  created_at: string;
  updated_at: string;
}

interface FacultyTableProps {
  faculties: Faculty[];
  loading: boolean;
  onRefresh: () => void;
}

export const FacultyTable: React.FC<FacultyTableProps> = ({
  faculties,
  loading,
  onRefresh,
}) => {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [selectedFaculty, setSelectedFaculty] = useState<Faculty | null>(null);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleEdit = (faculty: Faculty) => {
    setSelectedFaculty(faculty);
    setIsEditModalOpen(true);
  };

  const handleDelete = (faculty: Faculty) => {
    setSelectedFaculty(faculty);
    setIsDeleteModalOpen(true);
  };

  const handleCreate = () => {
    setSelectedFaculty(null);
    setIsCreateModalOpen(true);
  };

  const handleModalClose = () => {
    setIsCreateModalOpen(false);
    setIsEditModalOpen(false);
    setIsDeleteModalOpen(false);
    setSelectedFaculty(null);
  };

  const handleFormSubmit = () => {
    handleModalClose();
    onRefresh();
  };

  const handleDeleteConfirm = async () => {
    if (!selectedFaculty) return;

    try {
      await axiosInstance.delete(`/api/faculties/${selectedFaculty.id}`);
      onRefresh();
    } catch (error: unknown) {
      console.error("Error deleting faculty:", error);
      const detail =
        (error as { response?: { data?: { detail?: string } } })?.response?.data
          ?.detail;
      alert(
        detail ? `Failed to delete faculty: ${detail}` : "Failed to delete faculty"
      );
    }

    handleModalClose();
  };

  return (
    <>
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-200">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-slate-900">
                Faculties
              </h3>
              <p className="text-sm text-slate-600 mt-1">
                Manage faculty departments and organizations
              </p>
            </div>
            <Button
              onClick={handleCreate}
              variant="primary"
              size="sm"
              icon={<FontAwesomeIcon icon={faPlus} />}
            >
              Add Faculty
            </Button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-slate-50">
              <tr>
                <th className="text-left py-3 px-6 text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Faculty Name
                </th>
                <th className="text-left py-3 px-6 text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Created
                </th>
                <th className="text-left py-3 px-6 text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Last Updated
                </th>
                <th className="text-center py-3 px-6 text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-200">
              {loading ? (
                <tr>
                  <td colSpan={4} className="text-center py-12">
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                      <p className="ml-3 text-slate-500">
                        Loading faculties...
                      </p>
                    </div>
                  </td>
                </tr>
              ) : faculties.length === 0 ? (
                <tr>
                  <td colSpan={4} className="text-center py-12">
                    <div className="text-slate-400">
                      <FontAwesomeIcon
                        icon={faEllipsisH}
                        className="text-2xl mb-2"
                      />
                      <p>No faculties found</p>
                    </div>
                  </td>
                </tr>
              ) : (
                faculties.map((faculty) => (
                  <tr
                    key={faculty.id}
                    className="hover:bg-slate-50 transition-colors"
                  >
                    <td className="py-4 px-6">
                      <div>
                        <p className="text-sm font-medium text-slate-900">
                          {faculty.name}
                        </p>
                        <p className="text-xs text-slate-500">
                          ID: {faculty.id}
                        </p>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <span className="text-sm text-slate-600">
                        {formatDate(faculty.created_at)}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <span className="text-sm text-slate-600">
                        {formatDate(faculty.updated_at)}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center justify-center space-x-2">
                        <button
                          onClick={() => handleEdit(faculty)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Edit Faculty"
                        >
                          <FontAwesomeIcon icon={faEdit} className="text-sm" />
                        </button>
                        <button
                          onClick={() => handleDelete(faculty)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete Faculty"
                        >
                          <FontAwesomeIcon icon={faTrash} className="text-sm" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modals */}
      <FacultyFormModal
        isOpen={isCreateModalOpen}
        onClose={handleModalClose}
        onSubmit={handleFormSubmit}
        faculty={null}
        mode="create"
      />

      <FacultyFormModal
        isOpen={isEditModalOpen}
        onClose={handleModalClose}
        onSubmit={handleFormSubmit}
        faculty={selectedFaculty}
        mode="edit"
      />

      <VerificationModal
        isOpen={isDeleteModalOpen}
        onClose={handleModalClose}
        onConfirm={handleDeleteConfirm}
        title="Delete Faculty"
        message={`Are you sure you want to delete "${selectedFaculty?.name}"? This action cannot be undone.`}
        confirmText="Delete"
        type="warning"
      />
    </>
  );
};
