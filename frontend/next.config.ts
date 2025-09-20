import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.vercel-storage.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'fummzkny8emtgsza.public.blob.vercel-storage.com',
        port: '',
        pathname: '/**',
      },
      // Allow existing credit card issuer domains for backwards compatibility
      {
        protocol: 'https',
        hostname: 'creditcards.chase.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'www.americanexpress.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'www.bankofamerica.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'www.amazon.com',
        port: '',
        pathname: '/**',
      }
    ],
  },
};

export default nextConfig;
