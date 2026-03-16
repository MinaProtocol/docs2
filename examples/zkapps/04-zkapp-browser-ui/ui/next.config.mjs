import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  webpack(config, { isServer }) {
    if (!isServer) {
      config.resolve.alias = {
        ...config.resolve.alias,
        o1js: path.resolve(__dirname, 'node_modules/o1js/dist/web/index.js'),
      };
    } else {
      config.externals.push('o1js') // https://nextjs.org/docs/app/api-reference/next-config-js/serverExternalPackages
    }
    config.experiments = { ...config.experiments, topLevelAwait: true };
    config.optimization.minimizer = [];
    return config;
  },
  // To enable o1js for the web, we must set the COOP and COEP headers.
  // See here for more information: https://docs.minaprotocol.com/zkapps/how-to-write-a-zkapp-ui#enabling-coop-and-coep-headers
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
            value: 'require-corp',
          },
        ],
      },
    ];
  },
  images: {
    unoptimized: true,
  },
  output: 'export',
  /* Used to serve the Next.js app from a subdirectory (the GitHub repo name) and
   * assetPrefix is used to serve assets (JS, CSS, images, etc.) from that subdirectory
   * when deployed to GitHub Pages. The assetPrefix needs to be added manually to any assets
   * if they're not loaded by Next.js' automatic handling (for example, in CSS files or in a <img> element).
   * The 'ghp-postbuild.js' script in this project prepends the repo name to asset urls in the built css files
   * after running 'npm run deploy'.
   */
  basePath: process.env.NODE_ENV === 'production' ? '/04-zkapp-browser-ui' : '', // update if your repo name changes for 'npm run deploy' to work correctly
  assetPrefix: process.env.NODE_ENV === 'production' ? '/04-zkapp-browser-ui/' : '', // update if your repo name changes for 'npm run deploy' to work correctly
};

export default nextConfig;
