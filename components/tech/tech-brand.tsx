import Image from "next/image";
import { cn } from "@/lib/utils";

export function TechBrand({ className }: { className?: string }) {
  return (
    <a href="#home" aria-label="HVK home" className={cn("shrink-0", className)}>
      <Image
        src="/images/hvk-logo.png"
        alt="HVK logo"
        width={56}
        height={56}
        className="h-12 w-12 rounded-full object-contain sm:h-14 sm:w-14"
      />
    </a>
  );
}
