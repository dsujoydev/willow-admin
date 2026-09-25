"use client";

import axios from "axios";
import { Eye, EyeOff, Loader2, LockKeyhole } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { useAuth } from "@/components/auth-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

function messageFromError(error: unknown) {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as { message?: string } | undefined;
    return data?.message ?? "Unable to sign in. Please try again.";
  }
  return "Unable to sign in. Please try again.";
}

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      await login(email, password);
      router.replace("/enquiries");
    } catch (loginError) {
      setError(messageFromError(loginError));
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="relative grid min-h-svh overflow-hidden bg-[#f4f1ea] lg:grid-cols-[1.1fr_0.9fr]">
      <section className="relative hidden overflow-hidden bg-[#173c35] p-12 text-white lg:flex lg:flex-col lg:justify-between">
        <div className="absolute -top-32 -right-24 size-96 rounded-full border border-white/10" />
        <div className="absolute right-20 bottom-10 size-64 rounded-full border border-white/10" />
        <div className="relative flex items-center gap-3">
          <span className="grid size-10 place-items-center rounded-xl bg-[#d9b977] font-serif text-xl font-semibold text-[#173c35]">
            W
          </span>
          <div>
            <p className="font-semibold tracking-wide">Willow Hotel</p>
            <p className="text-xs text-white/60">Administration</p>
          </div>
        </div>
        <div className="relative max-w-xl">
          <p className="mb-5 text-xs font-semibold tracking-[0.22em] text-[#d9b977] uppercase">
            Guest operations
          </p>
          <h1 className="font-serif text-5xl leading-tight tracking-tight">
            Every stay, thoughtfully managed.
          </h1>
          <p className="mt-6 max-w-md text-base leading-7 text-white/65">
            Manage enquiries, rooms, bookings, and guest details from one secure
            workspace.
          </p>
        </div>
        <p className="relative text-xs text-white/40">
          Private access for Willow Hotel staff
        </p>
      </section>

      <section className="flex items-center justify-center px-5 py-12 sm:px-10">
        <div className="w-full max-w-sm">
          <div className="mb-8 lg:hidden">
            <span className="grid size-10 place-items-center rounded-xl bg-[#173c35] font-serif text-xl font-semibold text-[#d9b977]">
              W
            </span>
          </div>
          <div className="mb-8">
            <div className="mb-5 grid size-11 place-items-center rounded-full border border-[#173c35]/15 bg-white/60 text-[#173c35]">
              <LockKeyhole className="size-5" />
            </div>
            <h2 className="font-serif text-3xl font-semibold tracking-tight text-[#173c35]">
              Welcome back
            </h2>
            <p className="mt-2 text-sm text-[#173c35]/60">
              Sign in with your administrator account.
            </p>
          </div>

          <form onSubmit={submit} className="space-y-5">
            <div className="space-y-2">
              <Label htmlFor="email">Email address</Label>
              <Input
                id="email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="admin@willowhotel.com"
                className="h-11 border-[#173c35]/15 bg-white/70"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  autoComplete="current-password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Enter your password"
                  className="h-11 border-[#173c35]/15 bg-white/70 pr-11"
                  required
                />
                <button
                  type="button"
                  className="absolute inset-y-0 right-0 grid w-11 place-items-center text-[#173c35]/50 hover:text-[#173c35]"
                  onClick={() => setShowPassword((visible) => !visible)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? (
                    <EyeOff className="size-4" />
                  ) : (
                    <Eye className="size-4" />
                  )}
                </button>
              </div>
            </div>

            {error && (
              <p
                role="alert"
                className="rounded-lg border border-destructive/20 bg-destructive/10 px-3 py-2 text-sm text-destructive"
              >
                {error}
              </p>
            )}

            <Button
              type="submit"
              className="h-11 w-full bg-[#173c35] hover:bg-[#173c35]/90"
              disabled={submitting}
            >
              {submitting ? (
                <Loader2 className="animate-spin" />
              ) : (
                <LockKeyhole />
              )}
              {submitting ? "Signing in…" : "Sign in"}
            </Button>
          </form>
        </div>
      </section>
    </main>
  );
}
