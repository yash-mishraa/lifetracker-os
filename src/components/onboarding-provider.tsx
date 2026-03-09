"use client";

import { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { hasCompletedOnboarding } from "@/lib/services/onboarding-service";
import { useAuth } from "@/components/auth-provider";

export function OnboardingProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isLoading } = useAuth();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    if (isLoading) return; // Wait for AuthProvider to finish

    // If there is no user, AuthProvider handles redirecting to /login
    // We shouldn't interfere by sending them to /onboarding
    if (!user) {
      setIsChecking(false);
      return;
    }

    const completed = hasCompletedOnboarding(user.id);
    const isAuthRoute = pathname === "/login" || pathname === "/";
    
    // If not completed and they are not already ON the onboarding page or login pages, redirect them.
    if (!completed && pathname !== "/onboarding" && !isAuthRoute) {
      router.replace("/onboarding");
    } else if (completed && pathname === "/onboarding") {
      router.replace("/dashboard");
    }
    
    setIsChecking(false);
  }, [pathname, router, user, isLoading]);

  // Optionally return null or a loader while checking to prevent layout flash.
  if (isLoading || isChecking) {
    return null; 
  }

  return <>{children}</>;
}
