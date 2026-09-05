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
      { src: "/icon.jpeg", sizes: "1123x1199", type: "image/jpeg" },
      { src: "/apple-icon.jpeg", sizes: "1123x1199", type: "image/jpeg" },
    ],
  };
}
