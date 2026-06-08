import { MetadataRoute } from 'next';
import { getPublishedBlogs } from './actions/blog';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Fetch dynamic blog routes
  const blogs = await getPublishedBlogs();
  
  const blogEntries: MetadataRoute.Sitemap = blogs.map((blog) => ({
    url: `https://jobing.site/blog/${blog.permalink}`,
    lastModified: new Date(blog.created_at),
    changeFrequency: 'weekly',
    priority: 0.8,
  }));

  // Define static core routes
  const staticEntries: MetadataRoute.Sitemap = [
    {
      url: 'https://jobing.site',
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 1,
    },
    {
      url: 'https://jobing.site/tools',
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: 'https://jobing.site/blog',
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: 'https://jobing.site/copy',
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: 'https://jobing.site/online-notepad',
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: 'https://jobing.site/online-clipboard',
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: 'https://jobing.site/share-text',
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: 'https://jobing.site/create',
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: 'https://jobing.site/resumes',
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: 'https://jobing.site/profile',
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
  ];

  return [...staticEntries, ...blogEntries];
}
