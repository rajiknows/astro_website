import { glob } from "astro/loaders";
import { defineCollection, z } from "astro:content";

const blog = defineCollection({
    // Load Markdown and MDX files in the `src/content/blog/` directory.
    loader: glob({ base: "./src/content/blog", pattern: "**/*.{md,mdx}" }),
    // Type-check frontmatter using a schema
    schema: z.object({
        title: z.string(),
        description: z.string(),
        // Transform string to Date object
        pubDate: z.coerce.date(),
        updatedDate: z.coerce.date().optional(),
        heroImage: z.string().optional(),
    }),
});

const projects = defineCollection({
    // Load Markdown and MDX files in the `src/content/projects/` directory.
    loader: glob({ base: "./src/content/projects", pattern: "**/*.{md,mdx}" }),
    // Type-check frontmatter using a schema
    schema: z.object({
        title: z.string(),
        description: z.string(),
        priority: z.number().min(1).optional(), // the first priority is the currently building
        pubDate: z.coerce.date(),
        github: z.string().url().optional(),
        website: z.string().url().optional(),
        heroImage: z.string().url().optional(),
    }),
});

export const collections = { blog, projects };
