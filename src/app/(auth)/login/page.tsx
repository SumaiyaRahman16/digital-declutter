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
import { Button } from "@/components/ui/button";

export default function LoginPage() {
	return (
		<div className="min-h-screen bg-background">
			<Navbar />

			<main className="container mx-auto flex max-w-5xl justify-center px-4 py-10 md:py-16">
				<MagicCard className="w-full max-w-md rounded-2xl" gradientSize={220}>
					<Card className="rounded-2xl border-0 bg-transparent ring-0">
						<CardHeader>
							<CardTitle>Login</CardTitle>
							<CardDescription>Sign in to your account.</CardDescription>
						</CardHeader>

						<CardContent className="space-y-4">
							<LoginForm />
							<p className="text-center text-sm text-muted-foreground">
								Don&apos;t have an account?{" "}
								<Button variant="link" size="sm" asChild className="px-0">
									<Link href="/signup">Sign up</Link>
								</Button>
							</p>
						</CardContent>
					</Card>
				</MagicCard>
			</main>
		</div>
	);
}
