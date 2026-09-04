import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
    ],
  },
  // Required for ONNX Runtime WebAssembly multi-threading (@imgly/background-removal)
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Cross-Origin-Opener-Policy',
            value: 'same-origin',
          },
          {
            key: 'Cross-Origin-Embedder-Policy',
            value: 'credentialless',
          },
        ],
      },
    ];
  },
  experimental: {
    serverComponentsExternalPackages: ['onnxruntime-node', '@imgly/background-removal'],
  },
  webpack: (config, { isServer }) => {
    // Allow WASM files to be loaded by ONNX Runtime
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        crypto: false,
        os: false,
      };

      config.resolve.alias = {
        ...config.resolve.alias,
        'onnxruntime-node': path.resolve(__dirname, 'empty.js'),
      }

      // Overwrite the problematic node-specific module with an empty string
      config.module.rules.push({
        test: /ort\.node\.min\.mjs$/,
        use: [path.resolve(__dirname, 'null-loader.js')]
      });

      // Tell Webpack not to even attempt parsing these Node files
      config.module.noParse = [
        ...(config.module.noParse ? (Array.isArray(config.module.noParse) ? config.module.noParse : [config.module.noParse]) : []),
        /onnxruntime-node/,
        /ort\.node\.min\.mjs$/
      ];
    }

    // Completely ignore onnxruntime-node for client and server builds
    config.externals = [...(config.externals || []), 'onnxruntime-node'];

    return config;
  },
};

export default nextConfig;
