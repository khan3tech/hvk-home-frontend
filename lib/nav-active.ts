/** Which site-menu item is current for a page, so it can be highlighted. */
export interface ActiveNav {
  label: string;
  /** `page`: the whole page belongs to the item. `location`: a section of the page that is in view. */
  kind: "page" | "location";
}

const SECTION_LABEL: Record<string, string> = { services: "Services", testimonials: "Testimonials" };

/** Ids of the registration-page sections that have a menu item (watched while scrolling). */
export const WATCHED_SECTIONS = Object.keys(SECTION_LABEL);

export function activeNav(pathname: string, section: string | null): ActiveNav | null {
  // Every service page belongs to "Services", whichever service it is.
  if (pathname === "/services" || pathname.startsWith("/services/")) return { label: "Services", kind: "page" };
  if (pathname === "/registration") {
    const label = section ? SECTION_LABEL[section] : undefined;
    return label ? { label, kind: "location" } : { label: "Home", kind: "page" };
  }
  return null;
}
