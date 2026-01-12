"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { VerificationModal } from "../../components/Modals/VerificationModal";
import { useToast } from "../../hooks/useToast";
import {
  PageHeader,
  DescriptionCard,
  FiltersSection,
  JobsTable,
  ResultsModal,
} from "./components";
import { MarkingJobBasic } from "./components/types";

export default function MarkingJobs() {
  const router = useRouter();
  const [selectedJob, setSelectedJob] = useState<number | null>(null);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isResultModalOpen, setIsResultModalOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedJobData, setSelectedJobData] = useState<MarkingJobBasic | null>(
    null
  );

  const BACKEND_URL = process.env.NEXT_PUBLIC_BACKEND_URL || "http://localhost:8000";
  const [loading, setLoading] = useState(true);
  const [markingJobs, setMarkingJobs] = useState<MarkingJobBasic[]>([]);
  const { showToast } = useToast();

  const filteredJobs =
    statusFilter === "all"
      ? markingJobs
      : markingJobs.filter((job) => job.status === statusFilter);

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
    setSelectedJobData(job);
    router.push(`/marking-jobs/results?markingJobId=${job.id}`);
  };

  const handleDownloadResults = (format: "csv" | "pdf") => {
    console.log(
      `Downloading results in ${format} format for job:`,
      selectedJobData?.id
    );
    showToast(
      `Results downloaded successfully in ${format.toUpperCase()} format`,
      "success"
    );
  };

  useEffect(() => {
    const fetchMarkingJobs = async () => {
      setLoading(true);
      const response = await fetch(`${BACKEND_URL}/api/markings`);
      const markingJobs: MarkingJobBasic[] = await response.json();
      setMarkingJobs(markingJobs);
      setLoading(false);
    };
    fetchMarkingJobs();
  }, []);

  return (
    <>
      <PageHeader onCreateNew={() => router.push("marking-jobs/create")} />

      <DescriptionCard />

      <FiltersSection
        totalJobs={markingJobs.length}
        statusFilter={statusFilter}
        onStatusFilterChange={setStatusFilter}
      />

      {loading ? <div>Loading...</div> : <JobsTable
        jobs={filteredJobs}
        onStopJob={handleStopJob}
        onEditJob={handleEditJob}
        onViewResults={handleViewResults}
        onDeleteJob={confirmDelete}
      />}

      <VerificationModal
        isOpen={isDeleteModalOpen}
        onClose={() => setIsDeleteModalOpen(false)}
        onConfirm={handleDeleteJob}
        title="Delete Marking Job"
        message="Are you sure you want to delete this marking job? This action cannot be undone."
        confirmText="Delete"
        type="warning"
      />

      <ResultsModal
        isOpen={isResultModalOpen}
        onClose={() => setIsResultModalOpen(false)}
        job={selectedJobData}
        onDownloadResults={handleDownloadResults}
      />
    </>
  );
}
