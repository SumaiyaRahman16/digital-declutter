import Link from "next/link";
import { Button } from "@/components/ui/button";
import { HardDriveDownload } from "lucide-react";

export function Navbar() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between px-4 md:px-8 mx-auto">
        {/* Branding / Logo */}
        <Link href="/" className="flex items-center space-x-2 font-bold text-xl tracking-tight">
          <HardDriveDownload className="h-6 w-6 text-zinc-900 dark:text-zinc-100" />
          <span>Digital Declutter</span>
        </Link>

        {/* Action Button */}
        <nav className="flex items-center space-x-4">
          <Link href="/login">
            <Button variant="ghost" size="sm" className="font-medium">
              Sign In
            </Button>
          </Link>
          <Link href="/login">
            <Button size="sm" className="font-medium bg-zinc-900 hover:bg-zinc-800 text-white">
              Get Started
            </Button>
          </Link>
        </nav>
      </div>
    </header>
  );
}