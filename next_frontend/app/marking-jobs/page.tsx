"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { VerificationModal } from "../../components/Modals/VerificationModal";
import { useToast } from "../../hooks/useToast";
import axiosInstance from "@/utils/axiosclient";
import { createAuthenticatedWebSocket } from "@/utils/websocketClient";

import { MarkingJobBasic, MarkingJobStatus } from "./types/types";
import { PageHeader } from "./components/PageHeader";
import { StatsOverview } from "./components/StatsOverview";
import { FiltersSection } from "./components/FiltersSection";
import { JobsTable } from "./components/EnhancedJobsTable";
import { RecentActivity } from "./components/RecentActivity";

export default function MarkingJobs() {
  const router = useRouter();
  const [selectedJob, setSelectedJob] = useState<number | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(5);

  const [loading, setLoading] = useState(true);
  const [markingJobs, setMarkingJobs] = useState<MarkingJobBasic[]>([]);
  const { showToast } = useToast();

  const filteredJobs = markingJobs.filter((job) => {
    // Filter by status
    const statusMatch = statusFilter === "all" || job.status === statusFilter;

    // Filter by search query (search in name and template_name)
    const searchMatch =
      searchQuery.trim() === "" ||
      job.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.template_name.toLowerCase().includes(searchQuery.toLowerCase());

    return statusMatch && searchMatch;
  });

  // Pagination calculations
  const totalPages = Math.ceil(filteredJobs.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedJobs = filteredJobs.slice(startIndex, endIndex);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleItemsPerPageChange = (newItemsPerPage: number) => {
    setItemsPerPage(newItemsPerPage);
    setCurrentPage(1); // Reset to first page when changing items per page
  };

  const handleStatusFilterChange = (status: string) => {
    setStatusFilter(status);
    setCurrentPage(1); // Reset to first page when changing filter
  };

  const handleSearchChange = (query: string) => {
    setSearchQuery(query);
    setCurrentPage(1); // Reset to first page when searching
  };

  const handleDeleteJob = () => {
    console.log(`Deleting job with ID: ${selectedJob}`);
    showToast("Job deleted successfully", "success");
    setIsDeleteModalOpen(false);
    setSelectedJob(null);
  };

  const confirmDelete = (id: number) => {
    setSelectedJob(id);
    setIsDeleteModalOpen(true);
  };

  const handleStopJob = (jobId: number) => {
    console.log(`Pausing job with ID: ${jobId}`);
    showToast("Job paused successfully", "info");
  };

  const handleEditJob = (job: MarkingJobBasic) => {
    router.push(`/marking-jobs/create?markingJobId=${job.id}`);
  };

  const handleViewResults = (job: MarkingJobBasic) => {
    router.push(`/marking-jobs/results/${job.id}`);
  };

  useEffect(() => {
    const progressWebsocket = async (markingJobIds: number[]) => {
      try {
        const ws = await createAuthenticatedWebSocket(
          `/api/markings/progress`,
          {
            initialMessage: { marking_job_ids: markingJobIds },
            onMessage: (event: MessageEvent) => {
              const data = JSON.parse(event.data);
              if (data.status === "connected") {
                console.log("WebSocket connection established");
                return;
              }
              if (data.status === "error") {
                console.error("WebSocket error:", data.message);
                ws.close();
                return;
              }
              if (data.status === "processing") {
                const jobId = data.marking_job_id;
                const progress = data.progress;
                console.log("Processing update:", data);
                setMarkingJobs((prevJobs) =>
                  prevJobs.map((job) =>
                    job.id === jobId
                      ? {
                          ...job,
                          status: MarkingJobStatus.PROCESSING,
                          processed_answer_sheets: progress.completed,
                          total_answer_sheets: progress.total,
                        }
                      : job
                  )
                );
              }
              if (data.status === "completed") {
                const jobId = data.marking_job_id;
                console.log("Completed update:", data);
                setMarkingJobs((prevJobs) =>
                  prevJobs.map((job) =>
                    job.id === jobId
                      ? {
                          ...job,
                          status: MarkingJobStatus.COMPLETED,
                        }
                      : job
                  )
                );
              }
            },
            onError: (error: Event) => {
              console.error("WebSocket error:", error);
              ws.close();
            },
            onClose: () => {
              console.log("WebSocket connection closed");
            },
          }
        );

        await ws.connect();
      } catch (error) {
        console.error("Failed to create WebSocket connection:", error);
      }
    };

    const fetchMarkingJobs = async () => {
      setLoading(true);
      try {
        const response = await axiosInstance.get("/api/markings");
        const markingJobs: MarkingJobBasic[] =
          response.data as MarkingJobBasic[];
        setMarkingJobs(markingJobs);
        progressWebsocket(
          markingJobs
            .map((job) =>
              job.status === MarkingJobStatus.PROCESSING ||
              job.status === MarkingJobStatus.QUEUED
                ? job.id
                : null
            )
            .filter((id) => id !== null)
        );
      } catch (error) {
        console.error("Failed to fetch marking jobs:", error);
        showToast("Failed to load marking jobs", "error");
      } finally {
        setLoading(false);
      }
    };
    fetchMarkingJobs();
  }, [showToast]);

  return (
    <div className="space-y-6 p-6">
      <PageHeader onCreateNew={() => router.push("marking-jobs/create")} />

      <StatsOverview jobs={markingJobs} />

      <FiltersSection
        totalJobs={markingJobs.length}
        statusFilter={statusFilter}
        searchQuery={searchQuery}
        onStatusFilterChange={handleStatusFilterChange}
        onSearchChange={handleSearchChange}
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          {loading ? (
            <div className="bg-white rounded-lg border border-gray-100 p-12 text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
              <p className="mt-4 text-gray-500">Loading marking jobs...</p>
            </div>
          ) : (
            <JobsTable
              jobs={paginatedJobs}
              currentPage={currentPage}
              totalPages={totalPages}
              itemsPerPage={itemsPerPage}
              totalItems={filteredJobs.length}
              onPageChange={handlePageChange}
              onItemsPerPageChange={handleItemsPerPageChange}
              onStopJob={handleStopJob}
              onEditJob={handleEditJob}
              onViewResults={handleViewResults}
              onDeleteJob={confirmDelete}
            />
          )}
        </div>

        <div>
          <RecentActivity jobs={markingJobs} />
        </div>
      </div>

      <VerificationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteJob}
        title="Delete Marking Job"
        message="Are you sure you want to delete this marking job? This action cannot be undone."
        confirmText="Delete"
        type="warning"
      />
    </div>
  );
}
