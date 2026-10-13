export async function onRequestGet(context) {
  const { env } = context;

  const SUPABASE_URL = env.SUPABASE_URL;
  const SUPABASE_SERVICE_ROLE_KEY = env.SUPABASE_SERVICE_ROLE_KEY;
  const SITE_URL = 'https://addyverse.pages.dev';

  const staticPages = [
    '',
    'ebooks',
    'articles',
    'categories',
    'about',
    'contact',
  ];

  let ebookSlugs = [];
  let articleSlugs = [];

  try {
    const ebooksRes = await fetch(
      `${SUPABASE_URL}/rest/v1/ebooks?select=slug,updated_at&is_published=eq.true`,
      {
        headers: {
          apikey: SUPABASE_SERVICE_ROLE_KEY,
          Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        },
      }
    );
    ebookSlugs = await ebooksRes.json();

    const articlesRes = await fetch(
      `${SUPABASE_URL}/rest/v1/articles?select=slug,updated_at&is_published=eq.true`,
      {
        headers: {
          apikey: SUPABASE_SERVICE_ROLE_KEY,
          Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        },
      }
    );
    articleSlugs = await articlesRes.json();
  } catch (err) {
    ebookSlugs = [];
    articleSlugs = [];
  }

  let urls = staticPages.map((page) => {
    return `
  <url>
    <loc>${SITE_URL}/${page}</loc>
    <changefreq>weekly</changefreq>
    <priority>${page === '' ? '1.0' : '0.8'}</priority>
  </url>`;
  });

  if (Array.isArray(ebookSlugs)) {
    urls = urls.concat(
      ebookSlugs.map((e) => {
        return `
  <url>
    <loc>${SITE_URL}/ebooks/${e.slug}</loc>
    <lastmod>${e.updated_at ? e.updated_at.split('T')[0] : ''}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>`;
      })
    );
  }

  if (Array.isArray(articleSlugs)) {
    urls = urls.concat(
      articleSlugs.map((a) => {
        return `
  <url>
    <loc>${SITE_URL}/articles/${a.slug}</loc>
    <lastmod>${a.updated_at ? a.updated_at.split('T')[0] : ''}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>`;
      })
    );
  }

  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join('')}
</urlset>`;

  return new Response(sitemap, {
    headers: {
      'Content-Type': 'application/xml',
    },
  });
}
