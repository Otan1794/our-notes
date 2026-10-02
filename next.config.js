/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // Deliberately NOT a wildcard '**' hostname: that config lets anyone use
    // this app's /_next/image endpoint as a free image proxy for arbitrary
    // external sites (a known Next.js image-optimizer DoS/abuse pattern).
    // When link-preview scraping is added, append the specific domain(s)
    // it fetches thumbnails from here instead of widening this list.
    remotePatterns: [
      { protocol: 'https', hostname: '**.supabase.co' },
      { protocol: 'https', hostname: 'i.ytimg.com' }
    ]
  }
};

module.exports = nextConfig;
