import Link from "next/link";
import { Navbar } from "@/components/layout/navbar";
import { SignupForm } from "@/components/features/auth/signup-form";
import { MagicCard } from "@/components/ui/magic-card";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { RippleButton } from "@/components/ui/ripple-button";

export default function SignupPage() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="container mx-auto flex max-w-5xl justify-center px-4 py-10 md:py-16">
        <MagicCard
          className="w-full max-w-md rounded-2xl shadow-2xl shadow-zinc-950/10"
          mode="orb"
          glowFrom="#f97316"
          glowTo="#fb923c"
          glowSize={520}
          glowBlur={70}
          glowOpacity={0.95}
        >
          <Card className="rounded-2xl border-0 bg-background/95 ring-1 ring-border/60">
            <CardHeader>
              <CardTitle>Sign Up</CardTitle>
              <CardDescription>Create your account to get started.</CardDescription>
            </CardHeader>

            <CardContent className="space-y-4">
              <SignupForm />
              <p className="text-center text-sm text-muted-foreground">
                Already have an account?{" "}
                  <Link href="/login">Login</Link>

              </p>
            </CardContent>
          </Card>
        </MagicCard>
      </main>
    </div>
  );
}
