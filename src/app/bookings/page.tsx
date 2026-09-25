import { BookOpenCheck } from "lucide-react";

export default function BookingsPage() {
  return (
    <main className="flex flex-1 items-center justify-center p-6">
      <div className="max-w-md rounded-xl border bg-card p-8 text-center shadow-sm">
        <BookOpenCheck className="mx-auto size-8 text-muted-foreground" />
        <h1 className="mt-4 text-xl font-semibold">Bookings</h1>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          The authenticated bookings workspace is ready for its management view.
        </p>
      </div>
    </main>
  );
}
