import React, { useState, useRef } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUpload, faTimes } from "@fortawesome/free-solid-svg-icons";
import { Button } from "./Button";

interface FileUploadProps {
  label?: string;
  hint?: string;
  error?: string;
  accept?: string;
  maxFiles?: number;
  maxSize?: number; // in bytes
  onFilesChange?: (files: File[]) => void;
}

export function FileUpload({
  label,
  hint,
  error,
  accept,
  maxFiles = 10,
  maxSize = 5 * 1024 * 1024, // 5MB default
  onFilesChange,
}: FileUploadProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [fileErrors, setFileErrors] = useState<string[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFilesAdded = (newFiles: FileList | null) => {
    if (!newFiles) return;

    const fileArray = Array.from(newFiles);
    const errors: string[] = [];

    // Validate files
    const validFiles = fileArray.filter((file) => {
      // Check file size
      if (file.size > maxSize) {
        errors.push(
          `${file.name} exceeds maximum file size (${Math.round(
            maxSize / 1024 / 1024
          )}MB)`
        );
        return false;
      }

      // Check file type if accept is specified
      if (
        accept &&
        !accept.split(",").some((type) => {
          // Handle wildcards like image/*
          if (type.endsWith("/*")) {
            const category = type.replace("/*", "");
            return file.type.startsWith(category);
          }
          return file.name.endsWith(type);
        })
      ) {
        errors.push(`${file.name} has an unsupported file type`);
        return false;
      }

      return true;
    });

    // Check max files
    if (files.length + validFiles.length > maxFiles) {
      errors.push(`You can only upload a maximum of ${maxFiles} files`);
      setFileErrors(errors);
      return;
    }

    if (errors.length > 0) {
      setFileErrors(errors);
    } else {
      setFileErrors([]);
      const updatedFiles = [...files, ...validFiles];
      setFiles(updatedFiles);
      if (onFilesChange) onFilesChange(updatedFiles);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    handleFilesAdded(e.dataTransfer.files);
  };

  const removeFile = (index: number) => {
    const updatedFiles = [...files];
    updatedFiles.splice(index, 1);
    setFiles(updatedFiles);
    if (onFilesChange) onFilesChange(updatedFiles);
  };

  const openFileDialog = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  return (
    <div className="w-full">
      {label && (
        <div className="text-sm font-medium text-gray-700 mb-1">{label}</div>
      )}
      <div
        className={`
          border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center cursor-pointer
          ${
            isDragging
              ? "border-blue-500 bg-blue-50"
              : "border-gray-300 hover:border-gray-400"
          }
          ${error ? "border-red-300" : ""}
        `}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={openFileDialog}
      >
        <input
          ref={fileInputRef}
          type="file"
          className="hidden"
          accept={accept}
          multiple={maxFiles > 1}
          onChange={(e) => handleFilesAdded(e.target.files)}
        />
        <div className="flex flex-col items-center text-center">
          <FontAwesomeIcon
            icon={faUpload}
            className="h-10 w-10 text-gray-400 mb-3"
          />
          <p className="text-sm text-gray-700 font-medium">
            Drag and drop files here, or{" "}
            <span className="text-blue-600">click to browse</span>
          </p>
          <p className="text-xs text-gray-500 mt-1">
            {accept
              ? `Accepted file types: ${accept
                  .replace(/\./g, "")
                  .toUpperCase()}`
              : "All file types accepted"}
          </p>
          {maxSize && (
            <p className="text-xs text-gray-500">
              Max file size: {Math.round(maxSize / 1024 / 1024)}MB
            </p>
          )}
          {maxFiles > 1 && (
            <p className="text-xs text-gray-500">Max files: {maxFiles}</p>
          )}
        </div>
      </div>
      {fileErrors.length > 0 && (
        <div className="mt-2">
          {fileErrors.map((err, i) => (
            <p key={i} className="text-sm text-red-600">
              {err}
            </p>
          ))}
        </div>
      )}
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      {hint && !error && <p className="mt-2 text-sm text-gray-500">{hint}</p>}
      {files.length > 0 && (
        <div className="mt-4">
          <h4 className="text-sm font-medium text-gray-700 mb-2">
            Selected Files ({files.length})
          </h4>
          <ul className="divide-y divide-gray-200 border border-gray-200 rounded-md">
            {files.map((file, index) => (
              <li
                key={index}
                className="flex items-center justify-between py-2 px-4 text-sm"
              >
                <div className="flex items-center">
                  <span className="truncate max-w-xs">{file.name}</span>
                  <span className="ml-2 text-xs text-gray-500">
                    {(file.size / 1024).toFixed(1)}KB
                  </span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeFile(index);
                  }}
                  icon={<FontAwesomeIcon icon={faTimes} className="h-4 w-4" />}
                  aria-label="Remove file"
                />
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
