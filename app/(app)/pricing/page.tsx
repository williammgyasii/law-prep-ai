import { getCurrentSubscription } from "@/actions/subscription";
import { PricingCards } from "./pricing-cards";

export default async function PricingPage() {
  const { tier, subscription } = await getCurrentSubscription();

  return (
    <PricingCards
      currentTier={tier}
      subscription={subscription}
    />
  );
}
