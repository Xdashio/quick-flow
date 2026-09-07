const nextConfig = {
  transpilePackages: ["@pos/shared"],
  typescript: {
    ignoreBuildErrors: true,
  },
  experimental: {
    cpus: 1,
  },
};
export default nextConfig;
