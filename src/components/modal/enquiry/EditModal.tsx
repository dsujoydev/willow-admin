"use client";

import { Loader2 } from "lucide-react";

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
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

export type EnquiryFormState = {
  checkIn: string;
  checkOut: string;
  guestName: string;
  email: string;
  phone: string;
  roomCategoryPreference: string;
  guestCount: string;
  requiredRooms: string;
  message: string;
  status: string;
  source: string;
};

export type RoomCategoryOption = {
  id: string;
  name: string;
};

type EditModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  form: EnquiryFormState;
  onFormChange: <K extends keyof EnquiryFormState>(
    field: K,
    value: EnquiryFormState[K],
  ) => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  roomCategories: RoomCategoryOption[];
  saving: boolean;
  error: string;
};

const STATUSES = ["NEW", "CONTACTED", "CONFIRMED", "CLOSED", "CANCELLED"];
const SOURCES = ["WEBSITE", "PHONE", "EMAIL", "WALK_IN"];

function Field({
  label,
  htmlFor,
  required,
  children,
}: {
  label: string;
  htmlFor: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={htmlFor}>
        {label}
        {required && <span className="text-destructive"> *</span>}
      </Label>
      {children}
    </div>
  );
}

export default function EditModal({
  open,
  onOpenChange,
  form,
  onFormChange,
  onSubmit,
  roomCategories,
  saving,
  error,
}: EditModalProps) {
  const selectedCategoryExists = roomCategories.some(
    (category) => category.id === form.roomCategoryPreference,
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-2xl">
        <form onSubmit={onSubmit}>
          <DialogHeader className="pr-8">
            <DialogTitle>Edit enquiry</DialogTitle>
            <DialogDescription>
              Update the guest, stay, room, and follow-up details.
            </DialogDescription>
          </DialogHeader>

          {error && (
            <div className="mt-4 rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <div className="my-6 grid gap-4 sm:grid-cols-2">
            <Field label="Guest name" htmlFor="guestName" required>
              <Input
                id="guestName"
                value={form.guestName}
                onChange={(event) =>
                  onFormChange("guestName", event.target.value)
                }
                required
              />
            </Field>
            <Field label="Phone" htmlFor="phone" required>
              <Input
                id="phone"
                type="tel"
                value={form.phone}
                onChange={(event) => onFormChange("phone", event.target.value)}
                required
              />
            </Field>
            <Field label="Email" htmlFor="email" required>
              <Input
                id="email"
                type="email"
                value={form.email}
                onChange={(event) => onFormChange("email", event.target.value)}
                required
              />
            </Field>
            <Field label="Room category" htmlFor="roomCategoryPreference">
              <Select
                value={form.roomCategoryPreference || null}
                onValueChange={(value) =>
                  onFormChange("roomCategoryPreference", value ?? "")
                }
              >
                <SelectTrigger id="roomCategoryPreference" className="w-full">
                  <SelectValue placeholder="Select a room category" />
                </SelectTrigger>
                <SelectContent>
                  {!selectedCategoryExists && form.roomCategoryPreference && (
                    <SelectItem value={form.roomCategoryPreference}>
                      Current room category
                    </SelectItem>
                  )}
                  {roomCategories.map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Check in" htmlFor="checkIn" required>
              <Input
                id="checkIn"
                type="date"
                value={form.checkIn}
                onChange={(event) =>
                  onFormChange("checkIn", event.target.value)
                }
                required
              />
            </Field>
            <Field label="Check out" htmlFor="checkOut" required>
              <Input
                id="checkOut"
                type="date"
                min={form.checkIn || undefined}
                value={form.checkOut}
                onChange={(event) =>
                  onFormChange("checkOut", event.target.value)
                }
                required
              />
            </Field>
            <Field label="Guests" htmlFor="guestCount" required>
              <Input
                id="guestCount"
                type="number"
                min="1"
                step="1"
                value={form.guestCount}
                onChange={(event) =>
                  onFormChange("guestCount", event.target.value)
                }
                required
              />
            </Field>
            <Field label="Required rooms" htmlFor="requiredRooms" required>
              <Input
                id="requiredRooms"
                type="number"
                min="1"
                step="1"
                value={form.requiredRooms}
                onChange={(event) =>
                  onFormChange("requiredRooms", event.target.value)
                }
                required
              />
            </Field>
            <Field label="Status" htmlFor="status" required>
              <Select
                value={form.status || null}
                onValueChange={(value) => onFormChange("status", value ?? "")}
              >
                <SelectTrigger id="status" className="w-full">
                  <SelectValue placeholder="Select a status" />
                </SelectTrigger>
                <SelectContent>
                  {!STATUSES.includes(form.status) && form.status && (
                    <SelectItem value={form.status}>{form.status}</SelectItem>
                  )}
                  {STATUSES.map((status) => (
                    <SelectItem key={status} value={status}>
                      {status.replaceAll("_", " ")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <Field label="Source" htmlFor="source" required>
              <Select
                value={form.source || null}
                onValueChange={(value) => onFormChange("source", value ?? "")}
              >
                <SelectTrigger id="source" className="w-full">
                  <SelectValue placeholder="Select a source" />
                </SelectTrigger>
                <SelectContent>
                  {!SOURCES.includes(form.source) && form.source && (
                    <SelectItem value={form.source}>{form.source}</SelectItem>
                  )}
                  {SOURCES.map((source) => (
                    <SelectItem key={source} value={source}>
                      {source.replaceAll("_", " ")}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </Field>
            <div className="sm:col-span-2">
              <Field label="Message" htmlFor="message">
                <Textarea
                  id="message"
                  rows={4}
                  value={form.message}
                  onChange={(event) =>
                    onFormChange("message", event.target.value)
                  }
                  placeholder="Guest notes or special requests"
                />
              </Field>
            </div>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving && <Loader2 className="animate-spin" />}
              Save changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
