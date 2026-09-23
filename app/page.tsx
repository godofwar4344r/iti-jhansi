import { currentUser } from "@/lib/auth";
import { LandingPageClient } from "@/components/landing/landing-page-client";

export default async function LandingPage() {
  const user = await currentUser();
  return <LandingPageClient user={user} />;
}
