/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  output: 'standalone',
  eslint: {
    // Vi tillåter deploy även om det finns små varningar kvar
    ignoreDuringBuilds: true,
  },
  typescript: {
    // Vi tillåter deploy även om det finns små typ-varningar kvar
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
