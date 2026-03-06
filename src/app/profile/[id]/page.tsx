import { redirect } from "next/navigation";

type ProfileByIdPageProps = {
  params: Promise<{ id: string }>;
};

export default async function ProfileByIdPage({ params }: ProfileByIdPageProps) {
  const { id } = await params;
  redirect(`/profile?id=${encodeURIComponent(id)}`);
}
