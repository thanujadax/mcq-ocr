"use client";

import React, { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import * as OutlineIcons from "@heroicons/react/24/outline";

// Destructure icons with fallbacks for Docker compatibility
const {
  HomeIcon,
  DocumentIcon,
  ClipboardDocumentCheckIcon,
  UsersIcon,
  CogIcon,
  Bars3Icon,
  XMarkIcon,
  PlusCircleIcon,
  AcademicCapIcon,
  ArrowRightOnRectangleIcon,
} = OutlineIcons;

// Fallback icon component for environments where Heroicons might not load
const FallbackIcon = ({ className }: { className?: string }) => (
  <div className={`${className} bg-gray-300 rounded`} />
);
import { useAuth } from "../../hooks/useAuth";
import { UserRoles } from "../../app/users/types/types";

interface SidebarItem {
  name: string;
  path: string;
  iconName: string;
  allowedRoles: UserRoles[];
}

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const pathname = usePathname();
  const { user, signOut } = useAuth();
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Check if screen is mobile
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 768) {
        setCollapsed(true);
      }
    };
    window.addEventListener("resize", handleResize);
    handleResize();
    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  // Close mobile sidebar when route changes
  useEffect(() => {
    setMobileOpen(false);
  }, [pathname]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const sidebarItems = [
    {
      name: "Dashboard",
      path: "/",
      iconName: "HomeIcon",
      allowedRoles: [
        UserRoles.SUPERADMIN,
        UserRoles.FACULTYADMIN,
        UserRoles.BASIC,
      ],
    },
    {
      name: "My Templates",
      path: "/templates",
      iconName: "DocumentIcon",
      allowedRoles: [UserRoles.FACULTYADMIN, UserRoles.BASIC], // Super admin cannot see
    },
    {
      name: "Generate Template",
      path: "/generate-template",
      iconName: "PlusCircleIcon",
      allowedRoles: [UserRoles.FACULTYADMIN, UserRoles.BASIC], // Super admin cannot see
    },
    {
      name: "Marking Jobs",
      path: "/marking-jobs",
      iconName: "ClipboardDocumentCheckIcon",
      allowedRoles: [UserRoles.FACULTYADMIN, UserRoles.BASIC], // Super admin cannot see
    },
    {
      name: "Users",
      path: "/users",
      iconName: "UsersIcon",
      allowedRoles: [UserRoles.SUPERADMIN, UserRoles.FACULTYADMIN], // Only super admin and faculty admin
    },
    {
      name: "Settings",
      path: "/settings",
      iconName: "CogIcon",
      allowedRoles: [UserRoles.SUPERADMIN], // Only super admin
    },
  ];

  // Filter sidebar items based on user role
  const filteredSidebarItems = sidebarItems.filter((item) => {
    if (!user?.role) return false;
    return item.allowedRoles.includes(user.role as UserRoles);
  });

  // Function to get icon component safely
  const getIcon = (iconName: string, className: string) => {
    const iconMap: {
      [key: string]: React.ComponentType<{ className?: string }>;
    } = {
      HomeIcon,
      DocumentIcon,
      PlusCircleIcon,
      ClipboardDocumentCheckIcon,
      UsersIcon,
      CogIcon,
    };

    const IconComponent = iconMap[iconName];
    return IconComponent ? (
      <IconComponent className={className} />
    ) : (
      <FallbackIcon className={className} />
    );
  };

  const toggleMobileSidebar = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleMouseEnter = () => {
    if (window.innerWidth >= 768) {
      // Only on desktop
      setCollapsed(false);
    }
  };

  const handleMouseLeave = () => {
    if (window.innerWidth >= 768) {
      // Only on desktop
      setCollapsed(true);
    }
  };

  // Get initials from user name or email
  const getInitials = () => {
    if (user?.first_name && user?.last_name) {
      return (user.first_name[0] + user.last_name[0]).toUpperCase();
    }
    if (user?.first_name) {
      return user.first_name[0].toUpperCase();
    }
    if (user?.email) {
      return user.email[0].toUpperCase();
    }
    return "U";
  };

  // Get display name from user
  const getDisplayName = () => {
    if (user?.first_name && user?.last_name) {
      return `${user.first_name} ${user.last_name}`;
    }
    if (user?.first_name) {
      return user.first_name;
    }
    return "User";
  };

  return (
    <div className="flex">
      {/* Mobile menu button */}
      <div className="md:hidden fixed top-4 left-4 z-30">
        <button
          onClick={toggleMobileSidebar}
          className="p-2 rounded-lg text-gray-600 hover:text-gray-800 hover:bg-white shadow-lg transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <span className="sr-only">Open sidebar</span>
          {mobileOpen ? (
            <XMarkIcon className="h-6 w-6" />
          ) : (
            <Bars3Icon className="h-6 w-6" />
          )}
        </button>
      </div>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 z-20 bg-black bg-opacity-30 transition-opacity backdrop-blur-sm"
          onClick={() => setMobileOpen(false)}
        ></div>
      )}

      {/* Sidebar */}
      <aside
        className={`
          flex flex-col bg-white/80 backdrop-blur-xl border-r border-gray-200/50 h-screen transition-all duration-300 ease-in-out transform shadow-xl
          ${mobileOpen ? "translate-x-0" : "-translate-x-full"}
          md:translate-x-0
          ${collapsed ? "w-20" : "w-72"}
          fixed md:static z-30 md:z-auto
        `}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {/* Header */}
        <div className="flex items-center p-6 border-b border-gray-200/50">
          {collapsed ? (
            /* Collapsed state - center the icon */
            <div className="w-full flex justify-center">
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-3 rounded-xl shadow-lg">
                <AcademicCapIcon className="h-7 w-7" />
              </div>
            </div>
          ) : (
            /* Expanded state - show icon and text */
            <div className="flex items-center">
              <div className="bg-gradient-to-br from-blue-500 to-blue-600 text-white p-3 rounded-xl shadow-lg">
                <AcademicCapIcon className="h-7 w-7" />
              </div>
              <div className="ml-4">
                <h1 className="text-xl font-bold bg-gradient-to-r from-gray-800 to-gray-600 bg-clip-text text-transparent whitespace-nowrap">
                  MCQ Grader
                </h1>
                <p className="text-xs text-gray-500 mt-0.5 whitespace-nowrap">
                  Smart Evaluation
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="flex-1 px-4 py-6 overflow-y-auto">
          <nav className="space-y-2">
            {filteredSidebarItems.map((item) => {
              const isActive =
                item.path === "/"
                  ? pathname === "/"
                  : pathname.startsWith(item.path);
              return (
                <Link
                  key={item.name}
                  href={item.path}
                  className={`
                    ${
                      isActive
                        ? "bg-gradient-to-r from-blue-50 to-blue-100 text-blue-700 shadow-sm"
                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                    }
                    group flex items-center ${
                      collapsed ? "justify-center px-3" : "px-4"
                    } py-3.5 text-sm font-medium rounded-xl transition-all duration-200 transform hover:scale-105 hover:shadow-md relative overflow-hidden
                  `}
                >
                  {/* Left border indicator for active state */}
                  {isActive && (
                    <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-blue-500 to-blue-600 rounded-r-full" />
                  )}

                  {/* Background animation */}
                  <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-blue-600/10 opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded-xl" />

                  <div
                    className={`${
                      collapsed ? "" : "mr-4"
                    } relative z-10 transition-all duration-200 ${
                      isActive ? "text-blue-600" : ""
                    }`}
                  >
                    {getIcon(
                      item.iconName,
                      `h-6 w-6 ${isActive ? "stroke-2" : "stroke-1.5"}`
                    )}
                  </div>

                  <span
                    className={`relative z-10 transition-all duration-300 overflow-hidden whitespace-nowrap ${
                      collapsed ? "w-0 opacity-0" : "w-auto opacity-100"
                    }`}
                  >
                    {item.name}
                  </span>

                  {/* Active indicator dot */}
                  {isActive && !collapsed && (
                    <div className="ml-auto">
                      <div className="w-2 h-2 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full animate-pulse" />
                    </div>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Footer - User Profile */}
        <div className="p-4 border-t border-gray-200/50">
          <div className="relative" ref={dropdownRef}>
            <button
              onClick={() => setDropdownOpen(!dropdownOpen)}
              className={`w-full transition-all duration-300 ${
                collapsed ? "flex justify-center" : ""
              }`}
            >
              <div className="flex items-center w-full">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-blue-600 rounded-full flex items-center justify-center flex-shrink-0 shadow-lg">
                  <span className="text-white font-semibold text-sm">
                    {getInitials()}
                  </span>
                </div>
                <div
                  className={`ml-3 transition-all duration-300 overflow-hidden ${
                    collapsed ? "w-0 opacity-0" : "w-auto opacity-100"
                  }`}
                >
                  <p className="text-sm font-medium text-gray-900 whitespace-nowrap text-left">
                    {getDisplayName()}
                  </p>
                  <p className="text-xs text-gray-500 whitespace-nowrap text-left">
                    {user?.email || "user@example.com"}
                  </p>
                </div>
              </div>
            </button>

            {/* Dropdown Menu */}
            {dropdownOpen && (
              <div className="absolute bottom-full left-0 mb-2 w-48 bg-white rounded-xl shadow-xl py-2 border border-gray-100 z-50">
                <div className="px-4 py-3 border-b border-gray-100">
                  <p className="text-sm font-medium text-gray-900">
                    {getDisplayName()}
                  </p>
                  <p className="text-xs text-gray-500 truncate">
                    {user?.email || "user@example.com"}
                  </p>
                </div>
                <button
                  onClick={signOut}
                  className="w-full text-left px-4 py-3 text-sm text-gray-700 hover:bg-red-50 hover:text-red-600 flex items-center transition-colors duration-200"
                >
                  <ArrowRightOnRectangleIcon className="h-4 w-4 mr-3" />
                  Sign out
                </button>
              </div>
            )}
          </div>
        </div>
      </aside>
    </div>
  );
}
