"use client";

import axios from "axios";
import { ImageIcon, Loader2, Trash2, Upload } from "lucide-react";
import { useId, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

const IMAGE_UPLOAD_URL = "http://localhost:3005/api/images";
const MAX_FILE_SIZE = 5 * 1024 * 1024;
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif", "image/avif"];

type ImageUploadProps = {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  onUploadingChange?: (uploading: boolean) => void;
};

type MultiImageUploadProps = {
  id?: string;
  values: string[];
  onChange: (values: string[]) => void;
  disabled?: boolean;
  onUploadingChange?: (uploading: boolean) => void;
};

type PendingImage = {
  id: string;
  previewUrl: string;
};

function getUploadUrl(payload: unknown): string | null {
  if (!payload || typeof payload !== "object") return null;

  const response = payload as Record<string, unknown>;
  for (const key of ["url", "secure_url", "imageUrl"]) {
    if (typeof response[key] === "string") return response[key];
  }

  if (response.data && typeof response.data === "object") {
    const data = response.data as Record<string, unknown>;
    for (const key of ["url", "secure_url", "imageUrl"]) {
      if (typeof data[key] === "string") return data[key];
    }

    if (data.image && typeof data.image === "object") {
      const image = data.image as Record<string, unknown>;
      if (typeof image.url === "string") return image.url;
      if (typeof image.secure_url === "string") return image.secure_url;
    }
  }

  return null;
}

function getUploadError(error: unknown) {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as { message?: string; error?: string } | undefined;
    return data?.message ?? data?.error ?? error.message;
  }
  return error instanceof Error ? error.message : "Image upload failed.";
}

function validateFile(file: File) {
  if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
    return `${file.name} is not a supported image.`;
  }
  if (file.size > MAX_FILE_SIZE) {
    return `${file.name} is larger than 5 MB.`;
  }
  return null;
}

async function uploadImage(file: File) {
  const formData = new FormData();
  formData.append("image", file);

  const response = await axios.post(IMAGE_UPLOAD_URL, formData);
  const url = getUploadUrl(response.data);
  if (!url) throw new Error("The upload response did not include an image URL.");
  return url;
}

function Preview({ src, label }: { src: string; label: string }) {
  return (
    <div
      role="img"
      aria-label={label}
      className="size-full bg-cover bg-center bg-no-repeat"
      style={{ backgroundImage: `url(${JSON.stringify(src)})` }}
    />
  );
}

