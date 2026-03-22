"use client";

import dynamic from "next/dynamic";

type OnboardingClientShellProps = {
  initialSessionId: string;
  onboardingSessionToken: string;
};

const OnboardingClient = dynamic(
  () => import("./OnboardingClient").then((mod) => mod.OnboardingClient),
  {
    ssr: false,
    loading: () => (
      <div className="flex min-h-screen items-center justify-center bg-[#c7c3df] text-zinc-700">
        Loading onboarding...
      </div>
    ),
  }
);

export function OnboardingClientShell({
  initialSessionId,
  onboardingSessionToken,
}: OnboardingClientShellProps) {
  return (
    <OnboardingClient
      initialSessionId={initialSessionId}
      onboardingSessionToken={onboardingSessionToken}
    />
  );
}
