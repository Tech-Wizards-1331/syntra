"use client";

import React, { useEffect } from "react";
import { CheckCircle2, AlertTriangle, XCircle, X } from "lucide-react";

export interface ToastMessage {
  id: number;
  message: string;
  type: "success" | "error" | "warning";
}

interface ToastProps {
  toast: ToastMessage;
  onClose: (id: number) => void;
}

function Toast({ toast, onClose }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose(toast.id);
    }, 4000); // Auto-dismiss after 4 seconds

    return () => clearTimeout(timer);
  }, [toast.id, onClose]);

  const config = (() => {
    switch (toast.type) {
      case "success":
        return {
          icon: <CheckCircle2 className="w-5 h-5 text-success shrink-0" />,
          borderColor: "border-success/15",
          bgColor: "bg-success-light",
          textColor: "text-success",
          progressColor: "bg-success",
        };
      case "error":
        return {
          icon: <XCircle className="w-5 h-5 text-danger shrink-0" />,
          borderColor: "border-danger/15",
          bgColor: "bg-danger-light",
          textColor: "text-danger",
          progressColor: "bg-danger",
        };
      case "warning":
        return {
          icon: <AlertTriangle className="w-5 h-5 text-warning shrink-0" />,
          borderColor: "border-warning/15",
          bgColor: "bg-warning-light",
          textColor: "text-warning",
          progressColor: "bg-warning",
        };
    }
  })();

  return (
    <div
      className={`flex flex-col overflow-hidden rounded-md border ${config.borderColor} ${config.bgColor} apple-shadow-overlay animate-slide-in-right`}
      role="alert"
    >
      <div className="flex items-start gap-3 p-4">
        {config.icon}
        <div className="flex-1 min-w-0">
          <p className={`text-xs font-medium ${config.textColor} leading-relaxed break-words`}>
            {toast.message}
          </p>
        </div>
        <button
          onClick={() => onClose(toast.id)}
          className="text-ink-muted hover:text-ink p-1 rounded-md transition cursor-pointer shrink-0"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
      {/* Countdown progress bar */}
      <div className="h-[2px] w-full bg-transparent">
        <div className={`h-full ${config.progressColor} opacity-30 animate-progress-countdown`} />
      </div>
    </div>
  );
}

interface ToastContainerProps {
  toasts: ToastMessage[];
  onClose: (id: number) => void;
}

export default function ToastContainer({ toasts, onClose }: ToastContainerProps) {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 max-w-sm w-full px-4 sm:px-0">
      {toasts.map((toast) => (
        <Toast key={toast.id} toast={toast} onClose={onClose} />
      ))}
    </div>
  );
}
