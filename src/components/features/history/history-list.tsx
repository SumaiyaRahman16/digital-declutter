"use client";

import { Fragment, useEffect, useMemo, useState } from "react";
import { ChevronDown, ChevronUp, Clock3, DatabaseZap, Loader2 } from "lucide-react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { fetchScanHistory, type ScanFile, type ScanHistoryItem } from "@/lib/api-client";

//js functions to format bytes, date, and score display

function formatBytes(bytes: number) {
	if (!Number.isFinite(bytes) || bytes <= 0) {
		return "0 Bytes";
	}

	const units = ["Bytes", "KB", "MB", "GB", "TB"];
	const index = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
	const value = bytes / 1024 ** index;

	return `${value.toFixed(value >= 10 || index === 0 ? 0 : 1)} ${units[index]}`;
}

function formatDateTime(timestamp: string) {
	const parsed = new Date(timestamp);

	if (Number.isNaN(parsed.getTime())) {
		return timestamp;
	}

	return parsed.toLocaleString(undefined, {
		year: "numeric",
		month: "short",
		day: "numeric",
		hour: "2-digit",
		minute: "2-digit",
	});
}

function scoreTone(score: number) {
	if (score >= 75) return "border-red-300 bg-red-50 text-red-700 dark:border-red-900/60 dark:bg-red-950/30 dark:text-red-300";
	if (score >= 50) return "border-orange-300 bg-orange-50 text-orange-700 dark:border-orange-900/60 dark:bg-orange-950/30 dark:text-orange-300";
	if (score >= 25) return "border-amber-300 bg-amber-50 text-amber-700 dark:border-amber-900/60 dark:bg-amber-950/30 dark:text-amber-300";
	return "border-emerald-300 bg-emerald-50 text-emerald-700 dark:border-emerald-900/60 dark:bg-emerald-950/30 dark:text-emerald-300";
}

function formatScore(score: number) {
	return `${Math.round(score)}%`;
}

function getFolderName(folderPath: string) {
	const parts = folderPath.split("/").filter(Boolean);
	return parts.length > 0 ? parts[parts.length - 1] : folderPath;
}

