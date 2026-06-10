"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Navbar } from "@/components/layout/navbar";
import { Eye, EyeOff, LockKeyhole, Mail, LogOut, ShieldCheck, UserRound, Download } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RippleButton } from "@/components/ui/ripple-button";
import { handleChangePassword } from "@/lib/api-client";

type TokenProfile = {
	email?: string;
	name?: string;
	sub?: string;
	iss?: string;
	iat?: number;
	exp?: number;
};

function parseTokenPayload(token: string): TokenProfile | null {
	const parts = token.split(".");

	if (parts.length < 2) {
		return null;
	}

	try {
		const payload = parts[1].replace(/-/g, "+").replace(/_/g, "/");
		const paddedPayload = payload.padEnd(Math.ceil(payload.length / 4) * 4, "=");
		const decoded = atob(paddedPayload);
		return JSON.parse(decoded) as TokenProfile;
	} catch {
		return null;
	}
}

export default function ProfilePage() {
	const router = useRouter();
	const [token, setToken] = useState<string | null>(null);
	const [email, setEmail] = useState<string>("");
	const [showChangePassword, setShowChangePassword] = useState(false);
	const [showNewPassword, setShowNewPassword] = useState(false);
	const [showConfirmPassword, setShowConfirmPassword] = useState(false);
	const [currentPassword, setCurrentPassword] = useState("");
	const [newPassword, setNewPassword] = useState("");
	const [confirmPassword, setConfirmPassword] = useState("");
	const [passwordMessage, setPasswordMessage] = useState<string | null>(null);
	const [passwordError, setPasswordError] = useState<string | null>(null);
	const [isExporting, setIsExporting] = useState<boolean>(false);
	const [exportMessage, setExportMessage] = useState<string>("");
	const [showDeleteConfirm, setShowDeleteConfirm] = useState<boolean>(false);
	const [isDeleting, setIsDeleting] = useState<boolean>(false);

	useEffect(() => {
		const storedToken = localStorage.getItem("token");
		const storedEmail = localStorage.getItem("email") ?? "";

		if (!storedToken) {
			router.replace("/login");
			return;
		}

		setToken(storedToken);
		setEmail(storedEmail);
	}, [router]);

	const profile = useMemo(() => (token ? parseTokenPayload(token) : null), [token]);
	const profileEmail = email || profile?.email || profile?.sub || "Not available";

	const handleLogout = () => {
		localStorage.removeItem("token");
		localStorage.removeItem("email");
		window.dispatchEvent(new Event("authchange"));
		router.push("/login");
	};

	const handlePasswordSubmit = async (event: React.FormEvent) => {
		event.preventDefault();
		setPasswordError(null);
		setPasswordMessage(null);

		if (!currentPassword || !newPassword || !confirmPassword) {
			setPasswordError("Fill in all password fields.");
			return;
		}

		if (newPassword.length < 8) {
			setPasswordError("New password must be at least 8 characters.");
			return;
		}

		if (newPassword !== confirmPassword) {
			setPasswordError("New password and confirmation do not match.");
			return;
		}

		try {
			await handleChangePassword(currentPassword, newPassword);
			setPasswordMessage("Password successfully updated.");
			setCurrentPassword("");
			setNewPassword("");
			setConfirmPassword("");
		} catch (error) {
			if (error instanceof Error) {
				setPasswordError(error.message);
			} else {
				setPasswordError("An unexpected error occurred while changing password.");
			}
		}
	};

	const handleDataExport = async (format: string) => {
		setIsExporting(true);
		setExportMessage("Exporting your data, please wait...");

		try {
			const token = localStorage.getItem("token");
			if (!token) {
				setExportMessage("Authentication token not found. Please log in again.");
				setIsExporting(false);
				return;
			}

			const response = await fetch(`http://localhost:8080/api/export?format=${format}`, {
				method: "GET",
				headers: {
					Authorization: `Bearer ${token}`,
				},
			});

			if (!response.ok) {
				throw new Error(`Failed to export data. Server responded with status: ${response.status}`);
			}

			const blob = await response.blob();
			const url = window.URL.createObjectURL(blob);
			const a = document.createElement("a");
			a.href = url;
			const extension = format === "csv" ? "csv" : "json";
			a.download = `digital_declutter_export_${new Date().toISOString().split('T')[0]}.${extension}`;
			document.body.appendChild(a);
			a.click();
			document.body.removeChild(a);
			window.URL.revokeObjectURL(url);

			setExportMessage("Data export completed successfully.");
		} catch (error) {
			if (error instanceof Error) {
				setExportMessage(error.message);
			} else {
				setExportMessage("An unexpected error occurred during data export.");
			}
		} finally {
			setIsExporting(false);
		}
	};

	const handleDeleteAccount = async () => {
		setIsDeleting(true);
		try {
			const token = localStorage.getItem("token");
			const response = await fetch("http://localhost:8080/api/account/delete", {
				method: "POST",
				headers: {
					Authorization: `Bearer ${token}`,
				},
			});

			if (!response.ok) {
				throw new Error("Failed to delete account.");
			}

			localStorage.removeItem("token");
			window.location.href = "/login";
		} catch (error) {
			console.error(error);
			alert("An error occurred while deleting your account. Please try again.");
			setIsDeleting(false);
		}
	};

	if (!token) {
		return null;
	}

	return (
		<div className="min-h-screen bg-background text-foreground">
			<Navbar />
			<main className="container mx-auto flex max-w-4xl justify-center px-4 py-12 md:py-16">
				<Card className="w-full border-border/60 bg-background/95 shadow-2xl shadow-zinc-950/10">
					<CardHeader>
						<div className="mb-2 flex items-center gap-3">
							<div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-orange-500/10 text-orange-500 ring-1 ring-orange-500/20">
								<UserRound className="h-5 w-5" />
							</div>
							<div>
								<CardTitle>Account</CardTitle>
								<CardDescription>Manage your email, password, and sign-out session.</CardDescription>
							</div>
						</div>
					</CardHeader>
					<CardContent className="space-y-6">
						<section className="grid gap-4 rounded-2xl border border-border/60 bg-muted/20 p-5 md:grid-cols-2">
							<div className="space-y-1">
								<p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Account email</p>
								<div className="flex items-center gap-2 text-sm text-foreground">
									<Mail className="h-4 w-4 text-orange-500" />
									<span className="break-all font-medium">{profileEmail}</span>
								</div>
							</div>
							<div className="space-y-1 md:text-right">
								<p className="text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">Session</p>
								<div className="flex items-center gap-2 text-sm text-foreground md:justify-end">
									<ShieldCheck className="h-4 w-4 text-emerald-500" />
									<span>Active</span>
								</div>
							</div>
						</section>

						<section className="space-y-4 rounded-2xl border border-border/60 p-5">
							<div className="flex items-center justify-between gap-3">
								<div>
									<p className="font-semibold text-foreground">Change password</p>
									<p className="text-sm text-muted-foreground">Update your account password from here.</p>
								</div>
								<RippleButton
									type="button"
									onClick={() => setShowChangePassword((current) => !current)}
									className="min-w-[160px] font-medium"
									rippleColor="#fb923c"
								>
									<span className="inline-flex items-center gap-2">
										<LockKeyhole className="h-4 w-4" />
										{showChangePassword ? "Hide form" : "Change password"}
									</span>
								</RippleButton>
							</div>

							{showChangePassword ? (
								<form onSubmit={handlePasswordSubmit} className="space-y-4 pt-2">
									<div className="space-y-2">
										<Label htmlFor="current-password">Current password</Label>
										<Input
											id="current-password"
											type="password"
											value={currentPassword}
											onChange={(event) => setCurrentPassword(event.target.value)}
											placeholder="Enter current password"
											className="border-zinc-200 focus-visible:ring-zinc-800"
										/>
									</div>
									<div className="grid gap-4 md:grid-cols-2">
										<div className="space-y-2">
											<Label htmlFor="new-password">New password</Label>
											<div className="relative">
												<Input
													id="new-password"
													type={showNewPassword ? "text" : "password"}
													value={newPassword}
													onChange={(event) => setNewPassword(event.target.value)}
													placeholder="Enter new password"
													className="border-zinc-200 pr-10 focus-visible:ring-zinc-800"
												/>
												<button
													type="button"
													onClick={() => setShowNewPassword((current) => !current)}
													aria-label={showNewPassword ? "Hide new password" : "Show new password"}
													className="absolute inset-y-0 right-2 flex items-center justify-center text-zinc-500 transition-colors hover:text-zinc-800"
												>
													{showNewPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
												</button>
											</div>
										</div>
										<div className="space-y-2">
											<Label htmlFor="confirm-password">Confirm password</Label>
											<div className="relative">
												<Input
													id="confirm-password"
													type={showConfirmPassword ? "text" : "password"}
													value={confirmPassword}
													onChange={(event) => setConfirmPassword(event.target.value)}
													placeholder="Confirm new password"
													className="border-zinc-200 pr-10 focus-visible:ring-zinc-800"
												/>
												<button
													type="button"
													onClick={() => setShowConfirmPassword((current) => !current)}
													aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
													className="absolute inset-y-0 right-2 flex items-center justify-center text-zinc-500 transition-colors hover:text-zinc-800"
												>
													{showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
												</button>
											</div>
										</div>
									</div>

									{passwordError ? <p className="text-sm text-red-500">{passwordError}</p> : null}
									{passwordMessage ? <p className="text-sm text-emerald-600">{passwordMessage}</p> : null}

									<div className="flex flex-wrap gap-3">
										<RippleButton type="submit" className="font-medium" rippleColor="#fb923c">
											Save password
										</RippleButton>
										<RippleButton
											type="button"
											onClick={() => {
												setShowChangePassword(false);
												setPasswordError(null);
												setPasswordMessage(null);
												setCurrentPassword("");
												setNewPassword("");
												setConfirmPassword("");
											}}
											className="font-medium"
											rippleColor="#fb923c"
										>
											Cancel
										</RippleButton>
									</div>
								</form>
							) : null}
						</section>

						<section className="space-y-4 rounded-2xl border border-border/60 p-5">
							<div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
								<div>
									<p className="font-semibold text-foreground">Download my data</p>
									<p className="text-sm text-muted-foreground">Export your account data and history as a JSON or CSV file.</p>
								</div>
								<div className="flex flex-wrap gap-3">
									<RippleButton
										type="button"
										onClick={() => handleDataExport("json")}
										disabled={isExporting}
										className="min-w-[130px] font-medium bg-zinc-950 text-white border-zinc-800 hover:bg-zinc-900"
										rippleColor="#fb923c"
									>
										<span className="inline-flex items-center gap-2">
											<Download className="h-4 w-4" />
											Export JSON
										</span>
									</RippleButton>
									<RippleButton
										type="button"
										onClick={() => handleDataExport("csv")}
										disabled={isExporting}
										className="min-w-[130px] font-medium bg-transparent border border-gray-300 text-slate-700 hover:bg-slate-100 hover:text-slate-900 dark:border-zinc-700 dark:text-zinc-200 dark:hover:bg-zinc-800 dark:hover:text-zinc-100"
										rippleColor="#fb923c"
									>
										<span className="inline-flex items-center gap-2">
											<Download className="h-4 w-4" />
											Export CSV
										</span>
									</RippleButton>
								</div>
							</div>
							{exportMessage ? (
								<div className={`mt-4 rounded-xl border p-3 text-sm flex items-center gap-2 ${
									exportMessage.includes("successfully")
										? "border-emerald-500/20 bg-emerald-500/10 text-emerald-600"
										: isExporting
											? "border-orange-500/20 bg-orange-500/10 text-orange-500 animate-pulse"
											: "border-red-500/20 bg-red-500/10 text-red-500"
								}`}>
									{isExporting && (
										<span className="h-2 w-2 rounded-full bg-orange-500 animate-ping" />
									)}
									<span>{exportMessage}</span>
								</div>
							) : null}
						</section>

						<section className="border border-red-200 bg-red-50/40 dark:border-red-900/30 dark:bg-red-950/10 rounded-2xl p-6 space-y-4">
							<div>
								<h3 className="text-lg font-semibold text-red-600 dark:text-red-400">Danger Zone</h3>
								<p className="text-sm text-red-600/80 dark:text-red-400/80 mt-1">
									Account deletion soft-deletes past scan history. This action cannot be undone and will permanently delete your account and all associated data.
								</p>
							</div>

							{showDeleteConfirm ? (
								<div className="space-y-3 rounded-xl border border-red-200/50 bg-red-50/50 dark:border-red-900/20 dark:bg-red-950/5 p-4">
									<p className="text-sm font-medium text-red-700 dark:text-red-300">
										Are you sure you want to delete your account? All scan history will be soft-deleted.
									</p>
									<div className="flex flex-wrap gap-3">
										<RippleButton
											type="button"
											onClick={handleDeleteAccount}
											disabled={isDeleting}
											className="border-red-600 bg-red-600 hover:bg-red-700 text-white font-medium min-w-[140px]"
											rippleColor="rgba(255, 255, 255, 0.3)"
										>
											{isDeleting ? "Deleting..." : "Confirm Delete"}
										</RippleButton>
										<RippleButton
											type="button"
											onClick={() => setShowDeleteConfirm(false)}
											disabled={isDeleting}
											className="border-zinc-200 bg-zinc-100 text-slate-700 hover:bg-slate-200 hover:text-slate-900 dark:bg-zinc-800 dark:border-zinc-700 dark:text-zinc-300 dark:hover:bg-zinc-700 dark:hover:text-zinc-100 font-medium"
											rippleColor="#fb923c"
										>
											Cancel
										</RippleButton>
									</div>
								</div>
							) : (
								<div>
									<RippleButton
										type="button"
										onClick={() => setShowDeleteConfirm(true)}
										className="border-red-600 bg-red-600 hover:bg-red-700 text-white font-medium"
										rippleColor="rgba(255, 255, 255, 0.3)"
									>
										Delete Account
									</RippleButton>
								</div>
							)}
						</section>

						<div className="flex justify-end">
							<RippleButton type="button" onClick={handleLogout} className="min-w-[140px] font-medium" rippleColor="#fb923c">
								<span className="inline-flex items-center gap-2">
									<LogOut className="h-4 w-4" />
									Logout
								</span>
							</RippleButton>
						</div>
					</CardContent>
				</Card>
			</main>
		</div>
	);
}