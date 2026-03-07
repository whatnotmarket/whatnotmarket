import { redirect } from "next/navigation";

export default function TestLoginRedirectPage() {
  redirect("/login");
}