// Compact single-image (cover) uploader: a small square thumbnail with
// inline action buttons, instead of a full-width aspect-video block.
export function ImageUpload({ id, value, onChange, disabled, onUploadingChange }: ImageUploadProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState("");
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");

  async function handleFile(file: File | undefined) {
    if (!file) return;
    const validationError = validateFile(file);
    if (validationError) {
      setError(validationError);
      return;
    }

    const previewUrl = URL.createObjectURL(file);
    setPreview(previewUrl);
    setError("");
    setUploading(true);
    onUploadingChange?.(true);

    try {
      onChange(await uploadImage(file));
    } catch (uploadError) {
      setError(getUploadError(uploadError));
    } finally {
      setUploading(false);
      onUploadingChange?.(false);
      setPreview("");
      URL.revokeObjectURL(previewUrl);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  const displayedImage = preview || value;

  return (
    <div className="space-y-2">
      <Input
        ref={inputRef}
        id={inputId}
        type="file"
        accept={ACCEPTED_IMAGE_TYPES.join(",")}
        className="sr-only"
        disabled={disabled || uploading}
        onChange={(event) => void handleFile(event.target.files?.[0])}
      />

      <div className="flex items-center gap-3">
        {displayedImage ? (
          <div className="group relative size-20 shrink-0 overflow-hidden rounded-lg border bg-muted">
            <Preview src={displayedImage} label="Cover image preview" />
            {uploading && (
              <div className="absolute inset-0 grid place-items-center bg-black/45 text-white">
                <Loader2 className="size-4 animate-spin" />
              </div>
            )}
          </div>
        ) : (
          <button
            type="button"
            className="flex size-20 shrink-0 flex-col items-center justify-center gap-1 rounded-lg border border-dashed bg-muted/30 text-muted-foreground transition-colors hover:bg-muted/60 disabled:cursor-not-allowed disabled:opacity-50"
            onClick={() => inputRef.current?.click()}
            disabled={disabled || uploading}
          >
            {uploading ? <Loader2 className="size-5 animate-spin" /> : <ImageIcon className="size-5" />}
          </button>
        )}

        <div className="flex min-w-0 flex-col gap-1.5">
          <span className="text-xs text-muted-foreground">PNG, JPG, WebP, GIF or AVIF · max 5 MB</span>
          <div className="flex gap-2">
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => inputRef.current?.click()}
              disabled={disabled || uploading}
            >
              <Upload />
              {displayedImage ? "Replace" : "Upload"}
            </Button>
            {displayedImage && !uploading && (
              <Button
                type="button"
                size="icon-sm"
                variant="ghost"
                aria-label="Remove cover image"
                onClick={() => onChange("")}
                disabled={disabled}
              >
                <Trash2 />
              </Button>
            )}
          </div>
        </div>
      </div>

      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}

// Compact multi-image (gallery) uploader: small fixed-size tiles that wrap,
// instead of a wide responsive grid, so the modal stays narrow.
export function MultiImageUpload({ id, values, onChange, disabled, onUploadingChange }: MultiImageUploadProps) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const inputRef = useRef<HTMLInputElement>(null);
  const [pending, setPending] = useState<PendingImage[]>([]);
  const [error, setError] = useState("");
  const uploading = pending.length > 0;

  async function handleFiles(selectedFiles: FileList | null) {
    const files = Array.from(selectedFiles ?? []);
    if (!files.length) return;

    const validationErrors = files.map(validateFile).filter(Boolean) as string[];
    if (validationErrors.length) {
      setError(validationErrors.join(" "));
      if (inputRef.current) inputRef.current.value = "";
      return;
    }

    const pendingImages = files.map((file, index) => ({
      id: `${file.name}-${file.lastModified}-${index}`,
      previewUrl: URL.createObjectURL(file),
    }));
    setPending(pendingImages);
    setError("");
    onUploadingChange?.(true);

    const results = await Promise.allSettled(files.map(uploadImage));
    const uploadedUrls = results.flatMap((result) => (result.status === "fulfilled" ? [result.value] : []));
    const failed = results.filter((result) => result.status === "rejected");

    if (uploadedUrls.length) {
      onChange(Array.from(new Set([...values, ...uploadedUrls])));
    }
    if (failed.length) {
      const firstFailure = failed[0] as PromiseRejectedResult;
      setError(
        `${failed.length} image${failed.length === 1 ? "" : "s"} failed to upload. ${getUploadError(firstFailure.reason)}`,
      );
    }

    for (const item of pendingImages) URL.revokeObjectURL(item.previewUrl);
    setPending([]);
    onUploadingChange?.(false);
    if (inputRef.current) inputRef.current.value = "";
  }

  function removeImage(index: number) {
    onChange(values.filter((_, imageIndex) => imageIndex !== index));
  }

  return (
    <div className="min-w-0 space-y-2">
      <Input
        ref={inputRef}
        id={inputId}
        type="file"
        multiple
        accept={ACCEPTED_IMAGE_TYPES.join(",")}
        className="sr-only"
        disabled={disabled || uploading}
        onChange={(event) => void handleFiles(event.target.files)}
      />

      <div className="flex min-w-0 flex-wrap gap-2">
        {values.map((imageUrl, index) => (
          <div key={imageUrl} className="group relative size-20 shrink-0 overflow-hidden rounded-lg border bg-muted">
            <Preview src={imageUrl} label={`Gallery image ${index + 1}`} />
            <Button
              type="button"
              size="icon-sm"
              variant="destructive"
              className="absolute top-1 right-1 size-6 opacity-100 sm:opacity-0 sm:transition-opacity sm:group-hover:opacity-100"
              aria-label={`Remove gallery image ${index + 1}`}
              onClick={() => removeImage(index)}
              disabled={disabled || uploading}
            >
              <Trash2 className="size-3" />
            </Button>
          </div>
        ))}

        {pending.map((image, index) => (
          <div key={image.id} className="relative size-20 shrink-0 overflow-hidden rounded-lg border bg-muted">
            <Preview src={image.previewUrl} label={`Uploading image ${index + 1}`} />
            <div className="absolute inset-0 grid place-items-center bg-black/45 text-white">
              <Loader2 className="size-4 animate-spin" />
            </div>
          </div>
        ))}

        <button
          type="button"
          className="flex size-20 shrink-0 flex-col items-center justify-center gap-1 rounded-lg border border-dashed bg-muted/30 text-center text-[10px] text-muted-foreground transition-colors hover:bg-muted/60 disabled:cursor-not-allowed disabled:opacity-50"
          onClick={() => inputRef.current?.click()}
          disabled={disabled || uploading}
        >
          {uploading ? <Loader2 className="size-4 animate-spin" /> : <Upload className="size-4" />}
          <span className="font-medium text-foreground">{values.length ? "Add more" : "Upload"}</span>
        </button>
      </div>

      <p className="text-xs text-muted-foreground">PNG, JPG, WebP, GIF or AVIF · max 5 MB each.</p>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
