/** @type {import('next').NextConfig} */
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
};

export default nextConfig;
