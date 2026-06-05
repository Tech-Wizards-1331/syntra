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
          icon: <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />,
          borderColor: "border-emerald-500/20",
          bgColor: "bg-emerald-950/90",
          textColor: "text-emerald-300",
          progressColor: "bg-emerald-500",
        };
      case "error":
        return {
          icon: <XCircle className="w-5 h-5 text-red-400 shrink-0" />,
          borderColor: "border-red-500/20",
          bgColor: "bg-red-950/90",
          textColor: "text-red-300",
          progressColor: "bg-red-500",
        };
      case "warning":
        return {
          icon: <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0" />,
          borderColor: "border-amber-500/20",
          bgColor: "bg-amber-950/90",
          textColor: "text-amber-300",
          progressColor: "bg-amber-500",
        };
    }
  })();

  return (
    <div
      className={`flex flex-col overflow-hidden rounded-xl border ${config.borderColor} ${config.bgColor} backdrop-blur-lg shadow-2xl shadow-black/30 animate-slide-in-right`}
      role="alert"
    >
      <div className="flex items-start gap-3 p-4">
        {config.icon}
        <div className="flex-1 min-w-0">
          <p className={`text-xs font-semibold ${config.textColor} leading-relaxed break-words`}>
            {toast.message}
          </p>
        </div>
        <button
          onClick={() => onClose(toast.id)}
          className="text-slate-500 hover:text-white hover:bg-white/5 p-1 rounded-lg transition cursor-pointer shrink-0"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
      {/* Countdown progress bar */}
      <div className="h-[2px] w-full bg-transparent">
        <div className={`h-full ${config.progressColor} opacity-40 animate-progress-countdown`} />
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
