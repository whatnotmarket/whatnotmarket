import { ProfileClient } from "@/components/profile/ProfileClient";

type SellerProfilePageProps = {
  params: Promise<{ handle: string }>;
};

export default async function SellerProfilePage({ params }: SellerProfilePageProps) {
  const { handle } = await params;
  return <ProfileClient targetHandle={handle} routeRole="seller" />;
}
