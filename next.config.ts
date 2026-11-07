import type { NextConfig } from "next";

const repo = process.env.GITHUB_REPOSITORY?.split("/")[1];
const owner = process.env.GITHUB_REPOSITORY?.split("/")[0];

const isGitHubActions = process.env.GITHUB_ACTIONS === "true";
const isUserPage = repo === `${owner}.github.io`;
const basePath = isGitHubActions && repo && !isUserPage ? `/${repo}` : "";

const nextConfig: NextConfig = {
  output: "export",

  basePath,
  trailingSlash: true,

  env: {
    NEXT_PUBLIC_BASE_PATH: basePath,
  },

  images: {
    unoptimized: true,
  },

  turbopack: {
    root: process.cwd(),
  },
};

export default nextConfig;
