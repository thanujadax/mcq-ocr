"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faExclamationTriangle,
  faEnvelope,
  faUser,
  faBuilding,
  faRefresh,
} from "@fortawesome/free-solid-svg-icons";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/UI/Button";
import axiosInstance from "@/utils/axiosclient";

interface FacultyAdmin {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
}

interface Faculty {
  name: string;
}

export default function NotVerified() {
  const { user, signOut, refreshUser } = useAuth();
  const [userData, setUserData] = useState<{
    user: typeof user;
    faculty_name: string | null;
  }>({
    user: user,
    faculty_name: null,
  });
  const [facultyAdmins, setFacultyAdmins] = useState<FacultyAdmin[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchFacultyAdmins = async () => {
      if (!user) return;
      try {
        const [facultyResponse, adminsResponse] = await Promise.all([
          axiosInstance.get<Faculty>(`/api/faculties/${user.faculty_id}`),
          axiosInstance.get<FacultyAdmin[]>(
            `/api/faculties/${user.faculty_id}/admins`
          ),
        ]);
        setUserData({
          user: user,
          faculty_name: facultyResponse.data.name,
        });
        setUserData({
          user: user,
          faculty_name: facultyResponse.data["name"] as string,
        });
        setFacultyAdmins(adminsResponse.data as FacultyAdmin[]);
      } catch (err) {
        setError("Failed to load faculty administrators.");
        console.error("Error fetching faculty admins:", err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchFacultyAdmins();
  }, [setUserData, user, user?.faculty_id]);

  const handleRefreshStatus = async () => {
    setIsLoading(true);
    try {
      await refreshUser();
    } catch {
      setError("Failed to refresh status. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = () => {
    signOut();
    router.push("/auth/signin");
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
        <div className="sm:mx-auto sm:w-full sm:max-w-md">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-2xl">
        <div className="bg-yellow-500 mx-auto flex h-12 w-12 items-center justify-center rounded-full">
          <FontAwesomeIcon
            icon={faExclamationTriangle}
            className="h-8 w-8 text-white"
          />
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
          Account Verification Required
        </h2>
        <p className="mt-2 text-center text-sm text-gray-600">
          Your account is pending verification by a faculty administrator
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-2xl">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {error && (
            <div className="mb-6 bg-red-50 p-4 rounded-md">
              <div className="flex">
                <div className="flex-shrink-0">
                  <FontAwesomeIcon
                    icon={faExclamationTriangle}
                    className="h-5 w-5 text-red-400"
                  />
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">Error</h3>
                  <p className="text-sm text-red-700 mt-1">{error}</p>
                </div>
              </div>
            </div>
          )}

          {/* User Information Card */}
          <div className="mb-8 bg-gray-50 p-6 rounded-lg">
            <h3 className="text-lg font-medium text-gray-900 mb-4">
              Your Account Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center">
                <FontAwesomeIcon
                  icon={faUser}
                  className="h-5 w-5 text-gray-400 mr-3"
                />
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {userData.user?.first_name} {userData.user?.last_name}
                  </p>
                  <p className="text-sm text-gray-500">Full Name</p>
                </div>
              </div>
              <div className="flex items-center">
                <FontAwesomeIcon
                  icon={faEnvelope}
                  className="h-5 w-5 text-gray-400 mr-3"
                />
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {userData.user?.email}
                  </p>
                  <p className="text-sm text-gray-500">Email Address</p>
                </div>
              </div>
              <div className="flex items-center">
                <FontAwesomeIcon
                  icon={faBuilding}
                  className="h-5 w-5 text-gray-400 mr-3"
                />
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    {userData.faculty_name ||
                      `Faculty ID: ${userData.user?.faculty_id}`}
                  </p>
                  <p className="text-sm text-gray-500">Faculty</p>
                </div>
              </div>
              <div className="flex items-center">
                <div className="h-5 w-5 mr-3 flex items-center justify-center">
                  <div className="h-3 w-3 bg-yellow-400 rounded-full"></div>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    Pending Verification
                  </p>
                  <p className="text-sm text-gray-500">Status</p>
                </div>
              </div>
            </div>
          </div>

          {/* Information Card */}
          <div className="mb-8 bg-blue-50 p-6 rounded-lg">
            <h3 className="text-lg font-medium text-blue-900 mb-2">
              What happens next?
            </h3>
            <ul className="text-sm text-blue-700 space-y-2">
              <li className="flex items-start">
                <span className="h-5 w-5 text-blue-500 mr-2 mt-0.5">•</span>A
                faculty administrator from your faculty will review your account
                and verify.
              </li>
              <li className="flex items-start">
                <span className="h-5 w-5 text-blue-500 mr-2 mt-0.5">•</span>
                After verification, you can access all system features
              </li>
            </ul>
          </div>

          {/* Faculty Administrators */}
          {facultyAdmins.length > 0 && (
            <div className="mb-8">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                Faculty Administrators
              </h3>
              <p className="text-sm text-gray-600 mb-4">
                If you need urgent access, you can contact any of the following
                faculty administrators:
              </p>
              <div className="space-y-3">
                {facultyAdmins.map((admin) => (
                  <div
                    key={admin.id}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                  >
                    <div className="flex items-center">
                      <div className="h-10 w-10 bg-blue-600 rounded-full flex items-center justify-center">
                        <FontAwesomeIcon
                          icon={faUser}
                          className="h-5 w-5 text-white"
                        />
                      </div>
                      <div className="ml-4">
                        <p className="text-sm font-medium text-gray-900">
                          {admin.first_name} {admin.last_name}
                        </p>
                        <p className="text-sm text-gray-500">
                          Faculty Administrator
                        </p>
                      </div>
                    </div>
                    <a
                      href={`mailto:${admin.email}`}
                      className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                    >
                      <FontAwesomeIcon
                        icon={faEnvelope}
                        className="h-4 w-4 mr-2"
                      />
                      Email
                    </a>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4">
            <Button
              variant="primary"
              onClick={handleRefreshStatus}
              isLoading={isLoading}
              className="flex-1"
            >
              <FontAwesomeIcon icon={faRefresh} className="h-4 w-4 mr-2" />
              Refresh Status
            </Button>
            <Button
              variant="outline"
              onClick={handleSignOut}
              className="flex-1"
            >
              Sign Out
            </Button>
          </div>

          <div className="mt-6 text-center">
            <p className="text-xs text-gray-500">
              If you believe this is an error, please contact your system
              administrator.
            </p>
          </div>
        </div>
      </div>

      {/* Background pattern */}
      <div className="fixed inset-0 -z-10 overflow-hidden">
        <svg
          className="absolute left-full transform translate-y-1/4 -translate-x-1/4 lg:translate-x-1/2 xl:-translate-y-1/2 opacity-20"
          width="404"
          height="784"
          fill="none"
          viewBox="0 0 404 784"
        >
          <defs>
            <pattern
              id="pattern-squares"
              x="0"
              y="0"
              width="20"
              height="20"
              patternUnits="userSpaceOnUse"
            >
              <rect x="0" y="0" width="4" height="4" fill="currentColor" />
            </pattern>
          </defs>
          <rect width="404" height="784" fill="url(#pattern-squares)" />
        </svg>
      </div>
    </div>
  );
}
