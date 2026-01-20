"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState, useCallback } from "react";
import { cn } from "~~/lib/utils/cn";

interface FileUploadCardProps {
  label: string;
  helperText?: string;
  accept?: string;
  onFileSelect: (file: File | null) => void;
  error?: string;
}

/**
 * FileUploadCard - File upload UI with mock progress and preview
 * Used for document uploads during KYC verification
 */
export function FileUploadCard({
  label,
  helperText,
  accept = "image/*,.pdf",
  onFileSelect,
  error,
}: FileUploadCardProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isDragOver, setIsDragOver] = useState(false);

  const handleFileChange = useCallback(
    async (selectedFile: File) => {
      setFile(selectedFile);
      setIsUploading(true);
      setProgress(0);

      // Mock upload progress
      const interval = setInterval(() => {
        setProgress((prev) => {
          if (prev >= 100) {
            clearInterval(interval);
            setIsUploading(false);
            return 100;
          }
          return prev + 10;
        });
      }, 100);

      onFileSelect(selectedFile);
    },
    [onFileSelect],
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      handleFileChange(selectedFile);
    }
  };

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragOver(false);
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile) {
        handleFileChange(droppedFile);
      }
    },
    [handleFileChange],
  );

  const handleRemove = () => {
    setFile(null);
    setProgress(0);
    onFileSelect(null);
  };

  const inputId = `upload-${label.toLowerCase().replace(/\s+/g, "-")}`;

  return (
    <div className="w-full">
      <label className="mb-2 block font-inter text-sm font-medium text-vaca-neutral-gray-700">
        {label}
      </label>

      <AnimatePresence mode="wait">
        {file && progress === 100 ? (
          // File selected state
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className={cn(
              "flex items-center gap-3 rounded-xl border-2 p-4",
              error ? "border-red-500 bg-red-50" : "border-vaca-green/30 bg-vaca-green/5",
            )}
          >
            {/* File icon */}
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-vaca-green/10">
              <svg
                className="h-5 w-5 text-vaca-green"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>

            {/* File info */}
            <div className="flex-1 overflow-hidden">
              <p className="truncate font-inter text-sm font-medium text-vaca-neutral-gray-900">
                {file.name}
              </p>
              <p className="text-xs text-vaca-neutral-gray-500">
                {(file.size / 1024).toFixed(1)} KB
              </p>
            </div>

            {/* Remove button */}
            <button
              type="button"
              onClick={handleRemove}
              className="flex h-8 w-8 items-center justify-center rounded-full text-vaca-neutral-gray-400 transition-colors hover:bg-vaca-neutral-gray-100 hover:text-vaca-neutral-gray-600"
              aria-label="Remove file"
            >
              <svg
                className="h-4 w-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>
          </motion.div>
        ) : isUploading ? (
          // Uploading state
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="rounded-xl border-2 border-vaca-neutral-gray-200 p-4"
          >
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 animate-pulse rounded-lg bg-vaca-neutral-gray-200" />
              <div className="flex-1">
                <p className="font-inter text-sm font-medium text-vaca-neutral-gray-700">
                  Uploading...
                </p>
                <div className="mt-2 h-2 w-full overflow-hidden rounded-full bg-vaca-neutral-gray-200">
                  <motion.div
                    className="h-full bg-vaca-green"
                    initial={{ width: 0 }}
                    animate={{ width: `${progress}%` }}
                  />
                </div>
              </div>
            </div>
          </motion.div>
        ) : (
          // Empty state - dropzone
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onDragOver={(e) => {
              e.preventDefault();
              setIsDragOver(true);
            }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={handleDrop}
            className={cn(
              "relative rounded-xl border-2 border-dashed p-6 text-center transition-colors",
              isDragOver
                ? "border-vaca-green bg-vaca-green/5"
                : error
                  ? "border-red-500 bg-red-50"
                  : "border-vaca-neutral-gray-300 hover:border-vaca-neutral-gray-400",
            )}
          >
            <input
              id={inputId}
              type="file"
              accept={accept}
              onChange={handleInputChange}
              className="absolute inset-0 cursor-pointer opacity-0"
              aria-describedby={helperText ? `${inputId}-helper` : undefined}
            />

            <div className="pointer-events-none">
              <svg
                className="mx-auto h-10 w-10 text-vaca-neutral-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={1.5}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.233-2.33 3 3 0 013.758 3.848A3.752 3.752 0 0118 19.5H6.75z"
                />
              </svg>
              <p className="mt-2 font-inter text-sm font-medium text-vaca-neutral-gray-700">
                Drop file here or{" "}
                <span className="text-vaca-green">browse</span>
              </p>
              {helperText && (
                <p
                  id={`${inputId}-helper`}
                  className="mt-1 text-xs text-vaca-neutral-gray-500"
                >
                  {helperText}
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {error && (
        <p className="mt-2 text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
