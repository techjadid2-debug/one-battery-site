import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "ONE CORE",
    short_name: "ONE CORE",
    description: "Two robots. One core. No one gets left behind.",
    start_url: "/",
    display: "standalone",
    orientation: "landscape",
    background_color: "#061018",
    theme_color: "#061018",
    icons: [
      { src: "/favicon.png", sizes: "256x256", type: "image/png" },
      { src: "/pwa-512.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
