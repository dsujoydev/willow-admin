"use client";

import axios from "axios";
import {
  CheckCircle2,
  Eye,
  Loader2,
  Pencil,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  XCircle,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

import CreateModal, {
  type BedType,
  type RoomCategoryFormState,
} from "@/components/modal/room-category/CreateModal";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import api from "@/lib/api";

type RoomCategory = {
  _id?: string;
  id?: string;
  name: string;
  featured: boolean;
  showOnWebsite: boolean;
  slug?: string;
  bedType: BedType;
  roomSize?: number;
  view?: string;
  hasMiniFridge?: boolean;
  hasGeyser?: boolean;
  hasBalcony?: boolean;
  maxGuests?: number;
  amenities?: string[];
  rent?: number;
  currency?: string;
  discountPercent?: number;
  image?: string;
  images?: string[];
  description?: string;
  shortDescription?: string;
  popularityRank?: number;
  recommendedRank?: number;
  available?: boolean;
  availableRoomCount?: number;
  createdAt?: string;
  updatedAt?: string;
};

const emptyForm: RoomCategoryFormState = {
  name: "",
  featured: false,
  showOnWebsite: false,
  slug: "",
  bedType: "",
  roomSize: "",
  view: "",
  hasMiniFridge: false,
  hasGeyser: false,
  hasBalcony: false,
  maxGuests: "",
  amenities: "",
  rent: "",
  currency: "BDT",
  discountPercent: "",
  image: "",
  images: "",
  description: "",
  shortDescription: "",
  popularityRank: "",
  recommendedRank: "",
  available: true,
  availableRoomCount: "",
};

const numberFields = [
  "roomSize",
  "maxGuests",
  "rent",
  "discountPercent",
  "popularityRank",
  "recommendedRank",
  "availableRoomCount",
] as const;

function getCategoryId(category: RoomCategory) {
  return category._id ?? category.id ?? "";
}

function extractCategories(payload: unknown): RoomCategory[] {
  if (Array.isArray(payload)) return payload as RoomCategory[];
  if (!payload || typeof payload !== "object") return [];

  const value = payload as Record<string, unknown>;
  if (Array.isArray(value.data)) return value.data as RoomCategory[];
  if (Array.isArray(value.roomCategories)) {
    return value.roomCategories as RoomCategory[];
  }
  if (Array.isArray(value.results)) return value.results as RoomCategory[];

  if (value.data && typeof value.data === "object") {
    const nested = value.data as Record<string, unknown>;
    if (Array.isArray(nested.roomCategories)) {
      return nested.roomCategories as RoomCategory[];
    }
    if (Array.isArray(nested.results)) return nested.results as RoomCategory[];
    if (Array.isArray(nested.docs)) return nested.docs as RoomCategory[];
  }

  return [];
}

function extractCategory(payload: unknown): RoomCategory | null {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return null;
  }

  const value = payload as Record<string, unknown>;
  const candidate = value.data ?? value.roomCategory ?? value.result ?? value;
  if (!candidate || typeof candidate !== "object" || Array.isArray(candidate)) {
    return null;
  }

  const nested = candidate as Record<string, unknown>;
  const category = nested.roomCategory ?? nested.result ?? candidate;
  return category && typeof category === "object" && !Array.isArray(category)
    ? (category as RoomCategory)
    : null;
}

function getErrorMessage(error: unknown) {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as
      | { message?: string; error?: string }
      | undefined;
    return data?.message ?? data?.error ?? error.message;
  }
  return error instanceof Error ? error.message : "Something went wrong.";
}

function categoryToForm(category: RoomCategory): RoomCategoryFormState {
  const asText = (value: number | undefined) =>
    value === undefined || value === null ? "" : String(value);

  return {
    name: category.name ?? "",
    featured: Boolean(category.featured),
    showOnWebsite: Boolean(category.showOnWebsite),
    slug: category.slug ?? "",
    bedType: category.bedType ?? "",
    roomSize: asText(category.roomSize),
    view: category.view ?? "",
    hasMiniFridge: Boolean(category.hasMiniFridge),
    hasGeyser: Boolean(category.hasGeyser),
    hasBalcony: Boolean(category.hasBalcony),
    maxGuests: asText(category.maxGuests),
    amenities: category.amenities?.join(", ") ?? "",
    rent: asText(category.rent),
    currency: category.currency ?? "BDT",
    discountPercent: asText(category.discountPercent),
    image: category.image ?? "",
    images: category.images?.join("\n") ?? "",
    description: category.description ?? "",
    shortDescription: category.shortDescription ?? "",
    popularityRank: asText(category.popularityRank),
    recommendedRank: asText(category.recommendedRank),
    available: category.available ?? true,
    availableRoomCount: asText(category.availableRoomCount),
  };
}

