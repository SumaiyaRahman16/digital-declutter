"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RippleButton } from "@/components/ui/ripple-button";

export function SignupForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // Validate password policy before submitting
    const err = validatePassword(password);
    if (err) {
      setPasswordError(err);
      setLoading(false);
      return;
    }

    // Core submission logic (will link to our useAuth hook later)
    console.log("Signing up with:", { name, email, password });

    setTimeout(() => setLoading(false), 1000); // Temporary loader effect
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
        <Input
          id="signup-password"
          type="password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => {
            const v = e.target.value;
            setPassword(v);
            const err = validatePassword(v);
            setPasswordError(err);
          }}
          required
          className="border-zinc-200 focus-visible:ring-zinc-800"
        />
        {passwordError ? (
          <p className="text-sm text-red-500 mt-1">{passwordError}</p>
        ) : (
          <p className="text-sm text-muted-foreground mt-1">Password must be 8+ characters and include a special character.</p>
        )}
      </div>
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