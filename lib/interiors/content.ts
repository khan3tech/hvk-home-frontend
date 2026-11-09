import { TECH_EMAIL, TECH_PHONES } from "@/lib/tech-constants";

/** Text and projects of the HVK Interiors site. Phase 1 keeps them here; editing screens and photos come later (spec 008, D5). */

export const INTERIORS_BASE = "/interiors";

export const INTERIORS_NAV = [
  { label: "Home", href: INTERIORS_BASE },
  { label: "About", href: `${INTERIORS_BASE}/about` },
  { label: "Services", href: `${INTERIORS_BASE}/services` },
  { label: "Estimate", href: `${INTERIORS_BASE}/estimate` },
  { label: "Portfolio", href: `${INTERIORS_BASE}/portfolio` },
  { label: "Blog", href: `${INTERIORS_BASE}/blog` },
  { label: "Contact", href: `${INTERIORS_BASE}/contact` },
];

export const INTERIORS_CONTACT = {
  /** Shown in the footer and on the contact page; change here when the studio address changes. */
  address: "Road No-1, Opp. Nethaji Park, KPHB Colony, Hyderabad",
  email: TECH_EMAIL,
  phones: TECH_PHONES,
  hours: "Monday to Saturday, 10 am to 7 pm",
};

export interface InteriorService {
  slug: string;
  title: string;
  summary: string;
  description: string;
  includes: string[];
  idealFor: string;
  timeline: string;
  icon: "sofa" | "hammer" | "ruler" | "armchair" | "paintbrush" | "clipboard" | "flower" | "compass";
  /** Picture for the service card and page (AI-generated; files in /public/images/interiors). */
  image: string;
}

