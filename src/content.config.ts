import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

const articles = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/articles" }),
  schema: z.object({
    num: z.string(),
    slug: z.string(),
    title: z.string(),
    subtitle: z.string(),
    badge: z.string(),
    description: z.string(),
    readTime: z.string(),
    stats: z.array(z.object({
      num: z.string(),
      label: z.string(),
    })).length(3),
    pubDate: z.date().optional(),
    draft: z.boolean().default(false),
  }),
});

export const collections = { articles };
