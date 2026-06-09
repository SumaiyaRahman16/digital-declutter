"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { HardDriveDownload, History, LogOut, UserRound } from "lucide-react";
import { RippleButton } from "@/components/ui/ripple-button";

export function Navbar() {
  const router = useRouter();
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const refreshAuthState = () => {
      setIsAuthenticated(Boolean(localStorage.getItem("token")));
    };

    refreshAuthState();
    window.addEventListener("storage", refreshAuthState);
    window.addEventListener("authchange", refreshAuthState as EventListener);

    return () => {
      window.removeEventListener("storage", refreshAuthState);
      window.removeEventListener("authchange", refreshAuthState as EventListener);
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("token");
    window.dispatchEvent(new Event("authchange"));
    setIsAuthenticated(false);
    router.push("/login");
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between px-4 md:px-8 mx-auto">
        {/* Branding / Logo */}
        <Link href="/" className="flex items-center space-x-2 font-bold text-xl tracking-tight">
          <HardDriveDownload className="h-6 w-6 text-orange-500" />
          <span>Digital Declutter</span>
        </Link>

        {/* Action Button */}
        <nav className="flex items-center space-x-3">
          {isAuthenticated ? (
            <>
              <RippleButton
                asChild
                className="h-10 min-w-[132px] px-5 whitespace-nowrap font-medium"
                rippleColor="linear-gradient(135deg, rgba(17, 24, 39, 0.55), rgba(249, 115, 22, 0.95))"
              >
                <Link href="/history" className="inline-flex items-center gap-2">
                  <History className="h-4 w-4" />
                  History
                </Link>
              </RippleButton>
              <RippleButton
                asChild
                className="h-10 min-w-[132px] px-5 whitespace-nowrap font-medium"
                rippleColor="linear-gradient(135deg, rgba(17, 24, 39, 0.55), rgba(249, 115, 22, 0.95))"
              >
                <Link href="/profile" className="inline-flex items-center gap-2">
                  <UserRound className="h-4 w-4" />
                  Profile
                </Link>
              </RippleButton>
              <RippleButton
                type="button"
                onClick={handleLogout}
                className="h-10 min-w-[132px] px-5 whitespace-nowrap font-medium"
                rippleColor="linear-gradient(135deg, rgba(17, 24, 39, 0.55), rgba(249, 115, 22, 0.95))"
              >
                <span className="inline-flex items-center gap-2">
                  <LogOut className="h-4 w-4" />
                  Logout
                </span>
              </RippleButton>
            </>
          ) : (
            <>
              {/* Login Button - Matches your working History structure perfectly */}
              <RippleButton
                asChild
                className="h-10 w-32 whitespace-nowrap font-medium"
                rippleColor="linear-gradient(135deg, rgba(17, 24, 39, 0.55), rgba(249, 115, 22, 0.95))"
              >
                <Link href="/login" className="inline-flex items-center justify-center w-full h-full">
                  Login
                </Link>
              </RippleButton>

              {/* Sign Up Button - Matches your working History structure perfectly */}
              <RippleButton
                asChild
                className="h-10 w-32 whitespace-nowrap font-medium"
                rippleColor="linear-gradient(135deg, rgba(17, 24, 39, 0.55), rgba(249, 115, 22, 0.95))"
              >
                <Link href="/signup" className="inline-flex items-center justify-center w-full h-full">
                  Sign Up
                </Link>
              </RippleButton>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}