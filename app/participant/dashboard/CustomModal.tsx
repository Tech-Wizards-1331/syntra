"use client";

import React from "react";
import { HelpCircle, AlertTriangle, X } from "lucide-react";

interface CustomModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  type: "confirm" | "alert";
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export default function CustomModal({
  isOpen,
  title,
  message,
  type,
  confirmText = "Confirm",
  cancelText = "Cancel",
  onConfirm,
  onCancel,
}: CustomModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-tile-black/20 backdrop-blur-sm animate-backdrop-in"
        onClick={onCancel}
      />

      {/* Modal Box */}
      <div className="relative w-full max-w-md bg-canvas border border-black/[0.08] rounded-lg p-7 apple-shadow-overlay z-10 text-center animate-modal-in">
        <button
          onClick={onCancel}
          className="absolute top-4 right-4 p-1.5 rounded-md text-ink-muted hover:text-ink hover:bg-canvas-parchment transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Icon */}
        <div className={`mx-auto w-14 h-14 rounded-full flex items-center justify-center mb-5 ${
          type === "confirm"
            ? "bg-primary/10 text-primary"
            : "bg-warning-light text-warning"
        }`}>
          {type === "confirm" ? (
            <HelpCircle className="w-7 h-7" />
          ) : (
            <AlertTriangle className="w-7 h-7" />
          )}
        </div>

        {/* Title & Message */}
        <h3 className="text-lg font-semibold text-ink mb-2">{title}</h3>
        <p className="text-sm text-ink-muted mb-7 leading-relaxed">{message}</p>

        {/* Buttons */}
        <div className="flex gap-3 justify-center">
          {type === "confirm" && (
            <button
              onClick={onCancel}
              className="flex-1 px-4 py-2.5 rounded-pill bg-canvas border border-black/[0.12] text-ink font-normal text-sm hover:bg-canvas-parchment transition cursor-pointer apple-press-effect"
            >
              {cancelText}
            </button>
          )}
          <button
            onClick={onConfirm}
            className={`px-6 py-2.5 rounded-pill font-normal text-sm transition-all cursor-pointer apple-press-effect ${
              type === "confirm"
                ? "flex-1 bg-primary text-white hover:bg-primary-focus"
                : "w-full bg-canvas border border-black/[0.12] text-ink hover:bg-canvas-parchment"
            }`}
          >
            {type === "confirm" ? confirmText : "OK"}
          </button>
        </div>
      </div>
    </div>
  );
}
