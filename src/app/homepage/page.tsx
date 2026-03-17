import { redirect } from "next/navigation";

export default function LegacyHomepageRedirectPage() {
  redirect("/dev");
}
