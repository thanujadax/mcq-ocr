"use client";

import { useState } from "react";
import { Card } from "../../components/UI/Card";
import { Button } from "../../components/UI/Button";
import { Select } from "../../components/UI/Select";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faChartBar,
  faChartPie,
  faChartLine,
  faFileText,
  faDownload,
} from "@fortawesome/free-solid-svg-icons";
export default function Reports() {
  const [reportType, setReportType] = useState("marking-progress");
  const [timeRange, setTimeRange] = useState("last-30-days");
  const renderReport = () => {
    switch (reportType) {
      case "marking-progress":
        return (
          <Card
            title="Marking Progress"
            subtitle={`Showing progress over ${getTimeRangeLabel(timeRange)}`}
            className="h-96"
          >
            <div className="h-full flex items-center justify-center">
              <div className="text-center">
                <FontAwesomeIcon
                  icon={faChartBar}
                  className="mx-auto h-12 w-12 text-gray-400"
                />
                <h3 className="mt-2 text-sm font-medium text-gray-900">
                  Marking Progress Chart
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  This would display a chart showing marking progress over time.
                </p>
              </div>
            </div>
          </Card>
        );
      case "completion-rates":
        return (
          <Card
            title="Completion Rates"
            subtitle={`Showing completion rates over ${getTimeRangeLabel(
              timeRange
            )}`}
            className="h-96"
          >
            <div className="h-full flex items-center justify-center">
              <div className="text-center">
                <FontAwesomeIcon
                  icon={faChartPie}
                  className="mx-auto h-12 w-12 text-gray-400"
                />
                <h3 className="mt-2 text-sm font-medium text-gray-900">
                  Completion Rates Chart
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  This would display a chart showing completion rates by
                  department or user.
                </p>
              </div>
            </div>
          </Card>
        );
      case "user-activity":
        return (
          <Card
            title="User Activity"
            subtitle={`Showing user activity over ${getTimeRangeLabel(
              timeRange
            )}`}
            className="h-96"
          >
            <div className="h-full flex items-center justify-center">
              <div className="text-center">
                <FontAwesomeIcon
                  icon={faChartLine}
                  className="mx-auto h-12 w-12 text-gray-400"
                />
                <h3 className="mt-2 text-sm font-medium text-gray-900">
                  User Activity Chart
                </h3>
                <p className="mt-1 text-sm text-gray-500">
                  This would display a chart showing user activity trends.
                </p>
              </div>
            </div>
          </Card>
        );
      default:
        return null;
    }
  };
  const getTimeRangeLabel = (range: string) => {
    switch (range) {
      case "last-7-days":
        return "the last 7 days";
      case "last-30-days":
        return "the last 30 days";
      case "last-90-days":
        return "the last 90 days";
      case "last-year":
        return "the last year";
      default:
        return "the selected time range";
    }
  };
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-900">Reports</h2>
        <Button
          variant="outline"
          icon={<FontAwesomeIcon icon={faDownload} className="h-4 w-4" />}
        >
          Export Data
        </Button>
      </div>
      <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-4">
        <div className="w-full sm:w-1/2">
          <Select
            label="Report Type"
            value={reportType}
            onChange={(e) => setReportType(e.target.value)}
            options={[
              {
                value: "marking-progress",
                label: "Marking Progress",
              },
              {
                value: "completion-rates",
                label: "Completion Rates",
              },
              {
                value: "user-activity",
                label: "User Activity",
              },
            ]}
          />
        </div>
        <div className="w-full sm:w-1/2">
          <Select
            label="Time Range"
            value={timeRange}
            onChange={(e) => setTimeRange(e.target.value)}
            options={[
              {
                value: "last-7-days",
                label: "Last 7 Days",
              },
              {
                value: "last-30-days",
                label: "Last 30 Days",
              },
              {
                value: "last-90-days",
                label: "Last 90 Days",
              },
              {
                value: "last-year",
                label: "Last Year",
              },
            ]}
          />
        </div>
      </div>
      <div>{renderReport()}</div>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        <Card title="Report Summary" subtitle="Key metrics and insights">
          <div className="space-y-4">
            <div>
              <h4 className="text-sm font-medium text-gray-900">
                Total Marking Jobs
              </h4>
              <p className="mt-1 text-2xl font-semibold text-gray-700">876</p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-900">
                Average Completion Time
              </h4>
              <p className="mt-1 text-2xl font-semibold text-gray-700">
                3.2 days
              </p>
            </div>
            <div>
              <h4 className="text-sm font-medium text-gray-900">
                On-Time Completion Rate
              </h4>
              <p className="mt-1 text-2xl font-semibold text-green-600">94%</p>
            </div>
          </div>
        </Card>
        <Card title="Saved Reports" subtitle="Access your saved reports">
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
              <div className="flex items-center">
                <FontAwesomeIcon
                  icon={faFileText}
                  className="h-5 w-5 text-gray-400 mr-2"
                />
                <span className="text-sm font-medium text-gray-700">
                  Quarterly Marking Report
                </span>
              </div>
              <Button
                variant="outline"
                size="sm"
                icon={<FontAwesomeIcon icon={faDownload} className="h-4 w-4" />}
              >
                Download
              </Button>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
              <div className="flex items-center">
                <FontAwesomeIcon
                  icon={faFileText}
                  className="h-5 w-5 text-gray-400 mr-2"
                />
                <span className="text-sm font-medium text-gray-700">
                  Department Performance
                </span>
              </div>
              <Button
                variant="outline"
                size="sm"
                icon={<FontAwesomeIcon icon={faDownload} className="h-4 w-4" />}
              >
                Download
              </Button>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 rounded-md">
              <div className="flex items-center">
                <FontAwesomeIcon
                  icon={faFileText}
                  className="h-5 w-5 text-gray-400 mr-2"
                />
                <span className="text-sm font-medium text-gray-700">
                  User Activity Summary
                </span>
              </div>
              <Button
                variant="outline"
                size="sm"
                icon={<FontAwesomeIcon icon={faDownload} className="h-4 w-4" />}
              >
                Download
              </Button>
            </div>
          </div>
          <div className="mt-4">
            <Button
              variant="outline"
              fullWidth
              icon={<div className="h-4 w-4" />}
            >
              Generate New Report
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
