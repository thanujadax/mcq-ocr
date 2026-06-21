"use client";

import { useEffect, useState, useCallback } from "react";
import { useToast } from "../../hooks/useToast";
import axiosInstance from "@/utils/axiosclient";
import { FacultyTable, Faculty } from "./components/FacultyTable";

export default function SettingsPage() {
  const [faculties, setFaculties] = useState<Faculty[]>([]);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  const fetchFaculties = useCallback(async () => {
    try {
      setLoading(true);
      const response = await axiosInstance.get("/api/faculties");
      setFaculties(response.data as Faculty[]);
    } catch (error) {
      console.error("Failed to fetch faculties:", error);
      showToast("Failed to load faculties", "error");
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    fetchFaculties();
  }, [fetchFaculties]);

  return (
    <div className="space-y-6 p-6">
      {/* Page Header */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
            <p className="text-slate-600 mt-1">
              Manage system settings and configurations
            </p>
          </div>
        </div>
      </div>

      {/* Faculty Management Section */}
      <div className="space-y-4">
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <div className="mb-4">
            <h2 className="text-lg font-semibold text-slate-900 mb-2">
              Faculty Management
            </h2>
            <p className="text-slate-600 text-sm">
              Create, edit, and delete faculty departments. Faculties are used
              to organize users and marking jobs.
            </p>
          </div>

          <FacultyTable
            faculties={faculties}
            loading={loading}
            onRefresh={fetchFaculties}
          />
        </div>
      </div>

      {/* Additional Settings Sections */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* System Information */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">
            System Information
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center py-2 border-b border-slate-100">
              <span className="text-sm text-slate-600">Version</span>
              <span className="text-sm font-medium text-slate-900">1.0.0</span>
            </div>
            <div className="flex justify-between items-center py-2 border-b border-slate-100">
              <span className="text-sm text-slate-600">Environment</span>
              <span className="text-sm font-medium text-slate-900">
                Production
              </span>
            </div>
            <div className="flex justify-between items-center py-2">
              <span className="text-sm text-slate-600">Last Updated</span>
              <span className="text-sm font-medium text-slate-900">
                {new Date().toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-6">
          <h3 className="text-lg font-semibold text-slate-900 mb-4">
            Quick Actions
          </h3>
          <div className="space-y-3">
            <button className="w-full text-left p-3 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors">
              <div className="font-medium text-slate-900">Export Data</div>
              <div className="text-sm text-slate-600">Download system data</div>
            </button>
            <button className="w-full text-left p-3 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors">
              <div className="font-medium text-slate-900">System Logs</div>
              <div className="text-sm text-slate-600">View system activity</div>
            </button>
            <button className="w-full text-left p-3 rounded-lg border border-slate-200 hover:bg-slate-50 transition-colors">
              <div className="font-medium text-slate-900">Backup</div>
              <div className="text-sm text-slate-600">Create system backup</div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
