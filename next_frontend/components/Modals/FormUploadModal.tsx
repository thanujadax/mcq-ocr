import React, { useEffect, useState } from "react";
import { Modal } from "../UI/Modal";
import { FileUpload } from "../UI/FileUpload";
import { Button } from "../UI/Button";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faUpload } from "@fortawesome/free-solid-svg-icons";
import { Select } from "../UI/Select";
import { Input } from "../UI/Input";

interface InputFieldConfig {
  /** Unique identifier (also used for form submission name) */
  name: string;

  /** Label displayed above the input */
  label?: string;

  /** Input type (text, number, password, email, etc.) */
  type?: string;

  /** Default value shown in the input */
  defaultValue?: string;

  /** Placeholder text inside the input */
  placeholder?: string;

  /** Whether the field is required */
  required?: boolean;

  /** Disable user input */
  disabled?: boolean;

  /** Helper text displayed below */
  hint?: string;

  /** Validation error message */
  error?: string;

  /** Optional left-side icon */
  leftIcon?: React.ReactNode;

  /** Optional right-side icon */
  rightIcon?: React.ReactNode;

  /** Styling flag: take full width */
  fullWidth?: boolean;

  /** Additional CSS classes */
  className?: string;
}

interface SelectOption {
  value: string;
  label: string;
}

interface SelectFieldConfig {
  /** Unique identifier (also used for form submission name) */
  name: string;

  /** Label displayed above the field */
  label: string;

  /** Dropdown options */
  options: SelectOption[];

  /** Pre-selected value */
  defaultValue: string;

  /** Whether the field is required */
  required?: boolean;

  /** Disable interaction */
  disabled?: boolean;

  /** Placeholder text when no option selected */
  placeholder?: string;

  /** Helper text */
  hint?: string;

  /** Validation error message */
  error?: string;

  /** Size of the input (small, medium, large) */
  size?: "sm" | "md" | "lg";

  /** Styling flag: take full width */
  fullWidth?: boolean;
}


interface FileFieldConfig {
  /** Unique identifier (used for state and form submission) */
  name: string;

  /** Label displayed above the file input */
  label?: string;

  /** Accepted file types (e.g., "image/*") */
  accept?: string;

  /** Maximum number of files allowed */
  maxFiles?: number;

  /** Maximum file size in bytes */
  maxSize?: number;

  /** Whether the field is required */
  required?: boolean;

  /** Helper text */
  hint?: string;

  /** Validation error message */
  error?: string;

  /** Optional styling for full width */
  fullWidth?: boolean;
}

interface FormUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpload?: (formData: FormData) => void;
  type: string;
  title?: string;
  selectFormConfig?: SelectFieldConfig[];
  inputFormConfig?: InputFieldConfig[];
  fileFormConfig?: FileFieldConfig[];
}

export function FormUploadModal({
  isOpen,
  onClose,
  onUpload,
  type,
  title = "Upload Files",
  selectFormConfig,
  inputFormConfig,
  fileFormConfig,
}: FormUploadModalProps) {
  const [files, setFiles] = useState<{ [key: string]: File[] }>({});
  const [inputs, setInputs] = useState<{ [key: string]: string }>({});
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Pre-fill inputs with defaultValue from config
  useEffect(() => {
    const initialInputs: { [key: string]: string } = {};

    // Handle Select defaults
    if (selectFormConfig) {
      selectFormConfig.forEach((field) => {
        if (field.defaultValue !== undefined) {
          initialInputs[field.name] = field.defaultValue;
        }
      });
    }

    // Handle Input defaults
    if (inputFormConfig) {
      inputFormConfig.forEach((field) => {
        if (field.defaultValue !== undefined) {
          initialInputs[field.name] = field.defaultValue;
        }
      });
    }

    setInputs(initialInputs);
  }, [selectFormConfig, inputFormConfig, isOpen]);// re-run when modal opens or config changes

  const handleFilesChange = (newFiles: File[], key: string) => {
    console.log("Files changed:", newFiles);
    setFiles((prev) => ({ ...prev, [key]: newFiles }));
  };

  const handleUpload = async () => {

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

    // Notify parent component
    const formData = new FormData();
    Object.entries(files).forEach(([key, fileArray]) => {
      fileArray.forEach((file) => {
        formData.append(key, file);
      });
    });
    formData.append("file_type", type);

    Object.entries(inputs).forEach(([key, value]) => {
      formData.append(key, value);
    });

    if (onUpload) {
      onUpload(formData);
    }

    clearInterval(intervalId);
    setUploadProgress(100);

    // Reset and close
    setTimeout(() => {
      setIsUploading(false);
      setUploadProgress(0);
      setFiles({});
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
        disabled={isUploading ||
          (selectFormConfig &&
            selectFormConfig.some(field => field.required && !inputs[field.name])) ||
          (inputFormConfig &&
            inputFormConfig.some(field => field.required && !inputs[field.name])) ||
          (fileFormConfig &&
            fileFormConfig.some(field => field.required && (!files[field.name] || files[field.name].length === 0)))}
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
      <div className="bg-gray-50 rounded-lg p-2 mb-3">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {inputFormConfig && inputFormConfig.map((field) => (
            <div key={field.name}>
              <Input
                name={field.name}
                type={field.type || "text"}
                label={field.label}
                defaultValue={field.defaultValue}
                placeholder={field.placeholder}
                required={field.required}
                disabled={field.disabled || isUploading}
                hint={field.hint}
                error={field.error}
                leftIcon={field.leftIcon}
                rightIcon={field.rightIcon}
                fullWidth={field.fullWidth ?? true}
                className={field.className}
                onChange={(e) =>
                  setInputs((prev) => ({
                    ...prev,
                    [field.name]: e.target.value,
                  }))
                }
              />
            </div>
          ))}
        </div>
      </div>

      <div className="bg-blue-50 rounded-lg p-4 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
          {selectFormConfig && selectFormConfig.length > 0 && selectFormConfig.map((field) => (
            <div key={field.name}>
              <Select
                name={field.name}
                label={field.label}
                options={field.options}
                defaultValue={field.defaultValue}
                required={field.required}
                disabled={field.disabled || isUploading}
                hint={field.hint}
                error={field.error}
                size={field.size || "md"}
                fullWidth
                onChange={(e) => {
                  setInputs((prev) => ({
                    ...prev,
                    [field.name]: e.target.value,
                  }));
                }}
              />
            </div>
          ))}
        </div>
      </div>

      {fileFormConfig && fileFormConfig.length > 0 && (
        <div className="bg-green-50 rounded-lg p-4 mb-6">
          <div className="grid grid-cols-1 gap-4">
            {fileFormConfig.map((field) => (
              <div key={field.name}>
                <FileUpload
                  accept={field.accept}
                  maxFiles={field.maxFiles}
                  maxSize={field.maxSize}
                  onFilesChange={(files: File[]) => handleFilesChange(files, field.name)}
                />
                {field.label && <p className="text-sm text-gray-700 mt-1">{field.label}</p>}
                {field.hint && !field.error && <p className="text-xs text-gray-500">{field.hint}</p>}
                {field.error && <p className="text-xs text-red-600">{field.error}</p>}
              </div>
            ))}
          </div>
        </div>
      )}


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
