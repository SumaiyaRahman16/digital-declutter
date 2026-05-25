import Link from "next/link";
import { Navbar } from "@/components/layout/navbar";
import { LoginForm } from "@/components/features/auth/login-form";
import { MagicCard } from "@/components/ui/magic-card";
import {
	Card,
	CardContent,
	CardDescription,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { RippleButton } from "@/components/ui/ripple-button";

export default function LoginPage() {
	return (
		<div className="min-h-screen bg-background">
			<Navbar />

			<main className="container mx-auto flex max-w-5xl justify-center px-4 py-10 md:py-16">
				<MagicCard
					className="w-full max-w-md rounded-2xl shadow-2xl shadow-zinc-950/10"
					mode="orb"
					glowFrom="#c47237"
					glowTo="#ce8041"
					glowSize={520}
					glowBlur={70}
					glowOpacity={0.95}
				>
					<Card className="rounded-2xl border-0 bg-background/95 ring-1 ring-border/60">
						<CardHeader>
							<CardTitle>Login</CardTitle>
							<CardDescription>Sign in to your account.</CardDescription>
						</CardHeader>

						<CardContent className="space-y-4">
							<LoginForm />
							<p className="text-center text-sm text-muted-foreground">
								Don&apos;t have an account?{" "}
                                {/* add a underline to the "Login" text and make it a link to the signup page */}
									<Link href="/signup ">Sign up</Link>

							</p>
						</CardContent>
					</Card>
				</MagicCard>
			</main>
		</div>
	);
}
