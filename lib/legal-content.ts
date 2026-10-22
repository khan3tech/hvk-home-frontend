import { SITE_NAME } from "@/lib/constants";

export const TERMS_SECTIONS = [
  {
    heading: "Acceptance of Terms",
    body: "By registering for a program or using this website, you agree to be bound by these Terms & Conditions. If you do not agree with any part of these terms, please do not use our services.",
  },
  {
    heading: "Registration",
    body: "Registration requires accurate and complete information. Providing false information may result in your registration being cancelled without a refund.",
  },
  {
    heading: "Payments",
    body: "The registration fee is processed securely through our payment partner. Your seat is confirmed only once payment has been successfully verified.",
  },
  {
    heading: "Refunds & Cancellations",
    body: "Refund and cancellation requests are reviewed on a case-by-case basis. Please contact us directly with your registration details for any refund-related query.",
  },
  {
    heading: "Program Changes",
    body: `${SITE_NAME} reserves the right to modify program schedules, content, or delivery format where necessary, and will make reasonable efforts to inform registered candidates of any material changes.`,
  },
  {
    heading: "Limitation of Liability",
    body: `${SITE_NAME} is not liable for any indirect or incidental damages arising from the use of our website or participation in our programs.`,
  },
  {
    heading: "Changes to These Terms",
    body: "We may revise these Terms & Conditions from time to time. Continued use of our services after changes are posted constitutes acceptance of the revised terms.",
  },
] as const;

export const PRIVACY_SECTIONS = [
  {
    heading: "Information We Collect",
    body: "When you register for a program with us, we collect the details you submit through our registration form — such as your name, email address, phone number, college, and location — along with payment confirmation details from our payment processor.",
  },
  {
    heading: "How We Use Your Information",
    body: "We use this information to process your registration, confirm your payment, issue exam access where applicable, and communicate important updates about our programs. We do not sell your personal information to third parties.",
  },
  {
    heading: "Payment Processing",
    body: "Payments are handled by a third-party payment gateway. We do not store your card, UPI, or bank details on our servers — that data is processed directly by our payment partner under their own security and privacy practices.",
  },
  {
    heading: "Data Security",
    body: "We take reasonable technical and organizational measures to protect your personal information from unauthorized access, alteration, or disclosure.",
  },
  {
    heading: "Your Rights",
    body: "You may contact us at any time to request access to, correction of, or deletion of the personal information we hold about you.",
  },
  {
    heading: "Changes to This Policy",
    body: "We may update this policy from time to time. Continued use of our services after changes are posted constitutes acceptance of the revised policy.",
  },
] as const;
