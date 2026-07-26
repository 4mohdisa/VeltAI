import type { MetadataRoute } from 'next';

import { SITE_URL } from '@/lib/site';

export const dynamic = 'force-static';

export default function sitemap(): MetadataRoute.Sitemap {
  const page = (path: string, priority: number): MetadataRoute.Sitemap[number] => ({
    url: `${SITE_URL}${path}`,
    lastModified: new Date('2026-07-26'),
    changeFrequency: 'monthly',
    priority,
  });
  return [
    page('/', 1),
    page('/faq/', 0.7),
    page('/support/', 0.5),
    page('/security/', 0.5),
    page('/privacy/', 0.3),
    page('/terms/', 0.3),
  ];
}
