import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const site = getSiteUrl();
  const paths = [
    "",
    "/precos",
    "/funcionalidades",
    "/ajuda",
    "/contato",
    "/termos",
    "/privacidade",
  ];

  return paths.map((path) => ({
    url: `${site}${path}`,
    lastModified: new Date(),
    changeFrequency: path === "" ? "weekly" : "monthly",
    priority: path === "" ? 1 : 0.7,
  }));
}
