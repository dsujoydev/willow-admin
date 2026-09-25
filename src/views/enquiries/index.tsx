"use client";

import axios from "axios";
import { CalendarDays, ChevronLeft, ChevronRight, Eye, Loader2, Pencil, RefreshCw, Search, Users } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

import EditModal, { type EnquiryFormState, type RoomCategoryOption } from "@/components/modal/enquiry/EditModal";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

const api = axios.create({
  baseURL: "http://localhost:3005/api",
  headers: { "Content-Type": "application/json" },
});

type RoomCategory = {
  _id?: string;
  id?: string;
  name?: string;
};

type Enquiry = {
  _id?: string;
  id?: string;
  checkIn: string;
  checkOut: string;
  guestName: string;
  email: string;
  phone: string;
  roomCategoryPreference?: RoomCategory | string | null;
  guestCount: number;
  requiredRooms: number;
  message?: string;
  status: string;
  source: string;
  createdAt?: string;
  updatedAt?: string;
};

type EnquiryResponse = {
  enquiries: Enquiry[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
};

const PAGE_SIZE = 20;

function getId(value: { _id?: string; id?: string }) {
  return value._id ?? value.id ?? "";
}

function extractEnquiries(payload: unknown): EnquiryResponse {
  if (Array.isArray(payload)) {
    return {
      enquiries: payload as Enquiry[],
      total: payload.length,
      page: 1,
      limit: PAGE_SIZE,
      totalPages: 1,
    };
  }

  const value = payload && typeof payload === "object" ? (payload as Record<string, unknown>) : {};
  const nested =
    value.data && !Array.isArray(value.data) && typeof value.data === "object"
      ? (value.data as Record<string, unknown>)
      : null;
  const enquiries = Array.isArray(value.data)
    ? (value.data as Enquiry[])
    : Array.isArray(value.enquiries)
      ? (value.enquiries as Enquiry[])
      : Array.isArray(nested?.enquiries)
        ? (nested.enquiries as Enquiry[])
        : Array.isArray(nested?.docs)
          ? (nested.docs as Enquiry[])
          : [];
  const metadata = nested ?? value;

  return {
    enquiries,
    total: typeof metadata.total === "number" ? metadata.total : enquiries.length,
    page: typeof metadata.page === "number" ? metadata.page : 1,
    limit: typeof metadata.limit === "number" ? metadata.limit : PAGE_SIZE,
    totalPages: typeof metadata.totalPages === "number" ? metadata.totalPages : 1,
  };
}

function extractEnquiry(payload: unknown): Enquiry | null {
  if (!payload || typeof payload !== "object" || Array.isArray(payload)) {
    return null;
  }

  const value = payload as Record<string, unknown>;
  const candidate = value.data ?? value.enquiry ?? value.result ?? value;
  if (!candidate || typeof candidate !== "object" || Array.isArray(candidate)) {
    return null;
  }

  const nested = candidate as Record<string, unknown>;
  const enquiry = nested.enquiry ?? nested.result ?? candidate;
  return enquiry && typeof enquiry === "object" && !Array.isArray(enquiry) ? (enquiry as Enquiry) : null;
}

function extractRoomCategories(payload: unknown): RoomCategoryOption[] {
  const value = payload && typeof payload === "object" ? (payload as Record<string, unknown>) : {};
  const categories = Array.isArray(payload)
    ? (payload as RoomCategory[])
    : Array.isArray(value.data)
      ? (value.data as RoomCategory[])
      : Array.isArray(value.roomCategories)
        ? (value.roomCategories as RoomCategory[])
        : [];

  return categories.flatMap((category) => {
    const id = getId(category);
    return id && category.name ? [{ id, name: category.name }] : [];
  });
}

function getErrorMessage(error: unknown) {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as { message?: string; error?: string } | undefined;
    return data?.message ?? data?.error ?? error.message;
  }
  return error instanceof Error ? error.message : "Something went wrong.";
}

function getCategoryId(enquiry: Enquiry) {
  if (typeof enquiry.roomCategoryPreference === "string") {
    return enquiry.roomCategoryPreference;
  }
  return enquiry.roomCategoryPreference ? getId(enquiry.roomCategoryPreference) : "";
}

