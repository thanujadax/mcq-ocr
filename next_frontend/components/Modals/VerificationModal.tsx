import React from "react";
import { Modal } from "../UI/Modal";
import { Button } from "../UI/Button";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faExclamationTriangle,
  faCheckCircle,
  faTimesCircle,
  faInfoCircle,
} from "@fortawesome/free-solid-svg-icons";

type VerificationType = "success" | "warning" | "error" | "info";

interface VerificationModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  type?: VerificationType;
}

export function VerificationModal({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  type = "warning",
}: VerificationModalProps) {
  const getIcon = () => {
    switch (type) {
      case "success":
        return (
          <FontAwesomeIcon
            icon={faCheckCircle}
            className="h-12 w-12 text-green-500"
          />
        );
      case "warning":
        return (
          <FontAwesomeIcon
            icon={faExclamationTriangle}
            className="h-12 w-12 text-amber-500"
          />
        );
      case "error":
        return (
          <FontAwesomeIcon
            icon={faTimesCircle}
            className="h-12 w-12 text-red-500"
          />
        );
      case "info":
        return <FontAwesomeIcon icon={faInfoCircle} className="h-12 w-12 text-blue-500" />;
    }
  };

  const getTitle = () => {
    if (title) return title;
    switch (type) {
      case "success":
        return "Success";
      case "warning":
        return "Warning";
      case "error":
        return "Error";
      case "info":
        return "Information";
    }
  };

  const getButtonColor = (): "primary" | "destructive" => {
    switch (type) {
      case "error":
      case "warning":
        return "destructive";
      default:
        return "primary";
    }
  };

  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  const modalFooter = (
    <>
      <Button variant="outline" onClick={onClose}>
        {cancelText}
      </Button>
      <Button variant={getButtonColor()} onClick={handleConfirm}>
        {confirmText}
      </Button>
    </>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={getTitle()}
      size="sm"
      footer={modalFooter}
    >
      <div className="flex flex-col items-center text-center">
        <div className="mb-4">{getIcon()}</div>
        <p className="text-gray-700">{message}</p>
      </div>
    </Modal>
  );
}
