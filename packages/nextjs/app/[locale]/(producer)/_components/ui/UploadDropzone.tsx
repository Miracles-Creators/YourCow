import { cn } from "~~/lib/utils/cn";

interface UploadDropzoneProps {
  id: string;
  label: string;
  helper?: string;
  required?: boolean;
  accept?: string;
  acceptLabel?: string;
  progress?: number | null;
  onFileSelect?: (file: File | null) => void;
}

export function UploadDropzone({
  id,
  label,
  helper,
  required = false,
  accept,
  acceptLabel,
  progress,
  onFileSelect,
}: UploadDropzoneProps) {
  const progressValue =
    typeof progress === "number"
      ? Math.min(100, Math.max(0, progress))
      : null;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <p className="text-sm font-semibold text-vaca-neutral-gray-700">
          {label}
        </p>
        {required && (
          <span className="rounded-full bg-vaca-brown/10 px-2 py-0.5 text-[11px] font-semibold text-vaca-brown">
            Required
          </span>
        )}
      </div>
      {helper && <p className="text-xs text-vaca-neutral-gray-500">{helper}</p>}
      <label
        htmlFor={id}
        className={cn(
          "flex min-h-[120px] cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-vaca-neutral-gray-200 bg-vaca-neutral-white p-4 text-center text-sm text-vaca-neutral-gray-500",
          "transition-colors hover:border-vaca-blue hover:text-vaca-blue",
        )}
      >
        <span className="font-medium">Drag & drop or click to upload</span>
        <span className="text-xs">{acceptLabel ?? "PDF, PNG, or JPG"}</span>
        <input
          id={id}
          type="file"
          accept={accept}
          className="hidden"
          onChange={(event) => onFileSelect?.(event.target.files?.[0] ?? null)}
          aria-label={`${label} upload`}
        />
      </label>
      {progressValue !== null && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs text-vaca-neutral-gray-500">
            <span>Upload progress</span>
            <span className="font-semibold">{progressValue}%</span>
          </div>
          <div className="h-2 w-full rounded-full bg-vaca-neutral-gray-100">
            <div
              className="h-2 rounded-full bg-vaca-blue"
              style={{ width: `${progressValue}%` }}
            />
          </div>
        </div>
      )}
    </div>
  );
}
