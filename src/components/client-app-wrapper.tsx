"use client";
import { usePathname } from "next/navigation";
import { Sidebar, MobileHeader } from "@/components/sidebar";
import { OnboardingProvider } from "@/components/onboarding-provider";
import { QuickAddFab } from "@/components/quick-add-fab";

export function ClientAppWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  const hiddenPaths = ["/", "/onboarding", "/login"];
  const isHidden = hiddenPaths.includes(pathname);

  return (
    <OnboardingProvider>
      {!isHidden && (
        <>
          <Sidebar />
          <MobileHeader />
          <QuickAddFab />
        </>
      )}
      <main className={!isHidden ? "lg:pl-64 pb-20 lg:pb-0" : ""}>
        <div className="min-h-screen">{children}</div>
      </main>
    </OnboardingProvider>
  );
}