export const INTERIOR_SERVICES: InteriorService[] = [
  {
    slug: "interior-design",
    title: "Interior Design",
    summary: "Stylish, functional and personalised interiors that reflect your taste and lifestyle.",
    description:
      "From the first sketch to the last cushion, we plan every room around the way you live. We study your space and requirements, prepare layouts and 3D views, and choose materials, colours and lighting that work together.",
    includes: ["Space study and requirement meeting", "Concept moodboard and colour palette", "2D layouts and 3D views", "Material, finish and lighting selection", "Execution drawings and site supervision"],
    idealFor: "New apartments, villas, offices and shops.",
    timeline: "Design in 2 to 3 weeks; execution 6 to 12 weeks depending on the scope.",
    icon: "sofa",
    image: "/images/interiors/service-interior-design.jpg",
  },
  {
    slug: "custom-fabrication",
    title: "Custom Fabrication",
    summary: "Customised designs crafted to match your space and requirements, with precision and quality.",
    description:
      "Wardrobes, TV units, kitchens, partitions, display units and one-off pieces are made to your exact measurements. We choose boards, laminates, hardware and finishes with you and build with care.",
    includes: ["Made-to-measure carpentry and metal work", "Choice of boards, laminates and hardware", "Factory-finish quality control", "Installation on site", "Warranty on workmanship"],
    idealFor: "Homes and commercial spaces that need storage or furniture that fits exactly.",
    timeline: "3 to 6 weeks from approval.",
    icon: "hammer",
    image: "/images/interiors/service-custom-fabrication.jpg",
  },
  {
    slug: "floor-planning",
    title: "Floor Planning",
    summary: "Make the most of your space with smart layouts that improve movement, comfort and functionality.",
    description:
      "A good plan decides how a home feels. We rework furniture zones, circulation and storage so every square foot is used well, and show you options before anything is built.",
    includes: ["Measured drawings of the existing space", "Two or three layout options", "Furniture and storage placement", "Light, ventilation and Vastu-friendly options on request", "Final plan ready for execution"],
    idealFor: "New homes before work starts, and homes that feel cramped.",
    timeline: "5 to 10 working days.",
    icon: "ruler",
    image: "/images/interiors/service-floor-planning.jpg",
  },
  {
    slug: "modern-furniture",
    title: "Modern Furniture",
    summary: "Contemporary furniture that combines comfort, style and durability for every room.",
    description: "Sofas, beds, dining sets, study desks and accent pieces chosen or made to suit your rooms, with fabrics, finishes and sizes tailored to your plan.",
    includes: ["Furniture plan for each room", "Ready-made and made-to-order options", "Fabric and finish samples", "Delivery and placement", "After-sales care"],
    idealFor: "Anyone furnishing a new home or refreshing a few rooms.",
    timeline: "2 to 8 weeks depending on the piece.",
    icon: "armchair",
    image: "/images/interiors/service-modern-furniture.jpg",
  },
  {
    slug: "home-renovation",
    title: "Home Renovation",
    summary: "Refresh your home with modern designs and smart improvements that enhance comfort, style and functionality.",
    description:
      "We upgrade existing spaces: new kitchens and bathrooms, flooring, false ceilings, painting, electrical and plumbing updates, with a clear plan, schedule and one team responsible.",
    includes: ["Site inspection and scope list", "Demolition and civil work", "Plumbing, electrical and waterproofing", "Flooring, painting and finishing", "Clean-up and handover"],
    idealFor: "Older homes and rooms that need a fresh start.",
    timeline: "3 to 10 weeks depending on the scope.",
    icon: "paintbrush",
    image: "/images/interiors/service-home-renovation.jpg",
  },
  {
    slug: "site-inspection",
    title: "Site Inspection",
    summary: "We inspect your site to understand condition, dimensions and requirements for smooth project planning.",
    description:
      "Before you buy, build or renovate, our team visits the site, takes measurements, checks the condition of walls, floors, services and finishes, and gives you a written report with photos and recommendations.",
    includes: ["On-site measurements", "Condition check of walls, floors and services", "Photo report with notes", "Recommendations and rough budget", "Snag list for new handovers"],
    idealFor: "Buyers, owners and anyone planning work on a property.",
    timeline: "Visit within a few days; report in 2 to 3 working days.",
    icon: "clipboard",
    image: "/images/interiors/service-site-inspection.jpg",
  },
  {
    slug: "soft-furnishing",
    title: "Soft Furnishing",
    summary: "Enhance your interiors with beautiful curtains, cushions, rugs and fabrics that bring warmth, texture and personality.",
    description: "Curtains, blinds, bed linen, cushions, rugs and upholstery chosen to match your colours and light, stitched and fitted to your measurements.",
    includes: ["Fabric and colour consultation", "Measurements and stitching", "Curtains, blinds and rugs", "Cushions, bed linen and upholstery", "Fitting on site"],
    idealFor: "Finishing a room, or changing its mood without major work.",
    timeline: "1 to 3 weeks.",
    icon: "flower",
    image: "/images/interiors/service-soft-furnishing.jpg",
  },
  {
    slug: "structural-drawing",
    title: "Structural Drawing",
    summary: "Detailed structural drawings that support safe and accurate construction, with coordinated design requirements and specifications.",
    description:
      "Accurate drawings for walls, openings, beams, partitions and services, prepared so builders, carpenters and engineers work from the same plan and avoid costly changes on site.",
    includes: ["Plans, sections and elevations", "Opening, beam and partition details", "Electrical and plumbing coordination", "Drawing sets for contractors", "Revisions during execution"],
    idealFor: "Builders, owners and contractors who need clear drawings before work starts.",
    timeline: "1 to 3 weeks depending on the size.",
    icon: "compass",
    image: "/images/interiors/service-structural-drawing.jpg",
  },
];

export const serviceBySlug = (slug: string): InteriorService | undefined => INTERIOR_SERVICES.find((s) => s.slug === slug);

export const PROJECT_ROOMS = ["Living room", "Bedroom", "Kitchen", "Dining", "Office", "Staircase"] as const;
export const PROJECT_STYLES = ["Modern", "Minimal", "Contemporary", "Classic"] as const;

export interface InteriorProject {
  slug: string;
  title: string;
  room: (typeof PROJECT_ROOMS)[number];
  style: (typeof PROJECT_STYLES)[number];
  city: string;
  areaSqft: number;
  summary: string;
  /** Picture (AI-generated; file in /public/images/interiors). Without one, a styled placeholder is shown. */
  image?: string;
}

