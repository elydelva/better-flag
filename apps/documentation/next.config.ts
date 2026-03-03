import { createMDX } from "fumadocs-mdx/next";
import type { NextConfig } from "next";

const config: NextConfig = {
  reactStrictMode: true,
};

const withMDX = createMDX({
  configPath: "source.config.ts",
});

export default withMDX(config);
