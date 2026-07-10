import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Why Medicine",
    short_name: "Why Medicine",
    description:
      "Online video courses built for medical school students, taught by practicing clinicians and academics.",
    start_url: "/",
    display: "standalone",
    background_color: "#faf8f2",
    theme_color: "#d0102e",
    icons: [
      { src: "/icon.png", sizes: "512x512", type: "image/png" },
      { src: "/apple-icon.png", sizes: "512x512", type: "image/png" },
    ],
  };
}
