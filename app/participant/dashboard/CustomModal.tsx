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
        className="absolute inset-0 bg-black/70 backdrop-blur-sm animate-backdrop-in"
        onClick={onCancel}
      />

      {/* Modal Box */}
      <div className="relative w-full max-w-md bg-slate-900 border border-slate-800/60 rounded-2xl p-7 shadow-2xl z-10 text-center animate-modal-in">
        <button
          onClick={onCancel}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-500 hover:text-white hover:bg-slate-800 transition cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Icon */}
        <div className={`mx-auto w-14 h-14 rounded-2xl flex items-center justify-center mb-5 ${
          type === "confirm"
            ? "bg-teal-500/10 text-teal-400 border border-teal-500/20"
            : "bg-amber-500/10 text-amber-400 border border-amber-500/20"
        }`}>
          {type === "confirm" ? (
            <HelpCircle className="w-7 h-7" />
          ) : (
            <AlertTriangle className="w-7 h-7" />
          )}
        </div>

        {/* Title & Message */}
        <h3 className="text-lg font-bold text-white mb-2">{title}</h3>
        <p className="text-sm text-slate-400 mb-7 leading-relaxed">{message}</p>

        {/* Buttons */}
        <div className="flex gap-3 justify-center">
          {type === "confirm" && (
            <button
              onClick={onCancel}
              className="flex-1 px-4 py-2.5 rounded-xl bg-slate-800/60 border border-slate-700/40 text-slate-300 font-semibold text-sm hover:text-white hover:bg-slate-800 transition cursor-pointer"
            >
              {cancelText}
            </button>
          )}
          <button
            onClick={onConfirm}
            className={`px-6 py-2.5 rounded-xl font-bold text-sm transition-all duration-200 cursor-pointer hover:scale-[1.02] active:scale-95 ${
              type === "confirm"
                ? "flex-1 btn-cta-shimmer bg-gradient-to-r from-teal-500 to-emerald-500 text-slate-950 hover:brightness-110 shadow-[0_4px_15px_rgba(20,184,166,0.2)]"
                : "w-full bg-slate-800/60 border border-slate-700/40 text-white hover:bg-slate-800"
            }`}
          >
            {type === "confirm" ? confirmText : "OK"}
          </button>
        </div>
      </div>
    </div>
  );
}
