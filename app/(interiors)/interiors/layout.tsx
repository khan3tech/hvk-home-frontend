import type { Metadata } from "next";
import { Playfair_Display } from "next/font/google";
import { InteriorsFooter } from "@/components/interiors/interiors-footer";
import { InteriorsHeader } from "@/components/interiors/interiors-header";

const playfair = Playfair_Display({ subsets: ["latin"], variable: "--font-playfair", display: "swap" });

export const metadata: Metadata = {
  title: { default: "HVK Interiors | Interior design studio in Hyderabad", template: "%s | HVK Interiors" },
  description: "Interior design, custom fabrication, floor planning, home renovation and more. Get an instant estimate from your room sizes and book a free consultation.",
  openGraph: { type: "website", siteName: "HVK Interiors", title: "HVK Interiors | Where Spaces Become Stories", description: "Beautiful, functional and affordable interiors. Get an instant estimate from your room sizes." },
};

/** HVK Interiors has its own look and frame, separate from the tech site and the candidate portal. */
export default function InteriorsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`${playfair.variable} min-h-screen bg-[#f6f4ee] text-[#2f3d38]`}>
      <InteriorsHeader />
      <main id="main-content">{children}</main>
      <InteriorsFooter />
    </div>
  );
}
