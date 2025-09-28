import fs from "fs";
import matter from "gray-matter";
import { join } from "path";
import markdownToHtml from "./markdownToHtml";
import { remark } from "remark";
import html from "remark-html";

const postsDirectory = join(process.cwd(), "markdown/blogs");

export function getPostSlugs() {
  return fs.readdirSync(postsDirectory);
}

export async function getPostBySlug(slug: string, fields: string[] = []) {
  const realSlug = slug.replace(/\.mdx$/, "");
  const fullPath = join(postsDirectory, `${realSlug}.mdx`);
  const fileContents = fs.readFileSync(fullPath, "utf8");
  const { data, content } = matter(fileContents);

  const items: any = {};

  // Ensure only the minimal needed data is exposed
  for (const field of fields) {
    if (field === "slug") {
      items[field] = realSlug;
    } else if (field === "content") {
      // Convert the markdown content to HTML
      const htmlContent = await remark().use(html).process(content);
      items[field] = htmlContent.toString();
    } else if (field === "metadata") {
      // Include metadata, including the image information
      items[field] = { ...data, coverImage: data.coverImage || null };
    } else if (typeof data[field] !== "undefined") {
      items[field] = data[field];
    }
  }
  return items;
}

export async function getAllPosts(fields: string[] = []) {
  const slugs = getPostSlugs();
  const posts = await Promise.all(
    slugs.map(async (slug) => {
      return await getPostBySlug(slug, fields);
    })
  );

  // sort posts by date in descending order
  posts.sort((post1: any, post2: any) => (post1.date > post2.date ? -1 : 1));

  return posts;
}