export function HistoryList() {

    //states and hooks with type script types for history, loading, error, and expanded scan details
	const [history, setHistory] = useState<ScanHistoryItem[]>([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [expandedScanId, setExpandedScanId] = useState<number | null>(null);

	useEffect(() => {
		let active = true;

		const loadHistory = async () => {
			try {
				setLoading(true);
				setError(null);
				const results = await fetchScanHistory();

				if (active) {
					setHistory(results);
				}
			} catch (fetchError) {
				if (active) {
					setError(fetchError instanceof Error ? fetchError.message : "Unable to load scan history.");
					setHistory([]);
				}
			} finally {
				if (active) {
					setLoading(false);
				}
			}
		};

		void loadHistory();

		return () => {
			active = false;
		};
	}, []);

	const sortedHistory = useMemo(
		() => [...history].sort((left, right) => new Date(right.scanned_at).getTime() - new Date(left.scanned_at).getTime()),
		[history],
	);

	const toggleRow = (scanId: number) => {
		setExpandedScanId((current) => (current === scanId ? null : scanId));
	};

	if (loading) {
		return (
			<div className="flex min-h-[320px] items-center justify-center rounded-2xl border border-border/60 bg-background/95 shadow-sm">
				<div className="flex flex-col items-center gap-3 text-muted-foreground">
					<Loader2 className="h-8 w-8 animate-spin text-orange-500" />
					<p className="text-sm font-medium">Loading scan history...</p>
				</div>
			</div>
		);
	}

	if (error) {
		return (
			<div className="rounded-2xl border border-border/60 bg-background/95 p-8 text-center shadow-sm">
				<div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-orange-500/10 text-orange-500">
					<DatabaseZap className="h-6 w-6" />
				</div>
				<h3 className="text-base font-semibold text-foreground">Unable to load history</h3>
				<p className="mt-2 text-sm text-muted-foreground">{error}</p>
			</div>
		);
	}

	if (sortedHistory.length === 0) {
		return (
			<div className="rounded-2xl border border-dashed border-border/60 bg-background/95 p-10 text-center shadow-sm">
				<div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-zinc-100 text-zinc-500 dark:bg-zinc-900">
					<Clock3 className="h-6 w-6" />
				</div>
				<h3 className="text-base font-semibold text-foreground">No scan logs found.</h3>
				<p className="mt-2 text-sm text-muted-foreground">Drop a directory to get started!</p>
			</div>
		);
	}

	return (
		<div className="w-full rounded-2xl border border-border/60 bg-background/95 shadow-sm">
			<div className="border-b border-border/60 px-6 py-4">
				<h2 className="text-lg font-semibold tracking-tight text-foreground">Scan History</h2>
				<p className="mt-1 text-sm text-muted-foreground">Recent scans saved from the secured engine.</p>
			</div>

			<div className="overflow-hidden">
				<Table>
					<TableHeader className="bg-muted/40">
						<TableRow>
							<TableHead>Folder Name / Path</TableHead>
							<TableHead>Scanned Date</TableHead>
							<TableHead>Files</TableHead>
							<TableHead>Total Storage Saved</TableHead>
						</TableRow>
					</TableHeader>
					<TableBody>
						{sortedHistory.map((item) => {
							const isExpanded = expandedScanId === item.scan_id;

							return (
								<Fragment key={item.scan_id}>
									<TableRow
										className="cursor-pointer transition-colors hover:bg-muted/30"
										aria-expanded={isExpanded}
										onClick={() => toggleRow(item.scan_id)}
									>
										<TableCell className="max-w-[360px] align-middle font-medium text-foreground">
											<div className="flex items-center gap-3">
												<div className="min-w-0 flex-1">
													<p className="truncate" title={item.folder_path}>{getFolderName(item.folder_path)}</p>
													<p className="truncate text-xs font-normal text-muted-foreground" title={item.folder_path}>{item.folder_path}</p>
												</div>
												<span className="rounded-full border border-border/60 bg-background px-2 py-0.5 text-[11px] font-medium text-muted-foreground">#{item.scan_id}</span>
											</div>
										</TableCell>
										<TableCell className="text-muted-foreground">{formatDateTime(item.scanned_at)}</TableCell>
										<TableCell className="text-foreground">{item.total_files}</TableCell>
										<TableCell className="text-foreground">
											<div className="flex items-center gap-3">
												<span>{formatBytes(item.total_size)}</span>
												<span className="text-xs text-muted-foreground">saved</span>
												<span className="ml-auto text-muted-foreground">
													{isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
												</span>
											</div>
										</TableCell>
									</TableRow>

									<TableRow className={isExpanded ? "bg-muted/10" : "bg-transparent"}>
										<TableCell colSpan={4} className="p-0">
											<div
												className={`overflow-hidden transition-all duration-300 ease-in-out ${isExpanded ? "max-h-[900px] opacity-100" : "max-h-0 opacity-0"}`}
											>
												<div className="border-t border-border/60 px-6 py-5">
													<div className="mb-4 flex items-center justify-between gap-3">
														<div>
															<p className="text-sm font-medium text-foreground">Files in this scan</p>
															<p className="text-xs text-muted-foreground">Individual file scores and metadata from the backend.</p>
														</div>
														<div className="rounded-full border border-border/60 bg-background px-3 py-1 text-xs text-muted-foreground">{item.files.length} files</div>
													</div>

													<div className="overflow-hidden rounded-xl border border-border/60">
														<Table>
															<TableHeader className="bg-muted/40">
																<TableRow>
																	<TableHead>File Name</TableHead>
																	<TableHead>Path</TableHead>
																	<TableHead>Size</TableHead>
																	<TableHead>Clutter Score</TableHead>
																</TableRow>
															</TableHeader>
															<TableBody>
																{item.files.length > 0 ? (
																	item.files.map((file: ScanFile, fileIndex: number) => (
																		<TableRow key={`${item.scan_id}-${file.path}-${fileIndex}`} className="transition-colors hover:bg-muted/30">
																			<TableCell className="max-w-[220px] font-medium text-foreground">
																				<p className="truncate" title={file.name}>{file.name}</p>
																			</TableCell>
																			<TableCell className="max-w-[320px] text-xs text-muted-foreground">
																				<p className="truncate font-mono" title={file.path}>{file.path}</p>
																			</TableCell>
																			<TableCell className="text-foreground">{formatBytes(file.size)}</TableCell>
																			<TableCell>
																				<span className={`inline-flex min-w-[84px] items-center justify-center rounded-full border px-2.5 py-1 text-xs font-semibold ${scoreTone(file.score)}`}>
																					{formatScore(file.score)}
																				</span>
																			</TableCell>
																		</TableRow>
																	))
																) : (
																	<TableRow>
																		<TableCell colSpan={4} className="py-8 text-center text-sm text-muted-foreground">
																			No file details were returned for this scan.
																		</TableCell>
																	</TableRow>
																)}
															</TableBody>
														</Table>
													</div>
												</div>
											</div>
										</TableCell>
									</TableRow>
								</Fragment>
							);
						})}
					</TableBody>
				</Table>
			</div>
		</div>
	);
}
