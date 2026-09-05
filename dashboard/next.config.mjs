const nextConfig = {
  output: 'standalone',
  transpilePackages: ["@pos/shared"],
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  experimental: {
    cpus: 1,
  },
};
export default nextConfig;
