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
      { src: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { src: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
      { src: "/icons/icon-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
    ],
  };
}
