import React from "react";
import { Table, TableColumn } from "../../../components/UI/Table";
import { MarkingJobBasic } from "./types";
import { StatusBadge } from "./StatusBadge";
import { ProgressBar } from "./ProgressBar";
import { JobActions } from "./JobActions";

interface JobsTableProps {
  jobs: MarkingJobBasic[];
  onStopJob: (jobId: number) => void;
  onEditJob: (job: MarkingJobBasic) => void;
  onViewResults: (job: MarkingJobBasic) => void;
  onDeleteJob: (jobId: number) => void;
}

export function JobsTable({
  jobs,
  onStopJob,
  onEditJob,
  onViewResults,
  onDeleteJob,
}: JobsTableProps) {
  const columns: TableColumn<MarkingJobBasic>[] = [
    { header: "Name", accessor: "name", sortable: true },
    { header: "Template", accessor: "template_name", sortable: true },
    { header: "Priority", accessor: "priority", sortable: true },
    {
      header: "Created",
      accessor: (job: MarkingJobBasic) => {
        const date = new Date(job.created_at);
        return date.toLocaleString();
      },
      sortable: true,
    },
    {
      header: "Status",
      accessor: (job: MarkingJobBasic) => <StatusBadge status={job.status} />,
      sortable: true,
    },
    {
      header: "Progress",
      accessor: (job: MarkingJobBasic) => <ProgressBar job={job} />,
    },
    {
      header: "Actions",
      accessor: (job: MarkingJobBasic) => (
        <JobActions
          job={job}
          onStop={onStopJob}
          onEdit={onEditJob}
          onViewResults={onViewResults}
          onDelete={onDeleteJob}
        />
      ),
    },
  ];

  return (
    <div className="bg-white shadow rounded-lg overflow-hidden">
      <Table
        columns={columns}
        data={jobs}
        keyField="id"
        pagination={true}
        itemsPerPage={5}
        searchable={true}
        searchPlaceholder="Search marking jobs..."
        emptyMessage="No marking jobs found"
      />
    </div>
  );
}