function getCategoryName(enquiry: Enquiry) {
  return typeof enquiry.roomCategoryPreference === "object" && enquiry.roomCategoryPreference
    ? enquiry.roomCategoryPreference.name || "Unnamed category"
    : "No preference";
}

function toDateInput(value?: string) {
  return value ? value.slice(0, 10) : "";
}

function enquiryToForm(enquiry: Enquiry): EnquiryFormState {
  return {
    checkIn: toDateInput(enquiry.checkIn),
    checkOut: toDateInput(enquiry.checkOut),
    guestName: enquiry.guestName ?? "",
    email: enquiry.email ?? "",
    phone: enquiry.phone ?? "",
    roomCategoryPreference: getCategoryId(enquiry),
    guestCount: String(enquiry.guestCount ?? 1),
    requiredRooms: String(enquiry.requiredRooms ?? 1),
    message: enquiry.message ?? "",
    status: enquiry.status ?? "NEW",
    source: enquiry.source ?? "WEBSITE",
  };
}

function formatDate(value?: string) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "UTC",
  }).format(date);
}

function StatusPill({ status }: { status: string }) {
  const tone =
    {
      NEW: "bg-blue-50 text-blue-700",
      CONTACTED: "bg-amber-50 text-amber-700",
      CONFIRMED: "bg-emerald-50 text-emerald-700",
      CLOSED: "bg-zinc-100 text-zinc-700",
      CANCELLED: "bg-red-50 text-red-700",
    }[status] ?? "bg-zinc-100 text-zinc-700";

  return (
    <span className={`inline-flex rounded-full px-2 py-1 text-xs font-medium ${tone}`}>
      {status.replaceAll("_", " ")}
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
      <dt className="text-xs font-medium tracking-wide text-muted-foreground uppercase">{label}</dt>
      <dd className="mt-1 text-sm break-words">{children || "—"}</dd>
    </div>
  );
}

