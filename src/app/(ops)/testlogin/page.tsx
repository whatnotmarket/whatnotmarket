import { redirect } from "next/navigation";

export default function TestLoginRedirectPage() {
  redirect("/auth");
}
