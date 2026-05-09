"use client";
import * as React from "react";
import { Upload, X, FileImage } from "lucide-react";
import { cn } from "@/lib/utils";

interface FileUploadProps {
  accept?: string;
  value?: File | null;
  onChange: (file: File | null) => void;
  className?: string;
  placeholder?: string;
}

export function FileUpload({ accept, value, onChange, className, placeholder = "คลิกเพื่อเลือกไฟล์" }: FileUploadProps) {
  const ref = React.useRef<HTMLInputElement>(null);

  return (
    <div className={cn("relative", className)}>
      <input
        ref={ref}
        type="file"
        accept={accept}
        className="sr-only"
        onChange={(e) => onChange(e.target.files?.[0] ?? null)}
      />
      {value ? (
        <div className="flex items-center gap-3 rounded-md border border-primary/40 bg-primary/5 px-3 py-2.5">
          <FileImage className="h-4 w-4 shrink-0 text-primary" />
          <span className="flex-1 truncate text-sm text-foreground">{value.name}</span>
          <button
            type="button"
            onClick={() => { onChange(null); if (ref.current) ref.current.value = ""; }}
            className="shrink-0 rounded-sm text-muted-foreground hover:text-destructive transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => ref.current?.click()}
          className="flex w-full items-center gap-3 rounded-md border border-dashed border-border bg-muted/40 px-3 py-3 text-sm text-muted-foreground transition-colors hover:border-primary/50 hover:bg-primary/5 hover:text-primary"
        >
          <Upload className="h-4 w-4 shrink-0" />
          <span>{placeholder}</span>
        </button>
      )}
    </div>
  );
}
