import { permanentRedirect } from "next/navigation";

export default function EscrowRedirectPage() {
  permanentRedirect("/secure-transaction");
}
