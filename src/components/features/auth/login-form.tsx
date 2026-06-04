"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RippleButton } from "@/components/ui/ripple-button";
import { handleLogin } from "@/lib/api-client";

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSubmitError(null);
    setSuccessMessage(null);

    try {
      await handleLogin(email, password);
      setSuccessMessage("Login successful. Redirecting to the home page...");

      setTimeout(() => {
        router.push("/");
      }, 1400);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Unable to complete login.");
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 text-left">
      <div className="space-y-1">
        <Label htmlFor="login-email">Email Address</Label>
        <Input
          id="login-email"
          type="email"
          placeholder="name@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="border-zinc-200 focus-visible:ring-zinc-800"
        />
      </div>
      <div className="space-y-1">
        <Label htmlFor="login-password">Password</Label>
        <div className="relative">
          <Input
            id="login-password"
            type={showPassword ? "text" : "password"}
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            className="border-zinc-200 pr-10 focus-visible:ring-zinc-800"
          />
          <button
            type="button"
            onClick={() => setShowPassword((current) => !current)}
            aria-label={showPassword ? "Hide password" : "Show password"}
            aria-pressed={showPassword}
            className="absolute inset-y-0 right-2 flex items-center justify-center text-zinc-500 transition-colors hover:text-zinc-800"
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </div>
      {submitError ? <p className="text-sm text-red-500">{submitError}</p> : null}
      {successMessage ? <p className="text-sm text-emerald-600">{successMessage}</p> : null}
      <RippleButton 
        type="submit" 
        className="w-full font-medium"
        rippleColor="#fb923c"
        disabled={loading}
      >
        {loading ? "Signing in..." : "Sign In"}
      </RippleButton>
    </form>
  );
}