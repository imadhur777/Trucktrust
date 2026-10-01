// Legal copy shown in the Terms & Conditions screen and linked from registration.
// Replace PLACEHOLDER sections with the final text supplied by the business owner.

export const TERMS_LAST_UPDATED = "June 2026";

export interface TermsSection {
  title: string;
  body: string;
}

export const TERMS_SECTIONS: TermsSection[] = [
  {
    title: "1. Acceptance of terms",
    body:
      "By creating a TruckTrust account you agree to these Terms & Conditions and our use of your data to operate the marketplace. If you do not agree, please do not use the service.",
  },
  {
    title: "2. The marketplace",
    body:
      "TruckTrust connects shippers who need to move goods with drivers and fleet owners who have spare return-trip capacity. TruckTrust is a technology platform and is not a carrier, freight forwarder or party to the transport contract between shipper and driver.",
  },
  {
    title: "3. Accounts & verification",
    body:
      "You must provide accurate information and keep your login details secure. Accounts may be subject to KYC verification. TruckTrust may suspend accounts that provide false information or misuse the platform.",
  },
  {
    title: "4. Loads, offers & bookings",
    body:
      "Shippers are responsible for accurate load details (weight, material, dates). Drivers are responsible for having the right vehicle, permits and insurance. An accepted offer forms a binding booking between shipper and driver.",
  },
  {
    title: "5. Payments & fees",
    body:
      "TruckTrust charges a platform fee (currently 8%) on each completed booking. Payouts to drivers are released after delivery is confirmed by OTP. Cancellations after booking may incur charges.",
  },
  {
    title: "6. Pickup & delivery verification",
    body:
      "Trips are verified using one-time codes shared by the shipper. Sharing codes before goods are handed over, or verifying without physical handover, is prohibited.",
  },
  {
    title: "7. Disputes",
    body:
      "Either party may raise a dispute from the trip screen. TruckTrust will review the evidence provided and may hold payouts until resolution. Decisions made by the TruckTrust team are final on the platform.",
  },
  {
    title: "8. Liability",
    body:
      "PLACEHOLDER — insert the final limitation-of-liability wording, insurance requirements and governing law supplied by the business owner.",
  },
  {
    title: "9. Contact",
    body: "PLACEHOLDER — insert the official support email and registered business address.",
  },
];