function buildPayload(form: RoomCategoryFormState) {
  const payload: Record<string, string | number | boolean | string[]> = {
    name: form.name.trim(),
    featured: form.featured,
    showOnWebsite: form.showOnWebsite,
    bedType: form.bedType.trim(),
    currency: form.currency.trim().toUpperCase(),
    available: form.available,
    hasMiniFridge: form.hasMiniFridge,
    hasGeyser: form.hasGeyser,
    hasBalcony: form.hasBalcony,
  };

  const optionalText = [
    "slug",
    "view",
    "image",
    "description",
    "shortDescription",
  ] as const;
  for (const field of optionalText) {
    const value = form[field].trim();
    if (value) payload[field] = value;
  }

  for (const field of numberFields) {
    if (form[field] !== "") payload[field] = Number(form[field]);
  }

  const amenities = form.amenities
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
  if (amenities.length) payload.amenities = amenities;

  const images = form.images
    .split(/\n|,/)
    .map((item) => item.trim())
    .filter(Boolean);
  if (images.length) payload.images = images;

  return payload;
}

function StatusPill({
  active,
  labels,
}: {
  active: boolean;
  labels: [string, string];
}) {
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2 py-1 text-xs font-medium ${
        active ? "bg-emerald-50 text-emerald-700" : "bg-zinc-100 text-zinc-600"
      }`}
    >
      {active ? (
        <CheckCircle2 className="size-3" />
      ) : (
        <XCircle className="size-3" />
      )}
      {active ? labels[0] : labels[1]}
    </span>
  );
}

function DetailItem({
  label,
  children,
  className = "",
}: {
  label: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={`rounded-lg border bg-muted/20 p-3 ${className}`}>
      <dt className="text-xs font-medium tracking-wide text-muted-foreground uppercase">
        {label}
      </dt>
      <dd className="mt-1 text-sm break-words">{children || "—"}</dd>
    </div>
  );
}

function YesNo({ value }: { value?: boolean }) {
  return value ? "Yes" : "No";
}

function formatDate(value?: string) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-GB", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export default function RoomCategoryView() {
  const [categories, setCategories] = useState<RoomCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsError, setDetailsError] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<RoomCategory | null>(
    null,
  );
  const [editingCategory, setEditingCategory] = useState<RoomCategory | null>(
    null,
  );
  const [categoryToDelete, setCategoryToDelete] = useState<RoomCategory | null>(
    null,
  );
  const [form, setForm] = useState<RoomCategoryFormState>(emptyForm);

  const loadCategories = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await api.get("/room-categories");
      setCategories(extractCategories(response.data));
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadCategories();
  }, [loadCategories]);

  const filteredCategories = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return categories;
    return categories.filter((category) =>
      [category.name, category.slug, category.bedType, category.view]
        .filter(Boolean)
        .some((value) => value?.toLowerCase().includes(query)),
    );
  }, [categories, search]);

  function updateForm<K extends keyof RoomCategoryFormState>(
    field: K,
    value: RoomCategoryFormState[K],
  ) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function openCreateDialog() {
    setEditingCategory(null);
    setForm(emptyForm);
    setError("");
    setFormOpen(true);
  }

  function openEditDialog(category: RoomCategory) {
    setEditingCategory(category);
    setForm(categoryToForm(category));
    setError("");
    setFormOpen(true);
  }

  async function openDetailsDialog(category: RoomCategory) {
    const id = getCategoryId(category);
    setSelectedCategory(null);
    setDetailsError("");
    setDetailsOpen(true);

    if (!id) {
      setDetailsError("This category has no valid ID.");
      return;
    }

    setDetailsLoading(true);
    try {
      const response = await api.get(`/room-categories/${id}`);
      const details = extractCategory(response.data);
      if (!details) throw new Error("The category details could not be read.");
      setSelectedCategory(details);
    } catch (requestError) {
      setDetailsError(getErrorMessage(requestError));
    } finally {
      setDetailsLoading(false);
    }
  }

  async function submitForm(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");

    try {
      const id = editingCategory ? getCategoryId(editingCategory) : "";
      if (editingCategory && !id)
        throw new Error("This category has no valid ID.");

      if (editingCategory) {
        await api.patch(`/room-categories/${id}`, buildPayload(form));
      } else {
        await api.post("/room-categories", buildPayload(form));
      }
      setFormOpen(false);
      setEditingCategory(null);
      setForm(emptyForm);
      await loadCategories();
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setSaving(false);
    }
  }

  function askToDelete(category: RoomCategory) {
    setCategoryToDelete(category);
    setError("");
    setDeleteOpen(true);
  }

  async function confirmDelete() {
    if (!categoryToDelete) return;
    const id = getCategoryId(categoryToDelete);
    if (!id) {
      setError("This category has no valid ID.");
      return;
    }

    setDeleting(true);
    setError("");
    try {
      await api.delete(`/room-categories/${id}`);
      setDeleteOpen(false);
      setCategoryToDelete(null);
      await loadCategories();
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setDeleting(false);
    }
  }

  return (
    <main className="min-h-screen bg-zinc-50 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">
              Inventory
            </p>
            <h1 className="mt-1 text-2xl font-semibold tracking-tight">
              Room categories
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Manage room types, pricing, availability, and website visibility.
            </p>
          </div>
          <Button onClick={openCreateDialog} size="lg">
            <Plus data-icon="inline-start" />
            Add Category
          </Button>
        </div>

        <section className="overflow-hidden rounded-xl border bg-card shadow-sm">
          <div className="flex flex-col gap-3 border-b p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative w-full sm:max-w-sm">
              <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                aria-label="Search room categories"
                className="pl-9"
                placeholder="Search categories..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm text-muted-foreground">
                {filteredCategories.length} categor
                {filteredCategories.length === 1 ? "y" : "ies"}
              </span>
              <Button
                variant="outline"
                size="icon"
                aria-label="Refresh categories"
                onClick={() => void loadCategories()}
                disabled={loading}
              >
                <RefreshCw className={loading ? "animate-spin" : ""} />
              </Button>
            </div>
          </div>

          {error && !formOpen && !deleteOpen && (
            <div className="m-4 rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <Table>
            <TableHeader>
              <TableRow className="bg-muted/40 hover:bg-muted/40">
                <TableHead className="pl-4">Category</TableHead>
                <TableHead>Bed type</TableHead>
                <TableHead>Guests</TableHead>
                <TableHead>Rent</TableHead>
                <TableHead>Website</TableHead>
                <TableHead>Availability</TableHead>
                <TableHead className="pr-4 text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-40 text-center">
                    <Loader2 className="mx-auto mb-2 size-5 animate-spin text-muted-foreground" />
                    <span className="text-muted-foreground">
                      Loading categories...
                    </span>
                  </TableCell>
                </TableRow>
              ) : filteredCategories.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="h-40 text-center">
                    <p className="font-medium">No room categories found</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      {search
                        ? "Try a different search term."
                        : "Add your first category to get started."}
                    </p>
                  </TableCell>
                </TableRow>
              ) : (
                filteredCategories.map((category) => (
                  <TableRow key={getCategoryId(category) || category.name}>
                    <TableCell className="pl-4">
                      <div className="font-medium">{category.name}</div>
                      <div className="mt-0.5 text-xs text-muted-foreground">
                        {category.slug || "No slug"}
                        {category.featured && (
                          <span className="ml-2 rounded-full bg-amber-50 px-1.5 py-0.5 font-medium text-amber-700">
                            Featured
                          </span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>{category.bedType || "—"}</TableCell>
                    <TableCell>{category.maxGuests ?? "—"}</TableCell>
                    <TableCell>
                      {category.rent === undefined
                        ? "—"
                        : `${category.currency ?? "BDT"} ${category.rent.toLocaleString()}`}
                    </TableCell>
                    <TableCell>
                      <StatusPill
                        active={category.showOnWebsite}
                        labels={["Visible", "Hidden"]}
                      />
                    </TableCell>
                    <TableCell>
                      <StatusPill
                        active={category.available ?? true}
                        labels={["Available", "Unavailable"]}
                      />
                    </TableCell>
                    <TableCell className="pr-4 text-right">
                      <div className="flex justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          aria-label={`View ${category.name}`}
                          onClick={() => void openDetailsDialog(category)}
                        >
                          <Eye />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          aria-label={`Edit ${category.name}`}
                          onClick={() => openEditDialog(category)}
                        >
                          <Pencil />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          className="text-destructive hover:text-destructive"
                          aria-label={`Delete ${category.name}`}
                          onClick={() => askToDelete(category)}
                        >
                          <Trash2 />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </section>
      </div>

      <CreateModal
        open={formOpen}
        onOpenChange={setFormOpen}
        isEditing={Boolean(editingCategory)}
        form={form}
        onFormChange={updateForm}
        onSubmit={submitForm}
        saving={saving}
        error={error}
      />
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-3xl">
          <DialogHeader className="pr-8">
            <DialogTitle>Room category details</DialogTitle>
            <DialogDescription>
              Complete room-category information from the server.
            </DialogDescription>
          </DialogHeader>

          {detailsLoading ? (
            <div className="flex min-h-48 items-center justify-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="size-5 animate-spin" />
              Loading category details...
            </div>
          ) : detailsError ? (
            <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">
              {detailsError}
            </div>
          ) : selectedCategory ? (
            <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              <DetailItem label="Name" className="sm:col-span-2">
                {selectedCategory.name}
              </DetailItem>
              <DetailItem label="Slug">{selectedCategory.slug}</DetailItem>
              <DetailItem label="Bed type">
                {selectedCategory.bedType}
              </DetailItem>
              <DetailItem label="Room size">
                {selectedCategory.roomSize}
              </DetailItem>
              <DetailItem label="View">{selectedCategory.view}</DetailItem>
              <DetailItem label="Maximum guests">
                {selectedCategory.maxGuests}
              </DetailItem>
              <DetailItem label="Rent">
                {selectedCategory.rent === undefined
                  ? "—"
                  : `${selectedCategory.currency ?? "BDT"} ${selectedCategory.rent.toLocaleString()}`}
              </DetailItem>
              <DetailItem label="Discount">
                {selectedCategory.discountPercent === undefined
                  ? "—"
                  : `${selectedCategory.discountPercent}%`}
              </DetailItem>
              <DetailItem label="Available rooms">
                {selectedCategory.availableRoomCount}
              </DetailItem>
              <DetailItem label="Available">
                <YesNo value={selectedCategory.available} />
              </DetailItem>
              <DetailItem label="Website visible">
                <YesNo value={selectedCategory.showOnWebsite} />
              </DetailItem>
              <DetailItem label="Featured">
                <YesNo value={selectedCategory.featured} />
              </DetailItem>
              <DetailItem label="Mini fridge">
                <YesNo value={selectedCategory.hasMiniFridge} />
              </DetailItem>
              <DetailItem label="Geyser">
                <YesNo value={selectedCategory.hasGeyser} />
              </DetailItem>
              <DetailItem label="Balcony">
                <YesNo value={selectedCategory.hasBalcony} />
              </DetailItem>
              <DetailItem label="Popularity rank">
                {selectedCategory.popularityRank}
              </DetailItem>
              <DetailItem label="Recommended rank">
                {selectedCategory.recommendedRank}
              </DetailItem>
              <DetailItem label="Amenities" className="sm:col-span-2">
                {selectedCategory.amenities?.length
                  ? selectedCategory.amenities.join(", ")
                  : "—"}
              </DetailItem>
              <DetailItem
                label="Short description"
                className="sm:col-span-2 lg:col-span-3"
              >
                <span className="whitespace-pre-wrap">
                  {selectedCategory.shortDescription || "—"}
                </span>
              </DetailItem>
              <DetailItem
                label="Description"
                className="sm:col-span-2 lg:col-span-3"
              >
                <span className="whitespace-pre-wrap">
                  {selectedCategory.description || "—"}
                </span>
              </DetailItem>
              <DetailItem
                label="Cover image"
                className="sm:col-span-2 lg:col-span-3"
              >
                {selectedCategory.image ? (
                  <a
                    className="text-primary hover:underline"
                    href={selectedCategory.image}
                    target="_blank"
                    rel="noreferrer"
                  >
                    {selectedCategory.image}
                  </a>
                ) : (
                  "—"
                )}
              </DetailItem>
              <DetailItem
                label="Gallery images"
                className="sm:col-span-2 lg:col-span-3"
              >
                {selectedCategory.images?.length ? (
                  <ul className="space-y-1">
                    {selectedCategory.images.map((image, index) => (
                      <li key={image}>
                        <a
                          className="text-primary hover:underline"
                          href={image}
                          target="_blank"
                          rel="noreferrer"
                        >
                          Image {index + 1}
                        </a>
                      </li>
                    ))}
                  </ul>
                ) : (
                  "—"
                )}
              </DetailItem>
              <DetailItem label="Created">
                {formatDate(selectedCategory.createdAt)}
              </DetailItem>
              <DetailItem label="Last updated">
                {formatDate(selectedCategory.updatedAt)}
              </DetailItem>
              <DetailItem label="Category ID">
                <span className="font-mono text-xs">
                  {getCategoryId(selectedCategory)}
                </span>
              </DetailItem>
            </dl>
          ) : null}
        </DialogContent>
      </Dialog>
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogContent>
          <DialogHeader className="pr-8">
            <DialogTitle>Delete room category?</DialogTitle>
            <DialogDescription>
              This will permanently delete “{categoryToDelete?.name}”. This
              action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          {error && (
            <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setDeleteOpen(false)}
              disabled={deleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
              disabled={deleting}
            >
              {deleting && <Loader2 className="animate-spin" />}
              Delete category
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </main>
  );
}
