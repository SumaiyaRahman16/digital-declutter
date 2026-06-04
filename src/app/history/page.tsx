import { Navbar } from "@/components/layout/navbar";
import { HistoryList } from "@/components/features/history/history-list";

export default function HistoryPage() {
	return (
		<div className="min-h-screen bg-background text-foreground">
			<Navbar />
			<main className="container mx-auto px-4 py-10 md:py-16">
				<div className="mx-auto max-w-5xl">
					<HistoryList />
				</div>
			</main>
		</div>
	);
}