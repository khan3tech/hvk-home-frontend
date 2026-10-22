import type { NavLink } from "@/types";

export const TECH_COMPANY_NAME = "HVK";
export const TECH_LEGAL_NAME = "HVK Tech Innovations Pvt. Ltd.";
export const TECH_EMAIL = "info@hvktech.in";
export const TECH_ADDRESS =
  "HIG 216, Beside Bank of Baroda, 2nd Floor, Phase 1 & 2, Kukatpally, Hyderabad, Telangana 500072";
export const TECH_PHONES = [
  { label: "+91 76719 18171", href: "tel:+917671918171" },
  { label: "+91 81212 88894", href: "tel:+918121288894" },
];

export const TECH_NAV_LINKS: NavLink[] = [
  { label: "Home", href: "#home" },
  { label: "Services", href: "#services" },
  { label: "Why HVK", href: "#why-hvk" },
  { label: "Contact", href: "#contact" },
  { label: "About", href: "#about" },
];

// Placeholder profile URLs — replace with HVK's real social accounts.
export const TECH_SOCIAL_LINKS = [
  { label: "LinkedIn", href: "https://www.linkedin.com", icon: "linkedin" },
  { label: "Instagram", href: "https://www.instagram.com", icon: "instagram" },
  { label: "YouTube", href: "https://www.youtube.com", icon: "youtube" },
  { label: "X", href: "https://x.com", icon: "x" },
] as const;

export const TECH_HERO_WORDS = [
  "People",
  "Ideas",
  "Experiences",
  "Solutions",
  "A Brighter",
  "Tomorrow",
];

export const TECH_HERO_STATS = [
  { value: "6+", label: "Specialized Services" },
  { value: "100+", label: "Happy Clients" },
  { value: "10+", label: "Years of Combined Expertise" },
];

export const TECH_TICKER_ITEMS = [
  "HVK Innovation Software Solutions is now live",
  "Creating exceptional experiences worldwide",
  "Let's build something great together",
];

export interface TechService {
  title: string;
  description: string;
  image: string;
}

export const TECH_SERVICES: TechService[] = [
  {
    title: "HVK Event Management",
    description: "We create experiences that bring people together.",
    image: "/images/tech/service-events.jpg",
  },
  {
    title: "HVK Food Services",
    description: "Great food. Thoughtfully crafted experiences.",
    image: "/images/tech/service-food.jpg",
  },
  {
    title: "HVK Interior",
    description: "Spaces designed to inspire the way you live and work.",
    image: "/images/tech/service-interior.jpg",
  },
  {
    title: "HVK Photography",
    description: "Every moment deserves to be remembered.",
    image: "/images/tech/service-photography.jpg",
  },
  {
    title: "HVK Innovation Software Solutions",
    description: "Turning ideas into powerful digital solutions.",
    image: "/images/tech/service-software.jpg",
  },
  {
    title: "HVK Promotion & Digital Marketing",
    description: "Make your brand impossible to ignore.",
    image: "/images/tech/service-marketing.jpg",
  },
];

export const TECH_WHY_POINTS = [
  {
    icon: "gem",
    title: "Experience",
    text: "Years of expertise across multiple industries.",
  },
  {
    icon: "network",
    title: "Integrated Solutions",
    text: "End-to-end services under one brand.",
  },
  {
    icon: "lightbulb",
    title: "Innovation",
    text: "Forward-thinking and technology-driven.",
  },
  {
    icon: "users",
    title: "One Ecosystem",
    text: "Six capabilities working together for greater impact.",
  },
] as const;

export const TECH_ABOUT_STATS = [
  { value: "6+", label: "Specialized Services" },
  { value: "100+", label: "Happy Clients" },
  { value: "∞", label: "Bigger Possibilities" },
];

export const TECH_PROCESS_STEPS = [
  { title: "Discover", text: "Understand your goals and requirements." },
  { title: "Plan", text: "Create a tailored strategy and roadmap." },
  { title: "Execute", text: "Bring ideas to life with precision and quality." },
  { title: "Deliver", text: "Ensure satisfaction and lasting impact." },
];

export const TECH_CTA_WORDS = ["Ideas", "People", "Experiences", "Solutions"];

export const TECH_FOOTER_GROUPS: { title: string; links: NavLink[] }[] = [
  {
    title: "Company",
    links: [
      { label: "Why HVK", href: "#why-hvk" },
      { label: "Our Process", href: "#process" },
      { label: "Contact", href: "#contact" },
      { label: "About HVK", href: "#about" },
    ],
  },
  {
    title: "Our Services",
    links: [
      { label: "Event Management", href: "#services" },
      { label: "Food Services", href: "#services" },
      { label: "Interior", href: "#services" },
      { label: "Photography", href: "#services" },
      { label: "Software Solutions", href: "#services" },
      { label: "Digital Marketing", href: "#services" },
    ],
  },
  {
    title: "Resources",
    links: [
      { label: "Privacy Policy", href: "/privacy-policy" },
      { label: "Terms & Conditions", href: "/terms" },
    ],
  },
];