export const INTERIOR_PROJECTS: InteriorProject[] = [
  { slug: "urban-artville", image: "/images/interiors/project-urban-artville.jpg", title: "The Urban Artville", room: "Staircase", style: "Modern", city: "Hyderabad", areaSqft: 1450, summary: "A bright duplex with a floating timber staircase as its centrepiece." },
  { slug: "magnolia-whimsical-boxed", image: "/images/interiors/project-magnolia-whimsical-boxed.jpg", title: "Magnolia Whimsical Boxed", room: "Living room", style: "Contemporary", city: "Hyderabad", areaSqft: 1100, summary: "Soft neutrals, a statement console and layered textures in a compact living room." },
  { slug: "decore-minimalism", image: "/images/interiors/project-decore-minimalism.jpg", title: "DeCore Minimalism", room: "Bedroom", style: "Minimal", city: "Visakhapatnam", areaSqft: 900, summary: "A calm bedroom with concealed storage, warm light and very few things on show." },
  { slug: "oak-and-brass-kitchen", image: "/images/interiors/project-oak-and-brass-kitchen.jpg", title: "Oak and Brass Kitchen", room: "Kitchen", style: "Modern", city: "Bengaluru", areaSqft: 150, summary: "A modular kitchen in oak laminate with brass handles and a quartz counter." },
  { slug: "family-dining-hall", image: "/images/interiors/project-family-dining-hall.jpg", title: "Family Dining Hall", room: "Dining", style: "Classic", city: "Kurnool", areaSqft: 260, summary: "A six-seater dining area with a crockery unit and a warm pendant." },
  { slug: "studio-office-floor", image: "/images/interiors/project-studio-office-floor.jpg", title: "Studio Office Floor", room: "Office", style: "Contemporary", city: "Hyderabad", areaSqft: 2200, summary: "An open workspace with acoustic ceiling panels and a small client lounge." },
];

export const INTERIOR_TESTIMONIALS = [
  { name: "Ananya", place: "Hyderabad", text: "HVK Interiors understood our vision perfectly. Every detail, from the lighting to the furniture, feels thoughtfully designed." },
  { name: "Kathik Varma", place: "Vizag", text: "HVK Interiors transformed our workspace into a modern, welcoming environment. The design makes a great impression on our clients while creating a better space for our team." },
  { name: "Rahul", place: "Kurnool", text: "The team made our home renovation smooth and stress-free. Their creativity, attention to detail and execution exceeded our expectations." },
];

export const INTERIOR_PROCESS = [
  { title: "Free consultation", text: "Tell us about your space, needs and budget, in person or on a call." },
  { title: "Site visit and measurements", text: "We measure, inspect and photograph the site." },
  { title: "Design and estimate", text: "You see layouts, 3D views and a clear, itemised quote." },
  { title: "Execution", text: "Our team builds, fits and supervises, with regular updates." },
  { title: "Handover", text: "A final check, a snag list closed, and a warranty on the work." },
];

export const INTERIOR_FAQS = [
  { q: "How accurate is the online estimate?", a: "It is worked out from the room sizes and the choices you make, shown as a range. The final quote follows a site visit, because exact materials, brands and site conditions change the price." },
  { q: "What do the Essential, Premium and Luxe packages mean?", a: "They are three levels of material and finish. Essential uses durable, budget-friendly materials; Premium upgrades laminates, hardware and fittings; Luxe uses top-grade finishes, branded hardware and custom detailing." },
  { q: "Is GST included in the estimate?", a: "No. GST is shown separately under the estimate." },
  { q: "Do you take up small projects such as one room?", a: "Yes. You can choose a single room or a few items such as a wardrobe or a TV unit." },
  { q: "Can I see the site visit before paying anything?", a: "The consultation and the site visit for a quote are free." },
];

/** Pictures of the home and about pages. */
export const INTERIORS_IMAGES = {
  hero: "/images/interiors/hero.jpg",
  aboutBedroom: "/images/interiors/about-bedroom.jpg",
  aboutLiving: "/images/interiors/about-living.jpg",
};
