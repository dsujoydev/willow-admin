"use client";

import axios from "axios";
import {
  ArrowDown,
  ArrowUp,
  ImageIcon,
  Loader2,
  RefreshCw,
  Save,
  Trash2,
} from "lucide-react";
import Image from "next/image";
import { useCallback, useEffect, useState } from "react";

import { ImageUpload, MultiImageUpload } from "@/components/image-upload";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import api from "@/lib/api";

type SiteMediaImage = {
  _id: string;
  url: string;
  publicId: string;
  alt: string;
  width?: number;
  height?: number;
  order: number;
};

type SiteMediaDocument = {
  _id: string;
  key: string;
  label: string;
  mode: "single" | "gallery";
  images: SiteMediaImage[];
  updatedAt: string;
};

function errorMessage(error: unknown) {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as { message?: string } | undefined;
    return data?.message ?? error.message;
  }
  return error instanceof Error ? error.message : "Something went wrong.";
}

export default function SiteMediaPage() {
  const [placements, setPlacements] = useState<SiteMediaDocument[]>([]);
  const [altDrafts, setAltDrafts] = useState<Record<string, string>>({});
  const [uploadAlt, setUploadAlt] = useState<Record<string, string>>({});
  const [busyKey, setBusyKey] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const applyPlacement = useCallback((placement: SiteMediaDocument) => {
    placement.images.sort((left, right) => left.order - right.order);
    setPlacements((current) =>
      current.map((item) => (item.key === placement.key ? placement : item)),
    );
    setAltDrafts((current) => {
      const next = { ...current };
      for (const image of placement.images) next[image._id] = image.alt;
      return next;
    });
  }, []);

  const load = useCallback(async (showLoading = true) => {
    if (showLoading) setLoading(true);
    setError("");
    try {
      const response = await api.get<{ data: SiteMediaDocument[] }>(
        "/site-media",
      );
      const data = response.data.data.map((placement) => ({
        ...placement,
        images: [...placement.images].sort(
          (left, right) => left.order - right.order,
        ),
      }));
      setPlacements(data);
      setAltDrafts(
        Object.fromEntries(
          data.flatMap((placement) =>
            placement.images.map((image) => [image._id, image.alt]),
          ),
        ),
      );
    } catch (requestError) {
      setError(errorMessage(requestError));
    } finally {
      if (showLoading) setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function upload(placement: SiteMediaDocument, file: File) {
    const alt = uploadAlt[placement.key]?.trim();
    if (!alt) throw new Error("Provide alt text before uploading an image.");

    setError("");
    const body = new FormData();
    body.append("image", file);
    body.append("alt", alt);
    const response = await api.post<{ data: SiteMediaDocument }>(
      `/site-media/${placement.key}/images`,
      body,
    );
    const uploadedImage = [...response.data.data.images]
      .sort((left, right) => left.order - right.order)
      .at(-1);
    if (!uploadedImage)
      throw new Error("The upload response did not include an image.");
    return uploadedImage.url;
  }

  function handleUploadChange(placement: SiteMediaDocument, values: string[]) {
    const currentUrls = new Set(placement.images.map((image) => image.url));
    const removedImage = placement.images.find(
      (image) => !values.includes(image.url),
    );

    if (removedImage) {
      void removeImage(placement, removedImage);
      return;
    }

    if (values.some((url) => !currentUrls.has(url))) {
      setUploadAlt((current) => ({ ...current, [placement.key]: "" }));
      void load(false);
    }
  }

  async function saveAltText(placement: SiteMediaDocument) {
    setBusyKey(placement.key);
    setError("");
    try {
      const response = await api.patch<{ data: SiteMediaDocument }>(
        `/site-media/${placement.key}`,
        {
          images: placement.images.map((image) => ({
            id: image._id,
            alt: altDrafts[image._id]?.trim(),
          })),
        },
      );
      applyPlacement(response.data.data);
    } catch (requestError) {
      setError(errorMessage(requestError));
    } finally {
      setBusyKey("");
    }
  }

  async function removeImage(
    placement: SiteMediaDocument,
    image: SiteMediaImage,
  ) {
    if (!window.confirm(`Delete “${image.alt}” from ${placement.label}?`))
      return;
    setBusyKey(placement.key);
    setError("");
    try {
      const response = await api.delete<{ data: SiteMediaDocument }>(
        `/site-media/${placement.key}/images/${image._id}`,
      );
      applyPlacement(response.data.data);
    } catch (requestError) {
      setError(errorMessage(requestError));
    } finally {
      setBusyKey("");
    }
  }

  async function moveImage(
    placement: SiteMediaDocument,
    index: number,
    direction: -1 | 1,
  ) {
    const target = index + direction;
    if (target < 0 || target >= placement.images.length) return;
    const reordered = [...placement.images];
    [reordered[index], reordered[target]] = [
      reordered[target],
      reordered[index],
    ];
    setBusyKey(placement.key);
    setError("");
    try {
      const response = await api.put<{ data: SiteMediaDocument }>(
        `/site-media/${placement.key}/order`,
        {
          imageIds: reordered.map((image) => image._id),
        },
      );
      applyPlacement(response.data.data);
    } catch (requestError) {
      setError(errorMessage(requestError));
    } finally {
      setBusyKey("");
    }
  }

  return (
    <main className="flex-1 bg-muted/20 p-4 sm:p-6">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex items-start justify-between gap-4">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight">
              Site media
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Manage website imagery by placement. Single placements replace
              their current image automatically.
            </p>
          </div>
          <Button
            variant="outline"
            onClick={() => void load()}
            disabled={loading}
          >
            <RefreshCw className={loading ? "animate-spin" : ""} />
            Refresh
          </Button>
        </div>

        {error && (
          <p
            role="alert"
            className="mb-5 rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive"
          >
            {error}
          </p>
        )}

        {loading ? (
          <div className="grid min-h-64 place-items-center text-muted-foreground">
            <Loader2 className="size-5 animate-spin" />
          </div>
        ) : (
          <div className="space-y-5">
            {placements.map((placement) => {
              const busy = busyKey === placement.key;
              return (
                <section
                  key={placement.key}
                  className="overflow-hidden rounded-xl border bg-card shadow-sm"
                >
                  <div className="flex flex-col gap-4 border-b p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="font-semibold">{placement.label}</h2>
                        <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium uppercase text-muted-foreground">
                          {placement.mode}
                        </span>
                      </div>
                      <p className="mt-1 font-mono text-xs text-muted-foreground">
                        {placement.key}
                      </p>
                    </div>
                    <div className="flex w-full flex-col gap-2 sm:w-auto sm:min-w-80">
                      <Input
                        value={uploadAlt[placement.key] ?? ""}
                        onChange={(event) =>
                          setUploadAlt((current) => ({
                            ...current,
                            [placement.key]: event.target.value,
                          }))
                        }
                        placeholder="New image alt text"
                        maxLength={240}
                        className="h-8"
                        disabled={busy}
                      />
                      {placement.mode === "single" ? (
                        <ImageUpload
                          id={`${placement.key}-upload`}
                          value={placement.images[0]?.url ?? ""}
                          onChange={(value) =>
                            handleUploadChange(placement, value ? [value] : [])
                          }
                          uploadFile={(file) => upload(placement, file)}
                          onUploadingChange={(uploading) =>
                            setBusyKey(uploading ? placement.key : "")
                          }
                          disabled={busy}
                        />
                      ) : (
                        <MultiImageUpload
                          id={`${placement.key}-upload`}
                          values={placement.images.map((image) => image.url)}
                          onChange={(values) =>
                            handleUploadChange(placement, values)
                          }
                          uploadFile={(file) => upload(placement, file)}
                          onUploadingChange={(uploading) =>
                            setBusyKey(uploading ? placement.key : "")
                          }
                          disabled={busy}
                        />
                      )}
                    </div>
                  </div>

                  {placement.images.length === 0 ? (
                    <div className="grid min-h-40 place-items-center p-6 text-center text-muted-foreground">
                      <div>
                        <ImageIcon className="mx-auto size-7" />
                        <p className="mt-2 text-sm">
                          No image uploaded for this placement.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <div className="grid gap-4 p-4 md:grid-cols-2 xl:grid-cols-3">
                      {placement.images.map((image, index) => (
                        <article
                          key={image._id}
                          className="overflow-hidden rounded-lg border bg-background"
                        >
                          <div className="relative aspect-[16/9] bg-muted">
                            <Image
                              src={image.url}
                              alt={image.alt}
                              fill
                              unoptimized
                              className="object-cover"
                            />
                            <span className="absolute top-2 left-2 rounded bg-black/65 px-1.5 py-0.5 text-[10px] text-white">
                              {index + 1}
                            </span>
                          </div>
                          <div className="space-y-3 p-3">
                            <Input
                              value={altDrafts[image._id] ?? ""}
                              onChange={(event) =>
                                setAltDrafts((current) => ({
                                  ...current,
                                  [image._id]: event.target.value,
                                }))
                              }
                              maxLength={240}
                              aria-label={`Alt text for ${placement.label} image ${index + 1}`}
                              disabled={busy}
                            />
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex gap-1">
                                {placement.mode === "gallery" && (
                                  <>
                                    <Button
                                      variant="outline"
                                      size="icon-sm"
                                      aria-label="Move image up"
                                      disabled={busy || index === 0}
                                      onClick={() =>
                                        void moveImage(placement, index, -1)
                                      }
                                    >
                                      <ArrowUp />
                                    </Button>
                                    <Button
                                      variant="outline"
                                      size="icon-sm"
                                      aria-label="Move image down"
                                      disabled={
                                        busy ||
                                        index === placement.images.length - 1
                                      }
                                      onClick={() =>
                                        void moveImage(placement, index, 1)
                                      }
                                    >
                                      <ArrowDown />
                                    </Button>
                                  </>
                                )}
                              </div>
                              <Button
                                variant="destructive"
                                size="icon-sm"
                                aria-label="Delete image"
                                disabled={busy}
                                onClick={() =>
                                  void removeImage(placement, image)
                                }
                              >
                                <Trash2 />
                              </Button>
                            </div>
                          </div>
                        </article>
                      ))}
                    </div>
                  )}

                  {placement.images.length > 0 && (
                    <div className="flex justify-end border-t p-3">
                      <Button
                        onClick={() => void saveAltText(placement)}
                        disabled={busy}
                      >
                        {busy ? <Loader2 className="animate-spin" /> : <Save />}
                        Save alt text
                      </Button>
                    </div>
                  )}
                </section>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}
