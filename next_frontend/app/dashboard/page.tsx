import React from "react";
import { Card } from "../../components/UI/Card";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faArrowUp,
  faUsers,
  faClipboardCheck,
  faFileText,
  faExclamationTriangle,
  faCheckCircle,
} from "@fortawesome/free-solid-svg-icons";

export default function Dashboard() {
  const stats = [
    {
      name: "Total Users",
      value: "2,543",
      change: "+12.5%",
      trend: "up",
      icon: (
        <FontAwesomeIcon icon={faUsers} className="h-6 w-6 text-blue-600" />
      ),
    },
    {
      name: "Active Templates",
      value: "45",
      change: "+3.2%",
      trend: "up",
      icon: (
        <FontAwesomeIcon icon={faFileText} className="h-6 w-6 text-green-600" />
      ),
    },
    {
      name: "Marking Jobs",
      value: "876",
      change: "+28.4%",
      trend: "up",
      icon: (
        <FontAwesomeIcon
          icon={faClipboardCheck}
          className="h-6 w-6 text-purple-600"
        />
      ),
    },
    {
      name: "Completion Rate",
      value: "92%",
      change: "+5.3%",
      trend: "up",
      icon: (
        <FontAwesomeIcon
          icon={faCheckCircle}
          className="h-6 w-6 text-yellow-600"
        />
      ),
    },
  ];

  const recentJobs = [
    {
      id: 1,
      name: "Math Quiz - Grade 10",
      status: "completed",
      date: "2023-04-15",
      submissions: 32,
    },
    {
      id: 2,
      name: "English Essay - Grade 11",
      status: "in-progress",
      date: "2023-04-14",
      submissions: 28,
    },
    {
      id: 3,
      name: "Science Test - Grade 9",
      status: "completed",
      date: "2023-04-12",
      submissions: 45,
    },
    {
      id: 4,
      name: "History Assignment - Grade 12",
      status: "in-progress",
      date: "2023-04-10",
      submissions: 19,
    },
    {
      id: 5,
      name: "Geography Quiz - Grade 10",
      status: "pending",
      date: "2023-04-09",
      submissions: 0,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, index) => (
          <Card key={index} className="hover:shadow-md transition-shadow">
            <div className="flex items-center">
              <div className="flex-shrink-0 rounded-md p-3 bg-gray-50">
                {stat.icon}
              </div>
              <div className="ml-5 w-0 flex-1">
                <dl>
                  <dt className="text-sm font-medium text-gray-500 truncate">
                    {stat.name}
                  </dt>
                  <dd className="flex items-baseline">
                    <div className="text-2xl font-semibold text-gray-900">
                      {stat.value}
                    </div>
                    <div
                      className={`ml-2 flex items-baseline text-sm font-semibold ${
                        stat.trend === "up" ? "text-green-600" : "text-red-600"
                      }`}
                    >
                      {stat.trend === "up" ? (
                        <FontAwesomeIcon
                          icon={faArrowUp}
                          className="self-center flex-shrink-0 h-4 w-4 text-green-500"
                        />
                      ) : (
                        <FontAwesomeIcon
                          icon={faArrowUp}
                          className="self-center flex-shrink-0 h-4 w-4 text-red-500 transform rotate-180"
                        />
                      )}
                      <span className="sr-only">
                        {stat.trend === "up" ? "Increased" : "Decreased"} by
                      </span>
                      {stat.change}
                    </div>
                  </dd>
                </dl>
              </div>
            </div>
          </Card>
        ))}
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card title="Recent Marking Jobs" subtitle="Last 5 marking jobs">
          <div className="overflow-hidden">
            <ul className="divide-y divide-gray-200">
              {recentJobs.map((job) => (
                <li
                  key={job.id}
                  className="px-2 py-3 flex items-center justify-between"
                >
                  <div className="flex items-center">
                    <div
                      className={`
                      flex-shrink-0 h-3 w-3 rounded-full mr-2
                      ${
                        job.status === "completed"
                          ? "bg-green-500"
                          : job.status === "in-progress"
                          ? "bg-yellow-500"
                          : "bg-gray-300"
                      }
                    `}
                    ></div>
                    <p className="text-sm font-medium text-gray-900">
                      {job.name}
                    </p>
                  </div>
                  <div className="flex items-center">
                    <span className="text-sm text-gray-500 mr-4">
                      {job.submissions} submissions
                    </span>
                    <span className="text-xs text-gray-400">{job.date}</span>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </Card>
        <Card title="System Status" subtitle="Current system performance">
          <div className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-1">
                <div className="text-sm font-medium text-gray-700">
                  CPU Usage
                </div>
                <div className="text-sm font-medium text-gray-700">24%</div>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-600 h-2 rounded-full"
                  style={{ width: "24%" }}
                ></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between items-center mb-1">
                <div className="text-sm font-medium text-gray-700">
                  Memory Usage
                </div>
                <div className="text-sm font-medium text-gray-700">62%</div>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-yellow-500 h-2 rounded-full"
                  style={{ width: "62%" }}
                ></div>
              </div>
            </div>
            <div>
              <div className="flex justify-between items-center mb-1">
                <div className="text-sm font-medium text-gray-700">
                  Storage Usage
                </div>
                <div className="text-sm font-medium text-gray-700">42%</div>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-green-500 h-2 rounded-full"
                  style={{ width: "42%" }}
                ></div>
              </div>
            </div>
            <div className="pt-2">
              <div className="flex items-center text-sm text-green-600">
                <FontAwesomeIcon
                  icon={faCheckCircle}
                  className="h-5 w-5 mr-1"
                />
                All systems operational
              </div>
            </div>
          </div>
        </Card>
      </div>
      <Card
        title="Alerts & Notifications"
        subtitle="Recent system alerts and notifications"
      >
        <div className="divide-y divide-gray-200">
          <div className="py-3 flex">
            <div className="flex-shrink-0">
              <FontAwesomeIcon
                icon={faExclamationTriangle}
                className="h-5 w-5 text-yellow-400"
              />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-gray-900">
                System Maintenance
              </h3>
              <p className="text-sm text-gray-500">
                Scheduled maintenance on April 20, 2023 from 2:00 AM to 4:00 AM
                UTC.
              </p>
            </div>
          </div>
          <div className="py-3 flex">
            <div className="flex-shrink-0">
              <FontAwesomeIcon
                icon={faCheckCircle}
                className="h-5 w-5 text-green-500"
              />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-gray-900">
                Backup Completed
              </h3>
              <p className="text-sm text-gray-500">
                Daily backup completed successfully at 1:00 AM UTC.
              </p>
            </div>
          </div>
          <div className="py-3 flex">
            <div className="flex-shrink-0">
              <FontAwesomeIcon
                icon={faExclamationTriangle}
                className="h-5 w-5 text-blue-500"
              />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-gray-900">
                New Feature Available
              </h3>
              <p className="text-sm text-gray-500">
                Batch marking feature is now available. Check the documentation
                for more information.
              </p>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
