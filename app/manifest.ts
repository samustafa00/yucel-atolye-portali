import type { MetadataRoute } from "next";
import { PORTAL_NAME, SCHOOL_NAME } from "@/lib/constants";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: `${SCHOOL_NAME} ${PORTAL_NAME}`,
    short_name: "Atölye Portalı",
    description: `${SCHOOL_NAME} atölyeleri için öğrenci, öğretmen ve veli portalı.`,
    start_url: "/",
    scope: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#f7fafc",
    theme_color: "#18202f",
    categories: ["education", "productivity"],
    lang: "tr",
    icons: [
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any"
      },
      {
        src: "/icons/icon-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable"
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any"
      },
      {
        src: "/icons/icon-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable"
      }
    ]
  };
}
