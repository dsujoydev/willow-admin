import { Building2 } from "lucide-react";

export default function RoomsPage() {
  return (
    <main className="flex flex-1 items-center justify-center p-6">
      <div className="max-w-md rounded-xl border bg-card p-8 text-center shadow-sm">
        <Building2 className="mx-auto size-8 text-muted-foreground" />
        <h1 className="mt-4 text-xl font-semibold">Rooms</h1>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          The authenticated rooms workspace is ready for its management view.
        </p>
      </div>
    </main>
  );
}
