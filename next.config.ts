import type { NextConfig } from "next";

const repo = process.env.GITHUB_REPOSITORY?.split("/")[1];
const owner = process.env.GITHUB_REPOSITORY?.split("/")[0];

const isGitHubActions = process.env.GITHUB_ACTIONS === "true";
const isUserPage = repo === `${owner}.github.io`;

const nextConfig: NextConfig = {
  // Generar una versión estática para GitHub Pages
  output: "export",

  // Configurar la subruta del repositorio
  basePath: isGitHubActions && repo && !isUserPage ? `/${repo}` : "",

  // Permitir imágenes en exportación estática
  images: {
    unoptimized: true,
  },

  experimental: {
    agentFeedback: true,
  },

  cacheComponents: true,
  partialPrefetching: true,

  turbopack: {
    root: process.cwd(),
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
