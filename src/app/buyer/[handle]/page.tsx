import { ProfileClient } from "@/components/profile/ProfileClient";

type BuyerProfilePageProps = {
  params: Promise<{ handle: string }>;
};

export default async function BuyerProfilePage({ params }: BuyerProfilePageProps) {
  const { handle } = await params;
  return <ProfileClient targetHandle={handle} routeRole="buyer" />;
}
