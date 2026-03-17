import { cookies } from "next/headers";
import { OnboardingClient } from "./OnboardingClient";
import { OnboardingAccessGate } from "./OnboardingAccessGate";
import { createOnboardingSessionProof } from "@/lib/internal-auth/onboarding-session";

export const dynamic = "force-dynamic";

export default async function OnboardingPage() {
  const cookieStore = await cookies();
  const gate = cookieStore.get("onboarding_gate_access")?.value === "1";
  if (!gate) {
    return <OnboardingAccessGate />;
  }

  const { sessionId, onboardingSessionToken } = createOnboardingSessionProof();
  return (
    <OnboardingClient
      initialSessionId={sessionId}
      onboardingSessionToken={onboardingSessionToken}
    />
  );
}
