import seoConfig from './(app)/seo/seo-config.json';

export default function sitemap() {
  const baseUrl = process.env.NEXTAUTH_URL || 'https://resume-pilot-lyart.vercel.app';

  const baseRoutes = [
    { url: baseUrl, lastModified: new Date(), changeFrequency: 'weekly', priority: 1.0 },
    { url: `${baseUrl}/login`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.7 },
    { url: `${baseUrl}/signup`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.8 },
    { url: `${baseUrl}/privacy`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.3 },
    { url: `${baseUrl}/terms`, lastModified: new Date(), changeFrequency: 'yearly', priority: 0.3 },
    { url: `${baseUrl}/ats-resume-guide`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.9 },
    { url: `${baseUrl}/fresher-resume-mistakes`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.9 },
  ];

  const seoRoutes = seoConfig.pages.map((page) => ({
    url: `${baseUrl}/${page.slug}`,
    lastModified: new Date(),
    changeFrequency: 'weekly',
    priority: 0.8,
  }));

  return [...baseRoutes, ...seoRoutes];
}

