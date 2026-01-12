"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faTachometerAlt,
  faFileText,
  faClipboardCheck,
  faUsers,
  faCog,
  faChartBar,
  faBars,
  faTimes,
  faPlusCircle
} from "@fortawesome/free-solid-svg-icons";

interface SidebarItem {
  name: string;
  path: string;
  icon: React.ReactNode;
}

export function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const pathname = usePathname();

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

  const sidebarItems: SidebarItem[] = [
    {
      name: "Dashboard",
      path: "/",
      icon: <FontAwesomeIcon icon={faTachometerAlt} className="h-5 w-5" />,
    },
    {
      name: "My Templates",
      path: "/templates",
      icon: <FontAwesomeIcon icon={faFileText} className="h-5 w-5" />,
    },
    {
      name: "Marking Jobs",
      path: "/marking-jobs",
      icon: <FontAwesomeIcon icon={faClipboardCheck} className="h-5 w-5" />,
    },
    {
      name: "Users",
      path: "/users",
      icon: <FontAwesomeIcon icon={faUsers} className="h-5 w-5" />,
    },
    {
      name: "Reports",
      path: "/reports",
      icon: <FontAwesomeIcon icon={faChartBar} className="h-5 w-5" />,
    },
    {
      name: "Generate Template",
      path: "/generate-template",
      icon: <FontAwesomeIcon icon={faPlusCircle} className="h-5 w-5" />,
    },
    {
      name: "Settings",
      path: "/settings",
      icon: <FontAwesomeIcon icon={faCog} className="h-5 w-5" />,
    },
  ];

  const toggleSidebar = () => {
    setCollapsed(!collapsed);
  };

  const toggleMobileSidebar = () => {
    setMobileOpen(!mobileOpen);
  };

  return (
    <div className="flex">
      {/* Mobile menu button */}
      <div className="md:hidden fixed top-4 left-4 z-30">
        <button
          onClick={toggleMobileSidebar}
          className="p-2 rounded-md text-gray-500 hover:text-gray-600 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
        >
          <span className="sr-only">Open sidebar</span>
          {mobileOpen ? (
            <FontAwesomeIcon icon={faTimes} className="h-6 w-6" />
          ) : (
            <FontAwesomeIcon icon={faBars} className="h-6 w-6" />
          )}
        </button>
      </div>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="md:hidden fixed inset-0 z-20 bg-gray-600 bg-opacity-75 transition-opacity"
          onClick={() => setMobileOpen(false)}
        ></div>
      )}

      {/* Sidebar */}
      <aside
        className={`
          flex flex-col bg-white border-r border-gray-200 pt-5 pb-4 transition-all duration-300 transform
          ${mobileOpen ? "translate-x-0" : "-translate-x-full"}
          md:translate-x-0
          ${collapsed ? "w-20" : "w-64"}
        `}
      >
        <div className="flex items-center justify-between px-4">
          <div
            className={`flex items-center ${
              collapsed ? "justify-center w-full" : ""
            }`}
          >
            <div className="bg-blue-600 text-white p-2 rounded-md">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-6 w-6"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
                />
              </svg>
            </div>
            {!collapsed && (
              <span className="ml-3 text-xl font-bold text-gray-900">
                MarkApp
              </span>
            )}
          </div>
          <button
            onClick={toggleSidebar}
            className="hidden md:block p-1 rounded-md text-gray-400 hover:text-gray-500 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500"
          >
            <span className="sr-only">
              {collapsed ? "Expand sidebar" : "Collapse sidebar"}
            </span>
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d={
                  collapsed
                    ? "M13 5l7 7-7 7M5 5l7 7-7 7"
                    : "M11 19l-7-7 7-7m8 14l-7-7 7-7"
                }
              />
            </svg>
          </button>
        </div>
        <div className="mt-8 flex-1 flex flex-col overflow-y-auto">
          <nav className="flex-1 px-2 space-y-1">
            {sidebarItems.map((item) => {
              const isActive = item.path === "/" ? pathname === "/" : pathname.startsWith(item.path);
              return (
                <Link
                  key={item.name}
                  href={item.path}
                  className={`
                    ${
                      isActive
                        ? "bg-gray-100 text-blue-600"
                        : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                    }
                    group flex items-center px-2 py-2 text-base font-medium rounded-md
                  `}
                >
                  <div className={`${collapsed ? "mx-auto" : "mr-4"}`}>
                    {item.icon}
                  </div>
                  {!collapsed && <span>{item.name}</span>}
                </Link>
              );
            })}
          </nav>
        </div>
      </aside>
    </div>
  );
}
