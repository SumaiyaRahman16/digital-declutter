"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RippleButton } from "@/components/ui/ripple-button";
import { handleSignup } from "@/lib/api-client";

export function SignupForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSubmitError(null);
    setSuccessMessage(null);

    // Validate password policy before submitting
    const err = validatePassword(password);
    if (err) {
      setPasswordError(err);
      setLoading(false);
      return;
    }

    try {
      await handleSignup(email, password);
      setSuccessMessage("Signup complete. You can now log in.");

      setTimeout(() => {
        router.push("/login");
      }, 1400);
    } catch (error) {
      setSubmitError(error instanceof Error ? error.message : "Unable to complete signup.");
      setLoading(false);
    }
  };

  const validatePassword = (pw: string) => {
    if (!pw || pw.length < 8) return "Password must be at least 8 characters.";
    // Require at least one special (non-alphanumeric) character
    const hasSpecial = /[^A-Za-z0-9]/.test(pw);
    if (!hasSpecial) return "Password must include at least one special character (e.g. !@#$%).";
    return null;
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 text-left">
      <div className="space-y-1">
        <Label htmlFor="signup-name">Full Name</Label>
        <Input
          id="signup-name"
          type="text"
          placeholder="John Doe"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="border-zinc-200 focus-visible:ring-zinc-800"
        />
      </div>
      <div className="space-y-1">
        <Label htmlFor="signup-email">Email Address</Label>
        <Input
          id="signup-email"
          type="email"
          placeholder="name@example.com"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          className="border-zinc-200 focus-visible:ring-zinc-800"
        />
      </div>
      <div className="space-y-1">
        <Label htmlFor="signup-password">Password</Label>
        <div className="relative">
          <Input
            id="signup-password"
            type={showPassword ? "text" : "password"}
            placeholder="••••••••"
            value={password}
            onChange={(e) => {
              const v = e.target.value;
              setPassword(v);
              const err = validatePassword(v);
              setPasswordError(err);
            }}
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
        {passwordError ? (
          <p className="text-sm text-red-500 mt-1">{passwordError}</p>
        ) : (
          <p className="text-sm text-muted-foreground mt-1">Password must be 8+ characters and include a special character.</p>
        )}
      </div>
      {submitError ? (
        <p className="text-sm text-red-500">{submitError}</p>
      ) : null}
      {successMessage ? (
        <p className="text-sm text-emerald-600">{successMessage}</p>
      ) : null}
      <RippleButton 
        type="submit" 
        className="w-full font-medium"
        rippleColor="#fb923c"
        disabled={loading || Boolean(passwordError)}
      >
        {loading ? "Creating account..." : "Create Account"}
      </RippleButton>
    </form>
  );
}