import {
  GraduationCap,
  Code2,
  Briefcase,
  Users,
  Lightbulb,
  Settings,
  Linkedin,
  Instagram,
  Youtube,
  Facebook,
} from "lucide-react";
import type {
  HeroSlide,
  ServiceItem,
  TestimonialItem,
  NavLink,
  FooterLinkGroupData,
  SocialLink,
  StatItem,
} from "@/types";

export const SITE_NAME = "HVK Tech Online Examination";
export const SITE_TAGLINE = "Innovate | Build | Grow";
export const COMPANY_WEBSITE_URL = "https://www.hvkinfotech.com";
export const PHONE_NUMBER = "+91 98765 43210";
export const PHONE_NUMBER_HREF = "tel:+919876543210";
export const CONTACT_EMAIL = "info@hvkinfotech.com";
export const OFFICE_LOCATION = "HIG 216, Beside Bank of Baroda, 2nd Floor, Phase 1 & 2, Kukatpally, Hyderabad, Telangana 500072";
export const WORKING_HOURS = "Mon - Sat: 9:00 AM - 6:00 PM";

export const ABOUT_IMAGES: string[] = [
  "/images/about/office.jpg",
  "/images/about/team-1.jpg",
  "/images/about/team-2.jpg",
];

export const NAV_LINKS: NavLink[] = [
  { label: "Home", href: "/registration" },
  { label: "Services", href: "/registration#services" },
  { label: "Testimonials", href: "/registration#testimonials" },
  { label: "Contact", href: "#contact" },
  { label: "About", href: "/#about" },
];

export const SOCIAL_LINKS: SocialLink[] = [
  { label: "LinkedIn", href: COMPANY_WEBSITE_URL, icon: Linkedin },
  { label: "Instagram", href: "https://www.instagram.com/hvk.tech_innovations", icon: Instagram },
  { label: "YouTube", href: "https://www.youtube.com/@hvktechinnovation", icon: Youtube },
  { label: "Facebook", href: COMPANY_WEBSITE_URL, icon: Facebook },
];

export const HERO_SLIDES: HeroSlide[] = [
  {
    id: "slide-1",
    eyebrow: "HVK Tech Online Examination",
    headingLines: ["Shape Your Future with", "HVK Tech Online Examination"],
    highlightWord: "Examination",
    subheading: "Learn · Build · Grow · Succeed",
    description:
      "Practical learning, real-world projects and career opportunities to help you become industry ready.",
    ctaLabel: "Explore Opportunities",
    ctaHref: "/registration#services",
    image: "/images/hero/hero-1.jpg",
  },
  {
    id: "slide-2",
    eyebrow: "HVK Tech Online Examination",
    headingLines: ["Build Skills That", "Matter"],
    highlightWord: "Matter",
    subheading: "Practical · Hands-on · Industry-Ready",
    description:
      "Gain practical learning and real-world project experience designed by industry experts to accelerate your career.",
    ctaLabel: "Explore Programs",
    ctaHref: "/registration#services",
    image: "/images/hero/hero-2.jpg",
  },
  {
    id: "slide-3",
    eyebrow: "HVK Tech Online Examination",
    headingLines: ["Start Your Career", "Journey"],
    highlightWord: "Journey",
    subheading: "Internships · Placements · Mentorship",
    description:
      "Get access to internships, dedicated placement support and career guidance from experienced mentors.",
    ctaLabel: "Join Us",
    ctaHref: "/registration#registration",
    image: "/images/hero/hero-3.jpg",
  },
];

export const SERVICES: ServiceItem[] = [
  {
    id: "training-certification",
    icon: GraduationCap,
    title: "Training & Certification",
    description: "Industry-focused programs with certification.",
  },
  {
    id: "internship-programs",
    icon: Code2,
    title: "Internship Programs",
    description: "Gain real-world experience with live projects.",
  },
  {
    id: "placement-assistance",
    icon: Briefcase,
    title: "Placement Assistance",
    description: "Connect with top companies and opportunities.",
  },
  {
    id: "career-guidance",
    icon: Users,
    title: "Career Guidance",
    description: "Expert mentorship for a brighter career path.",
  },
  {
    id: "workshops-events",
    icon: Lightbulb,
    title: "Workshops & Events",
    description: "Learn from industry experts and expand your network.",
  },
  {
    id: "custom-solutions",
    icon: Settings,
    title: "Custom Solutions",
    description: "Tailored training for colleges and organizations.",
  },
];

export const ABOUT_STATS: StatItem[] = [
  { value: "Industry", label: "Expert Trainers" },
  { value: "1000+", label: "Students Trained" },
  { value: "95%", label: "Placement Support" },
];

export const TESTIMONIALS: TestimonialItem[] = [
  {
    id: "aarav-sharma",
    name: "Aarav Sharma",
    education: "B.Tech, Lucknow University",
    rating: 5,
    quote:
      "HVK Tech Online Examination provided amazing practical training and placement support. The mentors were very helpful and always guide you in the right direction.",
    avatar: "/images/testimonials/aarav-sharma.jpg",
  },
  {
    id: "priya-verma",
    name: "Priya Verma",
    education: "BCA, Delhi University",
    rating: 5,
    quote:
      "The internship program at HVK Tech Online Examination helped me gain real-world experience. Highly recommended for anyone serious about their career.",
    avatar: "/images/testimonials/priya-verma.jpg",
  },
  {
    id: "rohit-singh",
    name: "Rohit Singh",
    education: "MCA, AKTU",
    rating: 5,
    quote:
      "Great learning environment, supportive team, and excellent placement assistance. HVK Tech Online Examination truly cares about its students.",
    avatar: "/images/testimonials/rohit-singh.jpg",
  },
  {
    id: "sneha-gupta",
    name: "Sneha Gupta",
    education: "B.Sc IT, Mumbai University",
    rating: 5,
    quote:
      "The workshops and hands-on sessions gave me confidence to face real interviews. HVK Tech Online Examination's guidance made all the difference.",
    avatar: "/images/testimonials/sneha-gupta.jpg",
  },
];

export const QUICK_LINKS: NavLink[] = [
  { label: "Home", href: "/registration" },
  { label: "Services", href: "/registration#services" },
  { label: "Testimonials", href: "/registration#testimonials" },
  { label: "Contact", href: "#contact" },
  { label: "About Us", href: "/#about" },
];

export const FOOTER_SERVICE_LINKS: NavLink[] = SERVICES.map((service) => ({
  label: service.title,
  href: "/registration#services",
}));

export const FOOTER_LINK_GROUPS: FooterLinkGroupData[] = [
  { title: "Quick Links", links: QUICK_LINKS },
  { title: "Our Services", links: FOOTER_SERVICE_LINKS },
];

export const INDIAN_STATES: string[] = [
  "Andhra Pradesh",
  "Arunachal Pradesh",
  "Assam",
  "Bihar",
  "Chhattisgarh",
  "Goa",
  "Gujarat",
  "Haryana",
  "Himachal Pradesh",
  "Jharkhand",
  "Karnataka",
  "Kerala",
  "Madhya Pradesh",
  "Maharashtra",
  "Manipur",
  "Meghalaya",
  "Mizoram",
  "Nagaland",
  "Odisha",
  "Punjab",
  "Rajasthan",
  "Sikkim",
  "Tamil Nadu",
  "Telangana",
  "Tripura",
  "Uttar Pradesh",
  "Uttarakhand",
  "West Bengal",
  "Delhi (NCT)",
  "Jammu and Kashmir",
  "Ladakh",
  "Chandigarh",
  "Puducherry",
];
