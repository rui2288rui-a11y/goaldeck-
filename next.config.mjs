/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // ESLint を導入していなくてもビルドが止まらないようにしています。
  eslint: { ignoreDuringBuilds: true },
};

export default nextConfig;
