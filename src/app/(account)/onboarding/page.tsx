import { cookies } from "next/headers";
import { OnboardingAccessGate } from "./OnboardingAccessGate";
import { OnboardingClientShell } from "./OnboardingClientShell";
import { createOnboardingSessionProof } from "@/lib/domains/internal-auth/onboarding-session";

export const dynamic = "force-dynamic";

export default async function OnboardingPage() {
  const cookieStore = await cookies();
  const gate = cookieStore.get("onboarding_gate_access")?.value === "1";
  if (!gate) {
    return <OnboardingAccessGate />;
  }

  const { sessionId, onboardingSessionToken } = createOnboardingSessionProof();
  return (
    <OnboardingClientShell
      initialSessionId={sessionId}
      onboardingSessionToken={onboardingSessionToken}
    />
  );
}

