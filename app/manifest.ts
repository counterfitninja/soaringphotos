import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Soaring Photos",
    short_name: "Soaring Photos",
    description: "Private photo and video sharing for our family",
    start_url: "/",
    display: "standalone",
    background_color: "#f5f5f5",
    theme_color: "#0369a1",
    icons: [
      { src: "/icon", sizes: "512x512", type: "image/png" },
      { src: "/apple-icon", sizes: "180x180", type: "image/png" },
    ],
  };
}
