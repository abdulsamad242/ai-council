/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ["@langchain/openai", "@langchain/core", "@tavily/core", "dotenv"],
  webpack(config) {
    config.resolve.extensionAlias = {
      ".js": [".ts", ".tsx", ".js", ".jsx"],
    };
    return config;
  },
};

export default nextConfig;
