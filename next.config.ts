import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'www.nutrifarmer.kr', pathname: '/wp-content/uploads/**' },
      { protocol: 'http',  hostname: 'localhost', port: '8080', pathname: '/wp-content/uploads/**' },
      { protocol: 'https', hostname: 'media.nutrifarmer.kr', pathname: '/**' },
      { protocol: 'https', hostname: '*.r2.cloudflarestorage.com', pathname: '/**' },
    ],
  },
};

export default nextConfig;
