export const ONBOARDING_KEY = "lifeos_onboarding_completed";

export function hasCompletedOnboarding(userId: string): boolean {
  if (typeof window === "undefined") return true; // Default to true on server to avoid hydration mismatch flashes
  return localStorage.getItem(`${ONBOARDING_KEY}_${userId}`) === "true";
}

export function setOnboardingCompleted(userId: string) {
  if (typeof window !== "undefined") {
    localStorage.setItem(`${ONBOARDING_KEY}_${userId}`, "true");
  }
}

export function resetOnboarding(userId: string) {
  if (typeof window !== "undefined") {
    localStorage.removeItem(`${ONBOARDING_KEY}_${userId}`);
  }
}
