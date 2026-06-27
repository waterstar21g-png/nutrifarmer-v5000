import path from 'path';
import { fileURLToPath } from 'url';
import type { NextConfig } from 'next';

/** Windows D: + C: AppData 분리 환경에서 nft.json trace 경로 오류 방지 */
const projectRoot = path.dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  outputFileTracingRoot: projectRoot,
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'www.nutrifarmer.kr', pathname: '/wp-content/uploads/**' },
      { protocol: 'https', hostname: 'old.nutrifarmer.kr', pathname: '/wp-content/uploads/**' },
      { protocol: 'http',  hostname: 'localhost', port: '8080', pathname: '/wp-content/uploads/**' },
      { protocol: 'https', hostname: 'media.nutrifarmer.kr', pathname: '/**' },
      { protocol: 'https', hostname: '*.r2.cloudflarestorage.com', pathname: '/**' },
      { protocol: 'https', hostname: '*.public.blob.vercel-storage.com', pathname: '/**' },
      { protocol: 'https', hostname: 'www.nutrifarmer.kr', pathname: '/api/v5000/files/**' },
      { protocol: 'https', hostname: 'nutrifarmer.kr', pathname: '/api/v5000/files/**' },
      { protocol: 'https', hostname: 'encrypted-tbn0.gstatic.com', pathname: '/**' },
    ],
  },
};

export default nextConfig;
