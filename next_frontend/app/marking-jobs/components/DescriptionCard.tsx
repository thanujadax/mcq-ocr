import React from "react";

export function DescriptionCard() {
  return (
    <div className="bg-white p-4 rounded-md shadow-sm mb-4">
      <p className="text-sm text-gray-600">
        Upload answer sheets for automatic grading. The system will process them
        using the selected MCQ template.
      </p>
    </div>
  );
}
