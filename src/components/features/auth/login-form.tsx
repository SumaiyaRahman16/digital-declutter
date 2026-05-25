"use client";

import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RippleButton } from "@/components/ui/ripple-button";

export function LoginForm() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    // Core submission logic (will link to our useAuth hook later)
    console.log("Logging in with:", { email, password });
    
    setTimeout(() => setLoading(false), 1000); // Temporary loader effect
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
        <Input
          id="login-password"
          type="password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
          className="border-zinc-200 focus-visible:ring-zinc-800"
        />
      </div>
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