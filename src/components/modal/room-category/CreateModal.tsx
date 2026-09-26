"use client";

import { Loader2 } from "lucide-react";
import { useState } from "react";

import { ImageUpload, MultiImageUpload } from "@/components/image-upload";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";

export type BedType = "QUEEN" | "KING" | "TWIN";

export type RoomCategoryFormState = {
  name: string;
  featured: boolean;
  showOnWebsite: boolean;
  slug: string;
  bedType: BedType | "";
  roomSize: string;
  view: string;
  hasMiniFridge: boolean;
  hasGeyser: boolean;
  hasBalcony: boolean;
  maxGuests: string;
  maxAdults: string;
  maxChildren: string;
  amenities: string;
  rent: string;
  currency: string;
  discountPercent: string;
  image: string;
  images: string;
  description: string;
  shortDescription: string;
  popularityRank: string;
  recommendedRank: string;
  available: boolean;
  availableRoomCount: string;
};

type CreateModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  isEditing: boolean;
  form: RoomCategoryFormState;
  onFormChange: <K extends keyof RoomCategoryFormState>(field: K, value: RoomCategoryFormState[K]) => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
  saving: boolean;
  error: string;
};

const BED_TYPES: BedType[] = ["QUEEN", "KING", "TWIN"];

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="min-w-0">
      <h2 className="mb-3 text-sm font-semibold">{title}</h2>
      {children}
    </div>
  );
}

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
    <div className="min-w-0 space-y-2">
      <Label htmlFor={htmlFor}>
        {label}
        {required && <span className="text-destructive">*</span>}
      </Label>
      {children}
    </div>
  );
}

function BooleanField({
  id,
  label,
  description,
  checked,
  onCheckedChange,
}: {
  id: string;
  label: string;
  description: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
}) {
  return (
    <label htmlFor={id} className="flex min-w-0 cursor-pointer items-start gap-3 rounded-lg border p-3">
      <Checkbox id={id} checked={checked} onCheckedChange={onCheckedChange} className="mt-0.5" />
      <span className="min-w-0">
        <span className="block text-sm font-medium">{label}</span>
        <span className="mt-1 block text-xs text-muted-foreground">{description}</span>
      </span>
    </label>
  );
}

