import { getCopyByPage } from "@/lib/copy-system";
import { OnboardingClient } from "./OnboardingClient";

export const dynamic = "force-dynamic";

export default async function OnboardingPage() {
  const copy = await getCopyByPage("/onboarding");
  return <OnboardingClient copy={copy} />;
}
