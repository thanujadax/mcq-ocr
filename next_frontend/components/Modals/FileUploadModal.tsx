import React, { useState } from "react";
import { Modal } from "../UI/Modal";
import { FileUpload } from "../UI/FileUpload";
import { Button } from "../UI/Button";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUpload } from "@fortawesome/free-solid-svg-icons";

interface FileUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpload?: (files: File[]) => void;
  title?: string;
  acceptedFileTypes?: string;
  maxFiles?: number;
  maxFileSize?: number;
}

export function FileUploadModal({
  isOpen,
  onClose,
  onUpload,
  title = "Upload Files",
  acceptedFileTypes,
  maxFiles = 10,
  maxFileSize = 5 * 1024 * 1024, // 5MB
}: FileUploadModalProps) {
  const [files, setFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleFilesChange = (newFiles: File[]) => {
    setFiles(newFiles);
  };

  const handleUpload = async () => {
    if (files.length === 0) return;

    setIsUploading(true);

    // Simulate upload progress
    const intervalId = setInterval(() => {
      setUploadProgress((prev) => {
        const newProgress = prev + 5;
        if (newProgress >= 100) {
          clearInterval(intervalId);
          return 100;
        }
        return newProgress;
      });
    }, 200);

    // Simulate API call delay
    await new Promise((resolve) => setTimeout(resolve, 2000));

    clearInterval(intervalId);
    setUploadProgress(100);

    // Notify parent component
    if (onUpload) {
      onUpload(files);
    }

    // Reset and close
    setTimeout(() => {
      setIsUploading(false);
      setUploadProgress(0);
      setFiles([]);
      onClose();
    }, 500);
  };

  const modalFooter = (
    <>
      <Button variant="outline" onClick={onClose} disabled={isUploading}>
        Cancel
      </Button>
      <Button
        variant="primary"
        onClick={handleUpload}
        disabled={files.length === 0 || isUploading}
        isLoading={isUploading}
        icon={!isUploading ? <FontAwesomeIcon icon={faUpload} className="h-4 w-4" /> : undefined}
      >
        {isUploading ? `Uploading ${uploadProgress}%` : "Upload"}
      </Button>
    </>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      size="lg"
      footer={modalFooter}
      closeOnClickOutside={!isUploading}
    >
      <FileUpload
        accept={acceptedFileTypes}
        maxFiles={maxFiles}
        maxSize={maxFileSize}
        onFilesChange={handleFilesChange}
      />
      {isUploading && (
        <div className="mt-4">
          <div className="w-full bg-gray-200 rounded-full h-2.5">
            <div
              className="bg-blue-600 h-2.5 rounded-full transition-all duration-300 ease-out"
              style={{ width: `${uploadProgress}%` }}
            ></div>
          </div>
        </div>
      )}
    </Modal>
  );
}
