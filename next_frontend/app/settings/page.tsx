"use client";

import { useState } from "react";
import Image from "next/image";
import { Card } from "../../components/UI/Card";
import { Input } from "../../components/UI/Input";
import { Button } from "../../components/UI/Button";
import { Select } from "../../components/UI/Select";
import { FileUpload } from "../../components/UI/FileUpload";
import { VerificationModal } from "../../components/Modals/VerificationModal";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faUser,
  faSave,
  faEnvelope,
  faGlobe,
  faBell,
  faShield,
  faClock,
  faTrash,
} from "@fortawesome/free-solid-svg-icons";
export default function Settings() {
  const [activeTab, setActiveTab] = useState("profile");
  const [isResetModalOpen, setIsResetModalOpen] = useState(false);
  const [isDeleteAccountModalOpen, setIsDeleteAccountModalOpen] =
    useState(false);
  const [profile, setProfile] = useState({
    name: "Admin User",
    email: "admin@example.com",
    phone: "+1 (555) 123-4567",
    title: "Administrator",
    department: "IT",
    bio: "System administrator responsible for managing the marking application.",
  });
  const tabs = [
    {
      id: "profile",
      name: "Profile",
      icon: <FontAwesomeIcon icon={faUser} className="h-5 w-5" />,
    },
    {
      id: "notifications",
      name: "Notifications",
      icon: <FontAwesomeIcon icon={faBell} className="h-5 w-5" />,
    },
    {
      id: "security",
      name: "Security",
      icon: <FontAwesomeIcon icon={faShield} className="h-5 w-5" />,
    },
    {
      id: "preferences",
      name: "Preferences",
      icon: <FontAwesomeIcon icon={faClock} className="h-5 w-5" />,
    },
  ];
  const handleProfileUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real app, this would make an API call to update the profile
    console.log("Updating profile:", profile);
    // Show success message
  };
  const handleResetPassword = () => {
    // In a real app, this would make an API call to reset the password
    console.log("Resetting password");
    setIsResetModalOpen(false);
  };
  const handleDeleteAccount = () => {
    // In a real app, this would make an API call to delete the account
    console.log("Deleting account");
    setIsDeleteAccountModalOpen(false);
  };
  const renderTabContent = () => {
    switch (activeTab) {
      case "profile":
        return (
          <div className="space-y-6">
            <Card
              title="Profile Information"
              subtitle="Update your account profile information"
            >
              <form onSubmit={handleProfileUpdate} className="space-y-6">
                <div className="grid grid-cols-1 gap-y-6 gap-x-4 sm:grid-cols-6">
                  <div className="sm:col-span-3">
                    <Input
                      label="Full Name"
                      value={profile.name}
                      onChange={(e) =>
                        setProfile({
                          ...profile,
                          name: e.target.value,
                        })
                      }
                      required
                    />
                  </div>
                  <div className="sm:col-span-3">
                    <Input
                      label="Email Address"
                      type="email"
                      value={profile.email}
                      onChange={(e) =>
                        setProfile({
                          ...profile,
                          email: e.target.value,
                        })
                      }
                      leftIcon={
                        <FontAwesomeIcon
                          icon={faEnvelope}
                          className="h-5 w-5 text-gray-400"
                        />
                      }
                      required
                    />
                  </div>
                  <div className="sm:col-span-3">
                    <Input
                      label="Phone Number"
                      type="tel"
                      value={profile.phone}
                      onChange={(e) =>
                        setProfile({
                          ...profile,
                          phone: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="sm:col-span-3">
                    <Input
                      label="Job Title"
                      value={profile.title}
                      onChange={(e) =>
                        setProfile({
                          ...profile,
                          title: e.target.value,
                        })
                      }
                    />
                  </div>
                  <div className="sm:col-span-3">
                    <Select
                      label="Department"
                      value={profile.department}
                      onChange={(e) =>
                        setProfile({
                          ...profile,
                          department: e.target.value,
                        })
                      }
                      options={[
                        {
                          value: "IT",
                          label: "IT",
                        },
                        {
                          value: "Math",
                          label: "Mathematics",
                        },
                        {
                          value: "Science",
                          label: "Science",
                        },
                        {
                          value: "English",
                          label: "English",
                        },
                        {
                          value: "History",
                          label: "History",
                        },
                      ]}
                    />
                  </div>
                  <div className="sm:col-span-6">
                    <label
                      htmlFor="bio"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Bio
                    </label>
                    <div className="mt-1">
                      <textarea
                        id="bio"
                        name="bio"
                        rows={4}
                        className="shadow-sm focus:ring-blue-500 focus:border-blue-500 block w-full sm:text-sm border-gray-300 rounded-md"
                        value={profile.bio}
                        onChange={(e) =>
                          setProfile({
                            ...profile,
                            bio: e.target.value,
                          })
                        }
                      />
                    </div>
                    <p className="mt-2 text-sm text-gray-500">
                      Brief description for your profile.
                    </p>
                  </div>
                </div>
                <div>
                  <Button
                    type="submit"
                    variant="primary"
                    icon={<FontAwesomeIcon icon={faSave} className="h-4 w-4" />}
                  >
                    Save Changes
                  </Button>
                </div>
              </form>
            </Card>
            <Card title="Profile Picture" subtitle="Upload a profile picture">
              <div className="flex items-center space-x-6">
                <div className="flex-shrink-0">
                  <div className="relative">
                    <Image
                      className="h-16 w-16 rounded-full"
                      src="https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?ixlib=rb-1.2.1&auto=format&fit=facearea&facepad=2&w=256&h=256&q=80"
                      alt="Profile"
                      width={64}
                      height={64}
                    />
                    <span
                      className="absolute inset-0 shadow-inner rounded-full"
                      aria-hidden="true"
                    />
                  </div>
                </div>
                <div className="flex-1">
                  <FileUpload
                    accept="image/*"
                    maxFiles={1}
                    maxSize={2 * 1024 * 1024} // 2MB
                    hint="Recommended size: 256x256px. Max file size: 2MB."
                  />
                </div>
              </div>
            </Card>
          </div>
        );
      case "notifications":
        return (
          <Card
            title="Notification Settings"
            subtitle="Manage how you receive notifications"
          >
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900">
                  Email Notifications
                </h3>
                <div className="mt-4 space-y-4">
                  <div className="flex items-start">
                    <div className="flex items-center h-5">
                      <input
                        id="email-marking-jobs"
                        name="email-marking-jobs"
                        type="checkbox"
                        className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded"
                        defaultChecked
                      />
                    </div>
                    <div className="ml-3 text-sm">
                      <label
                        htmlFor="email-marking-jobs"
                        className="font-medium text-gray-700"
                      >
                        Marking Jobs
                      </label>
                      <p className="text-gray-500">
                        Get notified when a new marking job is assigned to you.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <div className="flex items-center h-5">
                      <input
                        id="email-submissions"
                        name="email-submissions"
                        type="checkbox"
                        className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded"
                        defaultChecked
                      />
                    </div>
                    <div className="ml-3 text-sm">
                      <label
                        htmlFor="email-submissions"
                        className="font-medium text-gray-700"
                      >
                        Submissions
                      </label>
                      <p className="text-gray-500">
                        Get notified when new submissions are added to your
                        marking jobs.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <div className="flex items-center h-5">
                      <input
                        id="email-deadlines"
                        name="email-deadlines"
                        type="checkbox"
                        className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded"
                        defaultChecked
                      />
                    </div>
                    <div className="ml-3 text-sm">
                      <label
                        htmlFor="email-deadlines"
                        className="font-medium text-gray-700"
                      >
                        Deadline Reminders
                      </label>
                      <p className="text-gray-500">
                        Get reminders about upcoming deadlines for marking jobs.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <div className="flex items-center h-5">
                      <input
                        id="email-system"
                        name="email-system"
                        type="checkbox"
                        className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded"
                      />
                    </div>
                    <div className="ml-3 text-sm">
                      <label
                        htmlFor="email-system"
                        className="font-medium text-gray-700"
                      >
                        System Updates
                      </label>
                      <p className="text-gray-500">
                        Get notified about system updates and maintenance.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="pt-6 border-t border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">
                  In-App Notifications
                </h3>
                <div className="mt-4 space-y-4">
                  <div className="flex items-start">
                    <div className="flex items-center h-5">
                      <input
                        id="app-marking-jobs"
                        name="app-marking-jobs"
                        type="checkbox"
                        className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded"
                        defaultChecked
                      />
                    </div>
                    <div className="ml-3 text-sm">
                      <label
                        htmlFor="app-marking-jobs"
                        className="font-medium text-gray-700"
                      >
                        Marking Jobs
                      </label>
                      <p className="text-gray-500">
                        Show notifications for new marking jobs.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <div className="flex items-center h-5">
                      <input
                        id="app-submissions"
                        name="app-submissions"
                        type="checkbox"
                        className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded"
                        defaultChecked
                      />
                    </div>
                    <div className="ml-3 text-sm">
                      <label
                        htmlFor="app-submissions"
                        className="font-medium text-gray-700"
                      >
                        Submissions
                      </label>
                      <p className="text-gray-500">
                        Show notifications for new submissions.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <div className="flex items-center h-5">
                      <input
                        id="app-comments"
                        name="app-comments"
                        type="checkbox"
                        className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded"
                        defaultChecked
                      />
                    </div>
                    <div className="ml-3 text-sm">
                      <label
                        htmlFor="app-comments"
                        className="font-medium text-gray-700"
                      >
                        Comments
                      </label>
                      <p className="text-gray-500">
                        Show notifications for comments and mentions.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="pt-6">
                <Button
                  variant="primary"
                  icon={<FontAwesomeIcon icon={faSave} className="h-4 w-4" />}
                >
                  Save Notification Preferences
                </Button>
              </div>
            </div>
          </Card>
        );
      case "security":
        return (
          <div className="space-y-6">
            <Card title="Change Password" subtitle="Update your password">
              <form className="space-y-6">
                <div className="space-y-4">
                  <Input label="Current Password" type="password" required />
                  <Input
                    label="New Password"
                    type="password"
                    hint="Password must be at least 8 characters and include a number and special character."
                    required
                  />
                  <Input
                    label="Confirm New Password"
                    type="password"
                    required
                  />
                </div>
                <div>
                  <Button variant="primary">Update Password</Button>
                </div>
              </form>
            </Card>
            <Card
              title="Two-Factor Authentication"
              subtitle="Add an extra layer of security"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-base font-medium text-gray-900">
                      Two-factor authentication
                    </h4>
                    <p className="text-sm text-gray-500">
                      Add an extra layer of security to your account
                    </p>
                  </div>
                  <Button variant="outline">Enable</Button>
                </div>
                <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                  <div>
                    <h4 className="text-base font-medium text-gray-900">
                      Recovery codes
                    </h4>
                    <p className="text-sm text-gray-500">
                      Generate recovery codes to use when you don&apos;t have
                      your device
                    </p>
                  </div>
                  <Button variant="outline" disabled>
                    Generate
                  </Button>
                </div>
              </div>
            </Card>
            <Card title="Sessions" subtitle="Manage your active sessions">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="p-2 rounded-md bg-green-100">
                      <FontAwesomeIcon
                        icon={faGlobe}
                        className="h-5 w-5 text-green-600"
                      />
                    </div>
                    <div className="ml-3">
                      <h4 className="text-base font-medium text-gray-900">
                        Current Session
                      </h4>
                      <p className="text-sm text-gray-500">
                        Chrome on Windows • IP: 192.168.1.1 • Active now
                      </p>
                    </div>
                  </div>
                  <div className="text-sm font-medium text-green-600">
                    Current
                  </div>
                </div>
                <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                  <div className="flex items-center">
                    <div className="p-2 rounded-md bg-gray-100">
                      <FontAwesomeIcon
                        icon={faGlobe}
                        className="h-5 w-5 text-gray-600"
                      />
                    </div>
                    <div className="ml-3">
                      <h4 className="text-base font-medium text-gray-900">
                        Safari on macOS
                      </h4>
                      <p className="text-sm text-gray-500">
                        IP: 192.168.1.2 • Last active: 2 days ago
                      </p>
                    </div>
                  </div>
                  <Button variant="outline" size="sm">
                    Revoke
                  </Button>
                </div>
                <div className="pt-4 border-t border-gray-200">
                  <Button variant="outline" size="sm">
                    Revoke All Other Sessions
                  </Button>
                </div>
              </div>
            </Card>
            <Card
              title="Account Security"
              subtitle="Manage your account security"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="text-base font-medium text-gray-900">
                      Reset all account access
                    </h4>
                    <p className="text-sm text-gray-500">
                      This will reset your password and revoke all sessions and
                      API tokens
                    </p>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => setIsResetModalOpen(true)}
                  >
                    Reset Access
                  </Button>
                </div>
                <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                  <div>
                    <h4 className="text-base font-medium text-red-600">
                      Delete account
                    </h4>
                    <p className="text-sm text-gray-500">
                      Permanently delete your account and all associated data
                    </p>
                  </div>
                  <Button
                    variant="destructive"
                    icon={
                      <FontAwesomeIcon icon={faTrash} className="h-4 w-4" />
                    }
                    onClick={() => setIsDeleteAccountModalOpen(true)}
                  >
                    Delete Account
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        );
      case "preferences":
        return (
          <Card
            title="Application Preferences"
            subtitle="Customize your application experience"
          >
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-medium text-gray-900">Display</h3>
                <div className="mt-4 space-y-4">
                  <div>
                    <label
                      htmlFor="theme"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Theme
                    </label>
                    <select
                      id="theme"
                      name="theme"
                      className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                      defaultValue="system"
                    >
                      <option value="system">System</option>
                      <option value="light">Light</option>
                      <option value="dark">Dark</option>
                    </select>
                  </div>
                  <div>
                    <label
                      htmlFor="density"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Display Density
                    </label>
                    <select
                      id="density"
                      name="density"
                      className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                      defaultValue="comfortable"
                    >
                      <option value="comfortable">Comfortable</option>
                      <option value="compact">Compact</option>
                    </select>
                  </div>
                </div>
              </div>
              <div className="pt-6 border-t border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Regional</h3>
                <div className="mt-4 space-y-4">
                  <div>
                    <label
                      htmlFor="language"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Language
                    </label>
                    <select
                      id="language"
                      name="language"
                      className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                      defaultValue="en"
                    >
                      <option value="en">English</option>
                      <option value="es">Español</option>
                      <option value="fr">Français</option>
                      <option value="de">Deutsch</option>
                    </select>
                  </div>
                  <div>
                    <label
                      htmlFor="timezone"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Timezone
                    </label>
                    <select
                      id="timezone"
                      name="timezone"
                      className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                      defaultValue="utc"
                    >
                      <option value="utc">UTC</option>
                      <option value="est">Eastern Time (UTC-5)</option>
                      <option value="cst">Central Time (UTC-6)</option>
                      <option value="mst">Mountain Time (UTC-7)</option>
                      <option value="pst">Pacific Time (UTC-8)</option>
                    </select>
                  </div>
                  <div>
                    <label
                      htmlFor="date-format"
                      className="block text-sm font-medium text-gray-700"
                    >
                      Date Format
                    </label>
                    <select
                      id="date-format"
                      name="date-format"
                      className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
                      defaultValue="mdy"
                    >
                      <option value="mdy">MM/DD/YYYY</option>
                      <option value="dmy">DD/MM/YYYY</option>
                      <option value="ymd">YYYY/MM/DD</option>
                    </select>
                  </div>
                </div>
              </div>
              <div className="pt-6 border-t border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Dashboard</h3>
                <div className="mt-4 space-y-4">
                  <div className="flex items-start">
                    <div className="flex items-center h-5">
                      <input
                        id="show-welcome"
                        name="show-welcome"
                        type="checkbox"
                        className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded"
                        defaultChecked
                      />
                    </div>
                    <div className="ml-3 text-sm">
                      <label
                        htmlFor="show-welcome"
                        className="font-medium text-gray-700"
                      >
                        Show welcome message
                      </label>
                      <p className="text-gray-500">
                        Show the welcome message on the dashboard.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <div className="flex items-center h-5">
                      <input
                        id="show-stats"
                        name="show-stats"
                        type="checkbox"
                        className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded"
                        defaultChecked
                      />
                    </div>
                    <div className="ml-3 text-sm">
                      <label
                        htmlFor="show-stats"
                        className="font-medium text-gray-700"
                      >
                        Show statistics
                      </label>
                      <p className="text-gray-500">
                        Show statistics cards on the dashboard.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start">
                    <div className="flex items-center h-5">
                      <input
                        id="show-recent"
                        name="show-recent"
                        type="checkbox"
                        className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded"
                        defaultChecked
                      />
                    </div>
                    <div className="ml-3 text-sm">
                      <label
                        htmlFor="show-recent"
                        className="font-medium text-gray-700"
                      >
                        Show recent jobs
                      </label>
                      <p className="text-gray-500">
                        Show recent marking jobs on the dashboard.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              <div className="pt-6">
                <Button
                  variant="primary"
                  icon={<FontAwesomeIcon icon={faSave} className="h-4 w-4" />}
                >
                  Save Preferences
                </Button>
              </div>
            </div>
          </Card>
        );
      default:
        return null;
    }
  };
  return (
    <div>
      <div className="flex flex-col md:flex-row">
        <div className="md:w-64 flex-shrink-0">
          <div className="bg-white rounded-lg shadow mb-6 md:mb-0 md:mr-6">
            <nav className="space-y-1 p-4">
              {tabs.map((tab) => (
                <a
                  key={tab.id}
                  href="#"
                  onClick={(e) => {
                    e.preventDefault();
                    setActiveTab(tab.id);
                  }}
                  className={`
                    flex items-center px-3 py-2 text-sm font-medium rounded-md
                    ${
                      activeTab === tab.id
                        ? "bg-blue-50 text-blue-700"
                        : "text-gray-700 hover:text-gray-900 hover:bg-gray-50"
                    }
                  `}
                  aria-current={activeTab === tab.id ? "page" : undefined}
                >
                  <span className="mr-3">{tab.icon}</span>
                  <span>{tab.name}</span>
                </a>
              ))}
            </nav>
          </div>
        </div>
        <div className="flex-1 min-w-0">{renderTabContent()}</div>
      </div>
      {/* Reset Access Modal */}
      <VerificationModal
        isOpen={isResetModalOpen}
        onClose={() => setIsResetModalOpen(false)}
        onConfirm={handleResetPassword}
        title="Reset Account Access"
        message="This will reset your password and revoke all active sessions. You will need to set a new password. Are you sure you want to continue?"
        confirmText="Reset Access"
        type="warning"
      />
      {/* Delete Account Modal */}
      <VerificationModal
        isOpen={isDeleteAccountModalOpen}
        onClose={() => setIsDeleteAccountModalOpen(false)}
        onConfirm={handleDeleteAccount}
        title="Delete Account"
        message="This will permanently delete your account and all associated data. This action cannot be undone. Are you sure you want to continue?"
        confirmText="Delete Account"
        type="error"
      />
    </div>
  );
}
