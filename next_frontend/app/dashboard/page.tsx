"use client";

import React, { useState, useEffect } from "react";
import axiosInstance from "@/utils/axiosclient";
import {
  WelcomeSection,
  StatsCards,
  RecentMarkingJobs,
  RecentTemplates,
  ConfigTypeComparison,
  UserActivities,
  LoadingState,
  ErrorState,
} from "./components";

// Type definitions
interface DashboardStats {
  user_name: string;
  key_stats: {
    total_users: number;
    active_templates: number;
    completed_marking_jobs: number;
    completion_rate: number;
  };
  recent_marking_jobs: Array<{
    id: number;
    name: string;
    status: string;
    template_name: string;
    created_at: string;
    total_answer_sheets?: number;
    processed_answer_sheets?: number;
    failed_answer_sheets?: number;
    progress_percentage: number;
  }>;
  recent_templates: Array<{
    id: number;
    name: string;
    num_questions: number;
    config_type: string;
    status: string;
    created_at: string;
  }>;
  config_type_comparison: Array<{
    config_type: string;
    template_count: number;
    marking_job_count: number;
    completion_rate: number;
    avg_completion_time_seconds: number | null;
    completed_jobs: number;
    failed_jobs: number;
  }>;
  user_activities: Array<{
    activity_type: string;
    description: string;
    related_id: number;
    timestamp: string;
  }>;
}

export default function Dashboard() {
  const [dashboardData, setDashboardData] = useState<DashboardStats | null>(
    null
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [welcomeVisible, setWelcomeVisible] = useState(false);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  useEffect(() => {
    // Trigger welcome animation after data loads
    if (dashboardData) {
      setTimeout(() => setWelcomeVisible(true), 100);
    }
  }, [dashboardData]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      console.log("Fetching dashboard stats for user_id=1");

      const response = await axiosInstance.get(
        "/api/dashboard/stats"
      );

      console.log("Response status:", response.status);
      console.log("Response data:", response.data);
      setDashboardData(response.data as DashboardStats);
      setError(null);
    } catch (err: unknown) {
      const errorMessage =
        err instanceof Error ? err.message : "An error occurred";
      setError(`Failed to fetch dashboard data: ${errorMessage}`);
      console.error("Error fetching dashboard data:", err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingState />;
  }

  if (error || !dashboardData) {
    return (
      <ErrorState
        error={error || "No data available"}
        onRetry={fetchDashboardData}
      />
    );
  }

  return (
    <div className="space-y-8 p-6">
      {/* Welcome Section */}
      <WelcomeSection
        userName={dashboardData.user_name}
        isVisible={welcomeVisible}
      />

      {/* Stats Cards */}
      <StatsCards
        totalUsers={dashboardData.key_stats.total_users}
        activeTemplates={dashboardData.key_stats.active_templates}
        completedJobs={dashboardData.key_stats.completed_marking_jobs}
        completionRate={dashboardData.key_stats.completion_rate}
        isVisible={welcomeVisible}
      />

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
        {/* Recent Marking Jobs - Takes 2 columns */}
        <div className="lg:col-span-2">
          <RecentMarkingJobs
            jobs={dashboardData.recent_marking_jobs}
            isVisible={welcomeVisible}
          />
        </div>

        {/* Recent Templates */}
        <div>
          <RecentTemplates
            templates={dashboardData.recent_templates}
            isVisible={welcomeVisible}
          />
        </div>
      </div>

      {/* Config Type Comparison & User Activities */}
      <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
        {/* Config Type Comparison */}
        <ConfigTypeComparison
          comparisons={dashboardData.config_type_comparison}
          isVisible={welcomeVisible}
        />

        {/* User Activities */}
        <UserActivities
          activities={dashboardData.user_activities}
          isVisible={welcomeVisible}
        />
      </div>
    </div>
  );
}
