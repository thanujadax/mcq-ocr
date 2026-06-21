"use client";

import React from "react";
import { ArrowPathIcon } from "@heroicons/react/24/outline";

export function LoadingState() {
  return (
    <div className="flex items-center justify-center h-96">
      <div className="text-center">
        <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <ArrowPathIcon className="h-8 w-8 text-blue-600 animate-spin" />
        </div>
        <p className="text-lg font-medium text-gray-900 mb-2">
          Loading dashboard...
        </p>
        <p className="text-gray-500">Please wait while we fetch your data</p>
      </div>
    </div>
  );
}
