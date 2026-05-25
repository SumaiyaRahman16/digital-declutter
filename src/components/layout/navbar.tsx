import Link from "next/link";
import { HardDriveDownload } from "lucide-react";
import { RippleButton } from "@/components/ui/ripple-button";

export function Navbar() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between px-4 md:px-8 mx-auto">
        {/* Branding / Logo */}
        <Link href="/" className="flex items-center space-x-2 font-bold text-xl tracking-tight">
          <HardDriveDownload className="h-6 w-6 text-orange-500" />
          <span>Digital Declutter</span>
        </Link>

        {/* Action Button */}
        <nav className="flex items-center space-x-4">
          <RippleButton asChild className="h-10 w-32 whitespace-nowrap font-medium" rippleColor="linear-gradient(135deg, rgba(17, 24, 39, 0.55), rgba(249, 115, 22, 0.95))">
            <Link href="/login">Login</Link>
          </RippleButton>
          <RippleButton asChild className="h-10 w-32 whitespace-nowrap font-medium" rippleColor="linear-gradient(135deg, rgba(17, 24, 39, 0.55), rgba(249, 115, 22, 0.95))">
            <Link href="/signup">Sign Up</Link>
          </RippleButton>
        </nav>
      </div>
    </header>
  );
}