export default function EnquiriesView() {
  const [enquiries, setEnquiries] = useState<Enquiry[]>([]);
  const [roomCategories, setRoomCategories] = useState<RoomCategoryOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [editOpen, setEditOpen] = useState(false);
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsError, setDetailsError] = useState("");
  const [selectedEnquiry, setSelectedEnquiry] = useState<Enquiry | null>(null);
  const [editingEnquiry, setEditingEnquiry] = useState<Enquiry | null>(null);
  const [form, setForm] = useState<EnquiryFormState>({
    checkIn: "",
    checkOut: "",
    guestName: "",
    email: "",
    phone: "",
    roomCategoryPreference: "",
    guestCount: "1",
    requiredRooms: "1",
    message: "",
    status: "NEW",
    source: "WEBSITE",
  });

  const loadEnquiries = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const response = await api.get("/enquiries", {
        params: { page, limit: PAGE_SIZE },
      });
      const result = extractEnquiries(response.data);
      setEnquiries(result.enquiries);
      setTotal(result.total);
      setTotalPages(Math.max(result.totalPages, 1));
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    void loadEnquiries();
  }, [loadEnquiries]);

  useEffect(() => {
    async function loadRoomCategories() {
      try {
        const response = await api.get("/room-categories");
        setRoomCategories(extractRoomCategories(response.data));
      } catch {
        // Editing still works with the enquiry's current category if this fails.
      }
    }

    void loadRoomCategories();
  }, []);

  const filteredEnquiries = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return enquiries;

    return enquiries.filter((enquiry) =>
      [enquiry.guestName, enquiry.email, enquiry.phone, enquiry.status, enquiry.source, getCategoryName(enquiry)].some(
        (value) => value.toLowerCase().includes(query),
      ),
    );
  }, [enquiries, search]);

  function updateForm<K extends keyof EnquiryFormState>(field: K, value: EnquiryFormState[K]) {
    setForm((current) => ({ ...current, [field]: value }));
  }

  function openEditDialog(enquiry: Enquiry) {
    const currentCategoryId = getCategoryId(enquiry);
    const currentCategoryName = getCategoryName(enquiry);
    if (
      currentCategoryId &&
      currentCategoryName !== "No preference" &&
      !roomCategories.some((category) => category.id === currentCategoryId)
    ) {
      setRoomCategories((current) => [...current, { id: currentCategoryId, name: currentCategoryName }]);
    }
    setEditingEnquiry(enquiry);
    setForm(enquiryToForm(enquiry));
    setError("");
    setEditOpen(true);
  }

  async function openDetailsDialog(enquiry: Enquiry) {
    const id = getId(enquiry);
    setSelectedEnquiry(null);
    setDetailsError("");
    setDetailsOpen(true);

    if (!id) {
      setDetailsError("This enquiry has no valid ID.");
      return;
    }

    setDetailsLoading(true);
    try {
      const response = await api.get(`/enquiries/${id}`);
      const details = extractEnquiry(response.data);
      if (!details) throw new Error("The enquiry details could not be read.");
      setSelectedEnquiry(details);
    } catch (requestError) {
      setDetailsError(getErrorMessage(requestError));
    } finally {
      setDetailsLoading(false);
    }
  }

  async function submitForm(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!editingEnquiry) return;

    const id = getId(editingEnquiry);
    if (!id) {
      setError("This enquiry has no valid ID.");
      return;
    }
    if (form.checkOut < form.checkIn) {
      setError("Check-out must be on or after check-in.");
      return;
    }

    setSaving(true);
    setError("");
    try {
      await api.patch(`/enquiries/${id}`, {
        checkIn: form.checkIn,
        checkOut: form.checkOut,
        guestName: form.guestName.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        ...(form.roomCategoryPreference ? { roomCategoryPreference: form.roomCategoryPreference } : {}),
        guestCount: Number(form.guestCount),
        requiredRooms: Number(form.requiredRooms),
        message: form.message.trim(),
        status: form.status,
        source: form.source,
      });
      setEditOpen(false);
      setEditingEnquiry(null);
      await loadEnquiries();
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="min-h-screen bg-zinc-50 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl space-y-6">
        <div>
          <p className="text-sm font-medium text-muted-foreground">Reservations</p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">Enquiries</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Review guest enquiries and update their booking progress.
          </p>
        </div>

        <section className="overflow-hidden rounded-xl border bg-card shadow-sm">
          <div className="flex flex-col gap-3 border-b p-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative w-full sm:max-w-sm">
              <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                aria-label="Search enquiries"
                className="pl-9"
                placeholder="Search this page..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
              />
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm text-muted-foreground">
                {total} enquir{total === 1 ? "y" : "ies"}
              </span>
              <Button
                variant="outline"
                size="icon"
                aria-label="Refresh enquiries"
                onClick={() => void loadEnquiries()}
                disabled={loading}
              >
                <RefreshCw className={loading ? "animate-spin" : ""} />
              </Button>
            </div>
          </div>

          {error && !editOpen && (
            <div className="m-4 rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-muted/40 hover:bg-muted/40">
                  <TableHead className="pl-4">Guest</TableHead>
                  <TableHead>Stay</TableHead>
                  <TableHead>Room preference</TableHead>
                  <TableHead>Party</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Received</TableHead>
                  <TableHead className="pr-4 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-40 text-center">
                      <Loader2 className="mx-auto mb-2 size-5 animate-spin text-muted-foreground" />
                      <span className="text-muted-foreground">Loading enquiries...</span>
                    </TableCell>
                  </TableRow>
                ) : filteredEnquiries.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="h-40 text-center">
                      <p className="font-medium">No enquiries found</p>
                      <p className="mt-1 text-sm text-muted-foreground">
                        {search ? "Try a different search term." : "New guest enquiries will appear here."}
                      </p>
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredEnquiries.map((enquiry) => (
                    <TableRow key={getId(enquiry) || enquiry.email}>
                      <TableCell className="pl-4">
                        <div className="font-medium">{enquiry.guestName}</div>
                        <a
                          className="mt-0.5 block text-xs text-muted-foreground hover:underline"
                          href={`mailto:${enquiry.email}`}
                        >
                          {enquiry.email}
                        </a>
                        <a
                          className="mt-0.5 block text-xs text-muted-foreground hover:underline"
                          href={`tel:${enquiry.phone}`}
                        >
                          {enquiry.phone}
                        </a>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5 whitespace-nowrap text-sm">
                          <CalendarDays className="size-3.5 text-muted-foreground" />
                          {formatDate(enquiry.checkIn)}
                        </div>
                        <div className="mt-1 whitespace-nowrap text-xs text-muted-foreground">
                          to {formatDate(enquiry.checkOut)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{getCategoryName(enquiry)}</div>
                        <div className="mt-0.5 text-xs text-muted-foreground">
                          {enquiry.requiredRooms} room
                          {enquiry.requiredRooms === 1 ? "" : "s"}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1.5 whitespace-nowrap">
                          <Users className="size-3.5 text-muted-foreground" />
                          {enquiry.guestCount} guest
                          {enquiry.guestCount === 1 ? "" : "s"}
                        </div>
                      </TableCell>
                      <TableCell>
                        <StatusPill status={enquiry.status} />
                        <div className="mt-1 text-xs text-muted-foreground">{enquiry.source.replaceAll("_", " ")}</div>
                      </TableCell>
                      <TableCell className="whitespace-nowrap">{formatDate(enquiry.createdAt)}</TableCell>
                      <TableCell className="pr-4 text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon-sm"
                            aria-label={`View enquiry from ${enquiry.guestName}`}
                            onClick={() => void openDetailsDialog(enquiry)}
                          >
                            <Eye />
                          </Button>
                          {/* <Button
                            variant="ghost"
                            size="icon-sm"
                            aria-label={`Edit enquiry from ${enquiry.guestName}`}
                            onClick={() => openEditDialog(enquiry)}
                          >
                            <Pencil />
                          </Button> */}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t px-4 py-3">
              <p className="text-sm text-muted-foreground">
                Page {page} of {totalPages}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((current) => current - 1)}
                  disabled={page <= 1 || loading}
                >
                  <ChevronLeft />
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((current) => current + 1)}
                  disabled={page >= totalPages || loading}
                >
                  Next
                  <ChevronRight />
                </Button>
              </div>
            </div>
          )}
        </section>
      </div>

      {/* <EditModal
        open={editOpen}
        onOpenChange={setEditOpen}
        form={form}
        onFormChange={updateForm}
        onSubmit={submitForm}
        roomCategories={roomCategories}
        saving={saving}
        error={error}
      /> */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader className="pr-8">
            <DialogTitle>Enquiry details</DialogTitle>
            <DialogDescription>Complete information received with this enquiry.</DialogDescription>
          </DialogHeader>

          {detailsLoading ? (
            <div className="flex min-h-48 items-center justify-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="size-5 animate-spin" />
              Loading enquiry details...
            </div>
          ) : detailsError ? (
            <div className="rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">
              {detailsError}
            </div>
          ) : selectedEnquiry ? (
            <dl className="grid gap-3 sm:grid-cols-2">
              <DetailItem label="Guest name">{selectedEnquiry.guestName}</DetailItem>
              <DetailItem label="Status">
                <StatusPill status={selectedEnquiry.status} />
              </DetailItem>
              <DetailItem label="Email">
                <a className="hover:underline" href={`mailto:${selectedEnquiry.email}`}>
                  {selectedEnquiry.email}
                </a>
              </DetailItem>
              <DetailItem label="Phone">
                <a className="hover:underline" href={`tel:${selectedEnquiry.phone}`}>
                  {selectedEnquiry.phone}
                </a>
              </DetailItem>
              <DetailItem label="Check in">{formatDate(selectedEnquiry.checkIn)}</DetailItem>
              <DetailItem label="Check out">{formatDate(selectedEnquiry.checkOut)}</DetailItem>
              <DetailItem label="Room preference">{getCategoryName(selectedEnquiry)}</DetailItem>
              <DetailItem label="Source">{selectedEnquiry.source.replaceAll("_", " ")}</DetailItem>
              <DetailItem label="Guests">{selectedEnquiry.guestCount}</DetailItem>
              <DetailItem label="Required rooms">{selectedEnquiry.requiredRooms}</DetailItem>
              <DetailItem label="Message" className="sm:col-span-2">
                <span className="whitespace-pre-wrap">{selectedEnquiry.message || "—"}</span>
              </DetailItem>
              <DetailItem label="Received">{formatDate(selectedEnquiry.createdAt)}</DetailItem>
              <DetailItem label="Last updated">{formatDate(selectedEnquiry.updatedAt)}</DetailItem>
              {/* <DetailItem label="Enquiry ID" className="sm:col-span-2">
                <span className="font-mono text-xs">{getId(selectedEnquiry)}</span>
              </DetailItem> */}
            </dl>
          ) : null}
        </DialogContent>
      </Dialog>
    </main>
  );
}
