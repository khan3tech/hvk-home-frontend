/** @type {import('next').NextConfig} */

// When set (e.g. on Amplify), the browser calls this site's own /api/* and Next.js forwards it to the backend.
// This keeps the page and the API on one HTTPS origin, so an HTTP-only backend still works and the refresh
// cookie stays first-party. Then set NEXT_PUBLIC_API_BASE_URL to this site's own URL.
const backendOrigin = process.env.BACKEND_ORIGIN?.replace(/\/$/, "");

const nextConfig = {
  output: "standalone",
  images: {
    formats: ["image/avif", "image/webp"],
  },
  // Legacy flows from the previous backend (payment links, magic-link exam access).
  async redirects() {
    return [
      { source: "/registration/callback", destination: "/dashboard", permanent: false },
      { source: "/exam/access/:token", destination: "/login?next=/exam", permanent: false },
    ];
  },
  async rewrites() {
    return backendOrigin ? [{ source: "/api/:path*", destination: `${backendOrigin}/api/:path*` }] : [];
  },
};

export default nextConfig;