export default function CreateModal({
  open,
  onOpenChange,
  isEditing,
  form,
  onFormChange,
  onSubmit,
  saving,
  error,
}: CreateModalProps) {
  const [coverUploading, setCoverUploading] = useState(false);
  const [galleryUploading, setGalleryUploading] = useState(false);
  const galleryImages = form.images
    .split(/\n|,/)
    .map((image) => image.trim())
    .filter(Boolean);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-x-hidden overflow-y-auto sm:max-w-4xl">
        <form onSubmit={onSubmit} className="min-w-0">
          <DialogHeader className="pr-8">
            <DialogTitle>{isEditing ? "Edit room category" : "Add room category"}</DialogTitle>
            <DialogDescription>
              {isEditing
                ? "Update this category's room details and visibility."
                : "Create a category to group rooms with the same features and pricing."}
            </DialogDescription>
          </DialogHeader>

          {error && (
            <div className="mt-4 rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <div className="my-6 space-y-6">
            {/* 1. Basic information */}
            <Section title="Basic information">
              <div className="grid min-w-0 gap-4 sm:grid-cols-2">
                <Field label="Name" htmlFor="name" required>
                  <Input
                    id="name"
                    value={form.name}
                    onChange={(event) => onFormChange("name", event.target.value)}
                    minLength={2}
                    maxLength={120}
                    placeholder="Deluxe Double Room"
                    required
                  />
                </Field>
                <Field label="Slug" htmlFor="slug">
                  <Input
                    id="slug"
                    value={form.slug}
                    onChange={(event) => onFormChange("slug", event.target.value)}
                    placeholder="deluxe-double-room"
                  />
                </Field>
                <Field label="Bed type" htmlFor="bedType" required>
                  <Select
                    value={form.bedType || null}
                    onValueChange={(value) => onFormChange("bedType", (value ?? "") as BedType | "")}
                  >
                    <SelectTrigger id="bedType" className="w-full">
                      <SelectValue placeholder="Select a bed type" />
                    </SelectTrigger>
                    <SelectContent>
                      {BED_TYPES.map((bedType) => (
                        <SelectItem key={bedType} value={bedType}>
                          {bedType}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </Field>
                <Field label="View" htmlFor="view">
                  <Input
                    id="view"
                    value={form.view}
                    onChange={(event) => onFormChange("view", event.target.value)}
                    placeholder="Garden view"
                  />
                </Field>
                <Field label="Room size" htmlFor="roomSize">
                  <Input
                    id="roomSize"
                    type="number"
                    min="0"
                    step="any"
                    value={form.roomSize}
                    onChange={(event) => onFormChange("roomSize", event.target.value)}
                    placeholder="250"
                  />
                </Field>
                <Field label="Maximum guests" htmlFor="maxGuests">
                  <Input
                    id="maxGuests"
                    type="number"
                    min="1"
                    step="1"
                    value={form.maxGuests}
                    onChange={(event) => onFormChange("maxGuests", event.target.value)}
                    placeholder="2"
                  />
                </Field>
                <Field label="Maximum adults" htmlFor="maxAdults">
                  <Input
                    id="maxAdults"
                    type="number"
                    min="1"
                    step="1"
                    value={form.maxAdults}
                    onChange={(event) => onFormChange("maxAdults", event.target.value)}
                    placeholder="2"
                  />
                </Field>
                <Field label="Maximum children" htmlFor="maxChildren">
                  <Input
                    id="maxChildren"
                    type="number"
                    min="0"
                    step="1"
                    value={form.maxChildren}
                    onChange={(event) => onFormChange("maxChildren", event.target.value)}
                    placeholder="1"
                  />
                </Field>
                <div className="min-w-0 sm:col-span-2">
                  <Field label="Amenities" htmlFor="amenities">
                    <Input
                      id="amenities"
                      value={form.amenities}
                      onChange={(event) => onFormChange("amenities", event.target.value)}
                      placeholder="WiFi, Air conditioning, Breakfast"
                    />
                  </Field>
                </div>
              </div>
            </Section>

            {/* 2. Photos — compact cover + gallery uploaders */}
            <Section title="Photos">
              <div className="space-y-4">
                <Field label="Cover image" htmlFor="cover-image-upload">
                  <ImageUpload
                    id="cover-image-upload"
                    value={form.image}
                    onChange={(image) => onFormChange("image", image)}
                    onUploadingChange={setCoverUploading}
                    disabled={saving}
                  />
                </Field>
                <Field label="Gallery images" htmlFor="gallery-images-upload">
                  <MultiImageUpload
                    id="gallery-images-upload"
                    values={galleryImages}
                    onChange={(images) => onFormChange("images", images.join("\n"))}
                    onUploadingChange={setGalleryUploading}
                    disabled={saving}
                  />
                </Field>
              </div>
            </Section>

            {/* 3. Description */}
            <Section title="Description">
              <div className="grid min-w-0 gap-4 sm:grid-cols-2">
                <Field label="Short description" htmlFor="shortDescription">
                  <Textarea
                    id="shortDescription"
                    maxLength={200}
                    value={form.shortDescription}
                    onChange={(event) => onFormChange("shortDescription", event.target.value)}
                    placeholder="A short summary shown on category cards."
                  />
                </Field>
                <Field label="Full description" htmlFor="description">
                  <Textarea
                    id="description"
                    minLength={10}
                    value={form.description}
                    onChange={(event) => onFormChange("description", event.target.value)}
                    placeholder="Describe the room category in at least 10 characters."
                  />
                </Field>
              </div>
            </Section>

            {/* 4. Pricing */}
            <Section title="Pricing">
              <div className="grid min-w-0 gap-4 sm:grid-cols-3">
                <Field label="Rent" htmlFor="rent">
                  <Input
                    id="rent"
                    type="number"
                    min="0"
                    step="any"
                    value={form.rent}
                    onChange={(event) => onFormChange("rent", event.target.value)}
                    placeholder="5000"
                  />
                </Field>
                <Field label="Currency" htmlFor="currency">
                  <Input
                    id="currency"
                    minLength={3}
                    maxLength={3}
                    value={form.currency}
                    onChange={(event) => onFormChange("currency", event.target.value.toUpperCase())}
                    required
                  />
                </Field>
                <Field label="Discount (%)" htmlFor="discountPercent">
                  <Input
                    id="discountPercent"
                    type="number"
                    min="0"
                    max="100"
                    step="any"
                    value={form.discountPercent}
                    onChange={(event) => onFormChange("discountPercent", event.target.value)}
                    placeholder="10"
                  />
                </Field>
              </div>
            </Section>

            {/* 5. Availability & inventory — counts, ranks, and the "available" toggle together */}
            <Section title="Availability & inventory">
              <div className="space-y-4">
                <div className="grid min-w-0 gap-4 sm:grid-cols-3">
                  <Field label="Available rooms" htmlFor="availableRoomCount">
                    <Input
                      id="availableRoomCount"
                      type="number"
                      min="0"
                      step="1"
                      value={form.availableRoomCount}
                      onChange={(event) => onFormChange("availableRoomCount", event.target.value)}
                    />
                  </Field>
                  <Field label="Popularity rank" htmlFor="popularityRank">
                    <Input
                      id="popularityRank"
                      type="number"
                      min="1"
                      step="1"
                      value={form.popularityRank}
                      onChange={(event) => onFormChange("popularityRank", event.target.value)}
                    />
                  </Field>
                  <Field label="Recommended rank" htmlFor="recommendedRank">
                    <Input
                      id="recommendedRank"
                      type="number"
                      min="1"
                      step="1"
                      value={form.recommendedRank}
                      onChange={(event) => onFormChange("recommendedRank", event.target.value)}
                    />
                  </Field>
                </div>
                <BooleanField
                  id="available"
                  label="Available"
                  description="Allow this category to be booked."
                  checked={form.available}
                  onCheckedChange={(checked) => onFormChange("available", checked)}
                />
              </div>
            </Section>

            {/* 6. Features */}
            <Section title="Features">
              <div className="grid min-w-0 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                <BooleanField
                  id="featured"
                  label="Featured"
                  description="Highlight this category."
                  checked={form.featured}
                  onCheckedChange={(checked) => onFormChange("featured", checked)}
                />
                <BooleanField
                  id="showOnWebsite"
                  label="Show on website"
                  description="Make it visible publicly."
                  checked={form.showOnWebsite}
                  onCheckedChange={(checked) => onFormChange("showOnWebsite", checked)}
                />
                <BooleanField
                  id="hasMiniFridge"
                  label="Mini fridge"
                  description="Room includes a mini fridge."
                  checked={form.hasMiniFridge}
                  onCheckedChange={(checked) => onFormChange("hasMiniFridge", checked)}
                />
                <BooleanField
                  id="hasGeyser"
                  label="Geyser"
                  description="Hot water geyser is included."
                  checked={form.hasGeyser}
                  onCheckedChange={(checked) => onFormChange("hasGeyser", checked)}
                />
                <BooleanField
                  id="hasBalcony"
                  label="Balcony"
                  description="Room has a private balcony."
                  checked={form.hasBalcony}
                  onCheckedChange={(checked) => onFormChange("hasBalcony", checked)}
                />
              </div>
            </Section>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving || coverUploading || galleryUploading || !form.bedType}>
              {saving && <Loader2 className="animate-spin" />}
              {isEditing ? "Save changes" : "Create category"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
